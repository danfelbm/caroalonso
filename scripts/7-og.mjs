/**
 * TARJETAS DE COMPARTIR (Open Graph) E ICONOS DEL SITIO.
 *
 *   npm run og                # las dieciséis tarjetas y los dos iconos
 *   npm run og -- tarjetas    # solo las tarjetas
 *   npm run og -- iconos      # solo icon.png y apple-icon.png
 *
 * ## Por qué por captura y no con `ImageResponse`
 *
 * Cada tarjeta se compone como una página HTML de 1200 × 630 y se fotografía
 * con un Chromium de Playwright. `ImageResponse` (satori) admite un subconjunto
 * pequeño de CSS, quiere las fuentes como ArrayBuffer y no sabe pintar el
 * subrayado manuscrito ni el grano. Aquí vale cualquier CSS, así que la tarjeta
 * es literalmente el sitio a 1200 × 630: la misma Newsreader, la misma paleta,
 * el mismo grano y el mismo trazo de rotulador.
 *
 * ## Las tres trampas, y cómo se evitan
 *
 * 1. **Las fuentes.** No se piden a Google: se sacan del `@font-face` que
 *    escribió `next build` en `.next/static/chunks/*.css` y se incrustan en
 *    base64. Son BYTE A BYTE los mismos woff2 que sirve el sitio, así que la
 *    tipografía no se parece a la del sitio, es la del sitio. De paso
 *    desaparece la red durante la captura. Aun así se espera a
 *    `document.fonts.ready` y se COMPRUEBA con `document.fonts.check()`: si
 *    alguna cara no cargó, el script se para en vez de escribir dieciséis
 *    tarjetas en la serif del sistema, que es un fallo que solo se ve mirando.
 *
 * 2. **Las imágenes.** Portadas y retrato van incrustados en base64. Con rutas
 *    de archivo, la captura se dispara antes de que carguen y donde debería
 *    estar la portada sale un hueco del color del fondo.
 *
 * 3. **Un solo Chromium** para las dieciséis. Abrir uno por tarjeta tarda diez
 *    veces más, y este navegador es propio del script: el del MCP lo comparten
 *    varios agentes.
 *
 * ## Antes de correrlo
 *
 * Hace falta un `npm run build` previo: de ahí salen los woff2. Si no están,
 * el script lo dice y se para.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "playwright";
import sharp from "sharp";

const RAIZ = join(import.meta.dirname, "..");
const DESTINO = join(RAIZ, "public", "og");
const ANCHO = 1200;
const ALTO = 630;

/**
 * Se fotografía al doble y se reduce con lanczos. El trazo del subrayado mide
 * menos de dos píxeles en su parte fina: a 1× el antialiasing del navegador lo
 * deja sucio, y reducir desde 2× lo entrega limpio. Cuesta cuatro veces más
 * píxeles por captura y sigue siendo cuestión de segundos.
 */
const ESCALA = 2;

const filtro = process.argv[2] ?? "todo";

const leerJson = (nombre) => JSON.parse(readFileSync(join(RAIZ, "src", "data", nombre), "utf8"));
const sitio = leerJson("sitio.json");
const libros = leerJson("libros.json").slice().sort((a, b) => b.anio - a.anio);
const quienSoy = leerJson("quien-soy.json");
const servicios = leerJson("servicios.json");
const recomendaciones = leerJson("recomendaciones.json");
const podcast = leerJson("podcast.json");

const DOMINIO = sitio.identidad.dominio;

/* ------------------------------------------------------------------ paleta */

/** Los mismos valores de `globals.css`. Un script .mjs no puede leer el @theme. */
const COLOR = {
  papel: "#FBF8F6",
  marino: "#051324",
  marinoTinta: "#192D41",
  mentaNiebla: "#E0F7F1",
  mentaClara: "#D3F5EC",
  menta: "#C2EFE3",
  amarilloClaro: "#FAF1C7",
  mantequilla: "#F9F1DC",
  azul: "#265C9F",
  celeste: "#C3E9FE",
  rosa: "#FDF3F1",
  lavandaClaro: "#E2EFFF",
};

/* Copias literales de `src/lib/color.ts`: el script no puede importar TS. */
const canales = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

function esOscuro(hex) {
  const [r, g, b] = canales(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.55;
}

/** Tinta, texto secundario y trazo legibles sobre un fondo dado. */
function contraste(hex) {
  const oscuro = esOscuro(hex);
  return {
    oscuro,
    texto: oscuro ? COLOR.papel : COLOR.marino,
    suave: oscuro ? "rgba(251,248,246,0.72)" : "rgba(5,19,36,0.65)",
    tenue: oscuro ? "rgba(251,248,246,0.5)" : "rgba(5,19,36,0.46)",
    // Sobre marino el rotulador es menta, como en la portada y en Reconexión:
    // el azul del subrayado sobre marino se pierde.
    trazo: oscuro ? COLOR.menta : COLOR.azul,
  };
}

function luminancia(hex) {
  const [r, g, b] = canales(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function mezclarConTinta(hex, factor) {
  const tinta = [0x05, 0x13, 0x24];
  return `#${canales(hex)
    .map((c, i) => Math.round(c * (1 - factor) + tinta[i] * factor).toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * El color de portada, oscurecido hasta que se lea sobre el fondo que le toque.
 * Es lo que hace `paletaLibro()` en el sitio: crudo, el amarillo de «Reinventa
 * el amor» sobre su lavanda se queda en 1,25:1.
 */
function colorTexto(hex, fondo) {
  let color = hex;
  for (let i = 0; i < 12 && ratio(color, fondo) < 4.5; i += 1) color = mezclarConTinta(color, 0.12);
  return color;
}

/* ------------------------------------------------------------------ fuentes */

/**
 * El `@font-face` del sitio, con los woff2 metidos en la propia hoja de estilo.
 *
 * `next build` deja en `.next/static/chunks/` una hoja con las declaraciones
 * exactas —familia, estilo, peso y `unicode-range` de cada subconjunto— y los
 * archivos en `.next/static/media/`. Se sustituye cada `url(../media/…)` por su
 * data URI y el HTML queda autosuficiente.
 */
function fuentesIncrustadas() {
  const chunks = join(RAIZ, ".next", "static", "chunks");
  const media = join(RAIZ, ".next", "static", "media");

  if (!existsSync(chunks) || !existsSync(media)) {
    throw new Error(
      "No hay construcción de la que sacar las fuentes. Corre `npm run build` antes que `npm run og`.",
    );
  }

  const hojas = readdirSync(chunks).filter((f) => f.endsWith(".css"));
  const reglas = [];

  for (const hoja of hojas) {
    const css = readFileSync(join(chunks, hoja), "utf8");
    for (const [regla] of css.matchAll(/@font-face\{[^}]*\}/g)) {
      // Solo las dos familias reales. Las caras «… Fallback» son métricas de
      // respaldo con `local()`: si se colaran y la buena tardara, el titular
      // saldría en Times con las proporciones de Newsreader, que es justo el
      // fallo silencioso que este script tiene que hacer imposible.
      if (!/font-family:(Newsreader|Inter);/.test(regla)) continue;
      reglas.push(
        regla.replace(/url\(\.\.\/media\/([^)]+)\)/g, (_, archivo) => {
          const bytes = readFileSync(join(media, archivo));
          return `url(data:font/woff2;base64,${bytes.toString("base64")})`;
        }),
      );
    }
  }

  if (!reglas.length) throw new Error("La construcción no trae ningún @font-face de Newsreader ni de Inter.");
  return reglas.join("\n");
}

/* ------------------------------------------------------------------ piezas */

/** La firma manuscrita, en línea para que herede el color del contexto. */
function firma(color, alto = 40) {
  const svg = readFileSync(join(RAIZ, "public", "marca", "firma.svg"), "utf8");
  /*
   * En línea y no `<img src="firma.svg">`: el SVG lleva `fill="currentColor"`
   * y, cargado como imagen, sería otro documento donde `currentColor` se
   * resuelve a negro. Es el mismo motivo por el que `marca.tsx` lo inyecta
   * como <symbol> en el layout.
   */
  return svg
    .replace("<svg", `<svg style="height:${alto}px;width:auto;flex:none;color:${color};display:block"`)
    .replace(/ role="img"| aria-label="[^"]*"/g, "");
}

/** Imagen de `public/` reducida y en base64. */
const cacheImagenes = new Map();
async function imagen(ruta, ancho) {
  const clave = `${ruta}@${ancho}`;
  if (cacheImagenes.has(clave)) return cacheImagenes.get(clave);
  const archivo = join(RAIZ, "public", ruta);
  if (!existsSync(archivo)) throw new Error(`Falta la imagen ${ruta}: corre \`npm run assets:optimizar\`.`);
  const buffer = await sharp(archivo).resize({ width: ancho, withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
  const uri = `data:image/webp;base64,${buffer.toString("base64")}`;
  cacheImagenes.set(clave, uri);
  return uri;
}

const escapar = (texto) =>
  String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * El titular con la última palabra en itálica y su trazo de rotulador debajo.
 *
 * La curva es la variante `onda` de `src/components/ui/subrayado.tsx`, copiada
 * tal cual: es la firma visual del sitio y una versión «parecida» se notaría al
 * poner la tarjeta al lado de la página. Aquí va dibujada del todo —sin
 * `stroke-dasharray`—, porque una captura no tiene por dónde animarse.
 */
const CURVA_ONDA =
  "M2 8.6c16 3.4 33 3.9 50 1.5 17-2.4 34-2.8 50-1.2 16 1.6 32 2 48-.9 12-2.2 24-2.4 48-.6";

function subrayado(palabra, color) {
  return `<span class="subrayado"><em>${escapar(palabra)}</em><svg viewBox="0 0 200 12" preserveAspectRatio="none"><path d="${CURVA_ONDA}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg></span>`;
}

/**
 * Parte un titular por su última palabra, que es la que lleva el trazo.
 * Es la misma regla que usan `/quien-soy` y las siete fichas de libro.
 */
function titularConTrazo(texto, color) {
  const palabras = texto.trim().split(/\s+/);
  const ultima = palabras.pop();
  return `${palabras.length ? `${escapar(palabras.join(" "))} ` : ""}${subrayado(ultima, color)}`;
}

/** Titular corto, cuerpo grande: a tamaño de miniatura se lee mejor. */
const cuerpo = (texto, escala) => {
  const largo = texto.length;
  const [xl, lg, md, sm] = escala;
  return largo <= 22 ? xl : largo <= 42 ? lg : largo <= 66 ? md : sm;
};

/* ------------------------------------------------------------------ página */

/**
 * El grano de `globals.css`, byte a byte. Ruido fractal en un SVG de 300 bytes,
 * multiplicado a baja opacidad: es lo que evita que un color plano a sangre
 * parezca plástico.
 */
const GRANO =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)' opacity='0.4'/%3E%3C/svg%3E\")";

const FUENTES = fuentesIncrustadas();

function documento({ fondo, contenido }) {
  const c = contraste(fondo);
  return `<!doctype html><html lang="es-CO"><head><meta charset="utf-8"><style>
${FUENTES}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${ANCHO}px;height:${ALTO}px;overflow:hidden}
body{
  background:${fondo};
  color:${c.texto};
  font-family:Inter,ui-sans-serif,system-ui,sans-serif;
  font-size:17px;line-height:1.6;
  -webkit-font-smoothing:antialiased;
  position:relative;
}
/* La misma capa de grano que la utilidad «grano» del sitio. */
.grano{position:absolute;inset:0;pointer-events:none;background-image:${GRANO};background-size:200px 200px;opacity:.42;mix-blend-mode:multiply}
.lienzo{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:56px 72px}
.eyebrow{font-family:Inter,sans-serif;font-size:16px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;line-height:1.2}
h1{font-family:Newsreader,Georgia,serif;font-weight:400;letter-spacing:-.02em;line-height:1.04;text-wrap:balance}
h1 em{font-style:italic}
.entradilla{font-size:24px;line-height:1.5;color:${c.suave};text-wrap:pretty}
/* El envoltorio del trazo: mismas medidas que subrayado.tsx. */
.subrayado{position:relative;display:inline-block;white-space:nowrap}
.subrayado svg{position:absolute;left:0;right:0;top:calc(100% - .09em);height:max(.3em,7px);width:100%;overflow:visible;pointer-events:none}
.cabecera,.pie{display:flex;align-items:center;justify-content:space-between;gap:24px}
.cifras{font-variant-numeric:tabular-nums}
</style></head><body>${contenido}<div class="grano"></div></body></html>`;
}

/**
 * La tarjeta base: firma arriba, titular en medio, dominio abajo.
 *
 * `arte` es la columna derecha —una portada, un retrato— y cuando la hay el
 * titular se estrecha en vez de encogerse: un libro con su portada al lado no
 * necesita un titular más pequeño, necesita menos ancho.
 */
function tarjeta({ fondo, eyebrow, titulo, palabraTrazo, entradilla, dato, arte, trazo }) {
  const c = contraste(fondo);
  const colorTrazo = trazo ?? c.trazo;
  // Si la palabra pedida no está en el titular se subraya la última, que es
  // la regla por defecto: se pierde el énfasis elegido, nunca el titular.
  const corte = palabraTrazo ? titulo.lastIndexOf(palabraTrazo) : -1;
  const texto =
    corte === -1
      ? titularConTrazo(titulo, colorTrazo)
      : `${escapar(titulo.slice(0, corte))}${subrayado(palabraTrazo, colorTrazo)}${escapar(titulo.slice(corte + palabraTrazo.length))}`;

  const columna = `
    <div class="cabecera">
      ${firma(c.texto)}
      ${eyebrow ? `<p class="eyebrow" style="color:${c.tenue}">${escapar(eyebrow)}</p>` : ""}
    </div>
    <div>
      <h1 style="font-size:${cuerpo(titulo, arte ? [64, 56, 48, 40] : [90, 76, 62, 52])}px;max-width:${arte ? "13ch" : "17ch"}">${texto}</h1>
      ${entradilla ? `<p class="entradilla" style="margin-top:${arte ? 20 : 26}px;max-width:${arte ? "34ch" : "46ch"};font-size:${arte ? 21 : 24}px">${escapar(entradilla)}</p>` : ""}
    </div>
    <div class="pie">
      <p class="eyebrow" style="color:${c.texto}">${escapar(DOMINIO)}</p>
      ${dato ? `<p class="eyebrow cifras" style="color:${c.tenue}">${escapar(dato)}</p>` : ""}
    </div>`;

  if (!arte) return documento({ fondo, contenido: `<div class="lienzo">${columna}</div>` });

  return documento({
    fondo,
    contenido: `<div class="lienzo" style="flex-direction:row;gap:56px;align-items:stretch">
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between">${columna}</div>
      <div style="flex:0 0 ${arte.ancho}px;display:flex;align-items:center;justify-content:center">${arte.html}</div>
    </div>`,
  });
}

/* --------------------------------------------------------------- tarjetas */

async function tarjetasFijas() {
  const { identidad } = sitio;
  const reconexion = servicios.find((s) => s.slug === "reconexion");
  const retrato = await imagen("/retratos/retrato-quien-soy.webp", 760);

  return [
    /*
     * El fondo de cada tarjeta es el de la PRIMERA sección de su página. Cuando
     * ese color ya lo lleva otra tarjeta del grupo, se toma el de la segunda
     * sección de la misma página: así ninguna se repite y ninguna se inventa un
     * color que no esté en el sitio.
     */
    {
      nombre: "portada",
      // El hero es el video del mar de noche: marino, como la última banda de
      // la portada. Es la única tarjeta oscura del grupo y es la que más se ve.
      html: tarjeta({
        fondo: COLOR.marino,
        eyebrow: identidad.oficio,
        titulo: "¿Perdiste tu norte?",
        palabraTrazo: "norte",
        entradilla: identidad.lema,
        dato: "Escritora · Bogotá",
      }),
    },
    {
      nombre: "quien-soy",
      // Papel, como su propia cabecera: el retrato pide un fondo neutro.
      html: tarjeta({
        fondo: COLOR.papel,
        eyebrow: quienSoy.titulo,
        titulo: quienSoy.titular,
        entradilla: "«Las historias me han cambiado la vida varias veces.»",
        dato: "Filósofa y coach",
        arte: {
          ancho: 340,
          html: `<img src="${retrato}" style="width:100%;height:auto;max-height:100%;object-fit:cover;border-radius:20px;box-shadow:0 2px 6px rgb(5 19 36 / .04), 0 18px 48px rgb(5 19 36 / .1)">`,
        },
      }),
    },
    {
      nombre: "se-la-heroina",
      // Su cabecera va en el rosa del libro, que ya lleva la ficha: la menta es
      // el otro color de la casa (la píldora, los botones) y las separa.
      html: tarjeta({
        fondo: COLOR.menta,
        eyebrow: "El libro y su casa",
        // Sin `palabraTrazo`: la página subraya «heroína», pero aquí el titular
        // parte en dos y el trazo caería sobre la línea de abajo (ver la
        // comprobación del renglón, más abajo). Va bajo la última palabra, que
        // es la regla de las siete fichas.
        titulo: "Sé la heroína de tu historia",
        entradilla: "Nueve episodios en video, tres entrevistas y el camino de regreso a ti misma.",
        dato: "Planeta · 2021",
      }),
    },
    {
      nombre: "libros",
      html: tarjeta({
        fondo: COLOR.mentaNiebla,
        eyebrow: "Obra publicada",
        titulo: "Siete libros, veinte años de escritura",
        entradilla:
          "Del primer libro de relatos al ensayo sobre la soledad que publicó Planeta.",
        dato: "2004 – 2024",
      }),
    },
    {
      nombre: "reconexion",
      // Marino tinta: el fondo real de su cabecera.
      html: tarjeta({
        fondo: COLOR.marinoTinta,
        eyebrow: "Acompañamiento presencial",
        titulo: reconexion.nombre,
        entradilla: reconexion.definicion,
        dato: `Bogotá · USD $${reconexion.precio.cantidad}`,
      }),
    },
    {
      nombre: "recomendaciones",
      // Su cabecera es menta niebla, que ya lleva «Libros»: el amarillo claro
      // es la banda que cierra esa misma página.
      html: tarjeta({
        fondo: COLOR.amarilloClaro,
        eyebrow: `${recomendaciones.length} recomendaciones`,
        titulo: "Lo que leo, escucho y veo cuando no estoy escribiendo",
        entradilla: "El comentario de cada una es el que escribí entonces.",
        dato: "2020 – 2021",
      }),
    },
    {
      nombre: "podcast",
      html: tarjeta({
        fondo: COLOR.lavandaClaro,
        eyebrow: "Podcast y canales",
        titulo: "Historias para escuchar despacio",
        palabraTrazo: "escuchar",
        entradilla: podcast.programa.nombre,
        dato: "Spotify · YouTube",
      }),
    },
    {
      nombre: "contacto",
      // Su cabecera es amarillo claro, que ya lleva «Recomendaciones»; la menta
      // clara es la banda de cierre de la propia página de contacto.
      html: tarjeta({
        fondo: COLOR.mentaClara,
        eyebrow: "Contacto",
        titulo: "Cuéntame qué te trajo hasta aquí",
        entradilla:
          "Una pregunta sobre un libro, una idea que te dio vueltas mientras leías, un proceso que quieres empezar.",
        dato: sitio.contacto.ciudad,
      }),
    },
    {
      nombre: "404",
      /*
       * El 404 lleva `noindex`, así que esta tarjeta no es para el buscador: es
       * para cuando alguien pega un enlace roto en un chat. Sin ella, el chat
       * enseña la tarjeta de la portada y quien la recibe cree que llegó bien.
       */
      html: tarjeta({
        fondo: COLOR.mantequilla,
        eyebrow: "Error 404",
        titulo: "Aquí se perdió el norte",
        entradilla: "La dirección que buscas no existe o cambió de lugar.",
        dato: "Vuelve al inicio",
      }),
    },
  ];
}

async function tarjetasDeLibros() {
  const tareas = [];

  for (const libro of libros) {
    const portada = await imagen(`/libros/${libro.portada}.webp`, 860);
    // El acento del libro, oscurecido hasta leerse sobre su propia banda: es
    // exactamente lo que hace `paletaLibro()` en la ficha.
    const acento = colorTexto(libro.colorPortada, libro.colorSeccion);

    tareas.push({
      nombre: join("libros", libro.slug),
      html: tarjeta({
        fondo: libro.colorSeccion,
        eyebrow: [libro.anio, libro.editorial ?? libro.genero].join(" · "),
        titulo: libro.titulo,
        trazo: acento,
        entradilla: libro.subtitulo ?? libro.resumen,
        dato: libro.estado === "en-libreria" ? "En librerías" : "Solo consulta",
        arte: {
          ancho: 400,
          /*
           * `max-width` y `max-height` sin ancho ni alto fijos: las siete
           * portadas tienen proporciones distintas —de 0,64 a 2,18— y una caja
           * única le cortaría el título a alguna. Así la caja del <img> es la
           * imagen, y la sombra proyectada (`--shadow-portada`) la abraza sin
           * dejar aire de más a los lados.
           */
          html: `<img src="${portada}" style="max-width:100%;max-height:430px;width:auto;height:auto;display:block;border-radius:12px;box-shadow:0 2px 4px rgb(5 19 36 / .08), 0 14px 28px rgb(5 19 36 / .16), 0 36px 64px rgb(5 19 36 / .24)">`,
        },
      }),
    });
  }

  return tareas;
}

/* --------------------------------------------------------------- iconos */

/**
 * EL ICONO DEL SITIO, RECORTADO DE LA FIRMA.
 *
 * El logotipo entero mide 354,9 × 72,1 —4,9 a 1—: a 32 píxeles de alto sería
 * una raya de 157 de ancho, ilegible y recortada por el navegador. Así que se
 * usa solo la inicial.
 *
 * La «C» de Carolina es el PRIMER trazado del SVG original y no toca a los
 * demás, así que se puede aislar sin recortar a ojo: se pinta sola, se mide su
 * caja de tinta a 8× y de ahí sale el recorte. Si algún día se redibuja la
 * firma, el recorte se recalcula solo.
 *
 * Ocupa el 68 % del alto del lienzo, centrada. No es un número al azar: Android
 * recorta los iconos `maskable` a la forma del lanzador y solo respeta un
 * círculo del 80 % del lado. Con la «C» a 68 % de alto y 38 % de ancho, la
 * esquina más lejana cae a 0,39 del centro — dentro de ese círculo.
 */
const PARTE_SEGURA = 0.68;

async function generarIconos() {
  const svg = readFileSync(join(RAIZ, "arte", "originales", "logovector.svg"), "utf8");
  const inicial = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)][0]?.[1];
  if (!inicial) throw new Error("No se encontró ningún trazado en arte/originales/logovector.svg");

  // 8× el tamaño nominal: sobra resolución para recortar y luego reducir a 512
  // sin que el pelo del trazo se convierta en escalones.
  const documentoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 354.9 72.1" width="5914" height="1202"><path fill="${COLOR.marino}" d="${inicial}"/></svg>`;
  const lienzo = Buffer.from(documentoSvg);

  const { data, info } = await sharp(lienzo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width;
  let y0 = info.height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      // Umbral bajo: el trazo termina en punta y su último píxel es casi
      // transparente. Cortar por 128 le comería la cola a la «C».
      if (data[(y * info.width + x) * info.channels + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }

  const ancho = x1 - x0 + 1;
  const alto = y1 - y0 + 1;
  const recorte = await sharp(lienzo).extract({ left: x0, top: y0, width: ancho, height: alto }).png().toBuffer();

  async function icono(lado, destino) {
    const altoGlifo = Math.round(lado * PARTE_SEGURA);
    const anchoGlifo = Math.max(1, Math.round((altoGlifo * ancho) / alto));
    const glifo = await sharp(recorte)
      .resize({ width: anchoGlifo, height: altoGlifo, fit: "fill", kernel: "lanczos3" })
      .png()
      .toBuffer();

    await sharp({ create: { width: lado, height: lado, channels: 4, background: COLOR.papel } })
      .composite([
        {
          input: glifo,
          left: Math.round((lado - anchoGlifo) / 2),
          top: Math.round((lado - altoGlifo) / 2),
        },
      ])
      .png({ compressionLevel: 9 })
      .toFile(destino);
  }

  const app = join(RAIZ, "src", "app");
  // 512 para el manifiesto y para que el navegador tenga de dónde reducir;
  // 180 es el tamaño que pide iOS para la pantalla de inicio.
  await icono(512, join(app, "icon.png"));
  await icono(180, join(app, "apple-icon.png"));

  /*
   * El icono real de una pestaña son 32 píxeles. Se genera aquí y se guarda
   * como .ico —un contenedor con un PNG dentro, que es lo que admite el formato
   * desde Vista— por dos razones: es la única forma de que `/favicon.ico`
   * responda 200 en vez de 404, y es un corte hecho a ese tamaño en vez de una
   * reducción que decide el navegador.
   */
  const temporal = join(app, ".icono-32.png");
  await icono(32, temporal);
  const png32 = readFileSync(temporal);
  unlinkSync(temporal);

  writeFileSync(join(app, "favicon.ico"), envolverEnIco(png32, 32));
  console.log("Iconos: icon.png (512), apple-icon.png (180), favicon.ico (32)");
}

/**
 * Cabecera ICO de 22 bytes alrededor de un PNG.
 *
 * El formato admite entradas PNG tal cual desde Windows Vista y lo entienden
 * todos los navegadores vivos; sharp no sabe escribir .ico, así que la cabecera
 * se arma a mano. Es literalmente: «un icono, de 32×32, con estos bytes».
 */
function envolverEnIco(png, lado) {
  const cabecera = Buffer.alloc(22);
  cabecera.writeUInt16LE(0, 0); // reservado
  cabecera.writeUInt16LE(1, 2); // tipo: icono
  cabecera.writeUInt16LE(1, 4); // una sola imagen
  cabecera.writeUInt8(lado % 256, 6); // ancho (0 significaría 256)
  cabecera.writeUInt8(lado % 256, 7); // alto
  cabecera.writeUInt8(0, 8); // colores de la paleta: ninguna
  cabecera.writeUInt8(0, 9); // reservado
  cabecera.writeUInt16LE(1, 10); // planos
  cabecera.writeUInt16LE(32, 12); // bits por píxel
  cabecera.writeUInt32LE(png.length, 14);
  cabecera.writeUInt32LE(22, 18); // desplazamiento hasta los datos
  return Buffer.concat([cabecera, png]);
}

/* --------------------------------------------------------------- captura */

async function capturarTarjetas() {
  mkdirSync(join(DESTINO, "libros"), { recursive: true });

  const tareas = [...(await tarjetasFijas()), ...(await tarjetasDeLibros())];

  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({
    viewport: { width: ANCHO, height: ALTO },
    deviceScaleFactor: ESCALA,
  });

  let n = 0;
  for (const { nombre, html } of tareas) {
    await pagina.setContent(html, { waitUntil: "load" });

    /*
     * Las dos comprobaciones que separan una tarjeta buena de dieciséis en la
     * serif del sistema: esperar a que el motor termine de cargar las caras y
     * PREGUNTAR si están. `document.fonts.ready` sola no basta —resuelve
     * igual si una cara falló— y un `waitForTimeout` tapa el fallo en vez de
     * verlo.
     */
    const faltan = await pagina.evaluate(async () => {
      await document.fonts.ready;
      return [
        "400 100px Newsreader",
        "italic 400 100px Newsreader",
        "600 16px Inter",
      ].filter((cara) => !document.fonts.check(cara));
    });
    if (faltan.length) throw new Error(`Fuentes sin cargar en ${nombre}: ${faltan.join(", ")}`);

    /*
     * EL TRAZO TIENE QUE IR EN EL ÚLTIMO RENGLÓN.
     *
     * El interlineado del sitio es 1,04 y el trazo se dibuja a 0,95 em del alto
     * de la palabra: si la palabra subrayada cae en un renglón que no es el
     * último, la curva atraviesa las mayúsculas del siguiente. En la página no
     * se nota —los titulares del sitio son cortos y el trazo va casi siempre en
     * la última palabra—, pero aquí el ancho es fijo y un titular de una línea
     * puede convertirse en dos con solo cambiarle una palabra.
     *
     * Se compara el borde inferior del subrayado con el del titular: en el
     * último renglón coinciden.
     */
    const desfase = await pagina.evaluate(() => {
      const titular = document.querySelector("h1");
      const trazo = document.querySelector("h1 .subrayado");
      if (!titular || !trazo) return 0;
      return titular.getBoundingClientRect().bottom - trazo.getBoundingClientRect().bottom;
    });
    if (desfase > 2) {
      throw new Error(
        `El trazo de ${nombre} no va en el último renglón (${Math.round(desfase)} px por encima): ` +
          "subraya la última palabra o acorta el titular.",
      );
    }

    const png = await pagina.screenshot({ type: "png" });
    const jpg = await sharp(png)
      .resize(ANCHO, ALTO, { kernel: "lanczos3" })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();

    writeFileSync(join(DESTINO, `${nombre}.jpg`), jpg);
    n += 1;
  }

  await navegador.close();
  console.log(`Tarjetas: ${n} en public/og/`);
}

/* ------------------------------------------------------------------ main */

if (filtro === "todo" || filtro === "iconos") await generarIconos();
if (filtro === "todo" || filtro === "tarjetas") await capturarTarjetas();

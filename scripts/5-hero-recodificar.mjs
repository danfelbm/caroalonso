/**
 * Prepara el video del hero para que se pueda recorrer con el scroll.
 *
 * Un video amarrado al scroll no se reproduce nunca: se le pide un cuadro
 * concreto asignando `currentTime`. Con una codificación normal, cada salto
 * obliga al decodificador a retroceder al keyframe anterior y reconstruir desde
 * ahí, y en Safari de iOS eso se ve como un tirón. Recodificar con `-g 1` hace
 * que todos los cuadros sean keyframe: la búsqueda pasa a ser instantánea a
 * cambio de un archivo unas tres veces mayor. Es el precio y no hay otro.
 *
 * Toma los masters de `arte/video/`, escribe `public/hero/` y el manifiesto
 * `src/data/hero.json`, que es por donde el hero pide los archivos.
 *
 *   node scripts/5-hero-recodificar.mjs
 */
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

const RAIZ = join(import.meta.dirname, "..");
const ORIGEN = join(RAIZ, "arte", "video");
const DESTINO = join(RAIZ, "public", "hero");
const MANIFIESTO = join(RAIZ, "src", "data", "hero.json");

/** Duración de la narrativa, en segundos. El hero reparte el scroll con ella. */
const DURACION = 15;

/**
 * Los dos cortes.
 *
 * El framerate es **constante** en los dos, y eso no es un detalle de calidad:
 * con VFR el mapa de tiempo a cuadro deja de ser lineal, los saltos caen donde
 * no toca y el recorrido entero se descuadra.
 *
 * Menos fps antes que menos resolución: con movimiento lento —y este video lo
 * es— 12 fps se ven continuos y ahorran cerca de un tercio frente a 16. El
 * corte de escritorio va a 15 porque cubre el doble de ancho de pantalla y ahí
 * el barrido del amanecer sí se nota a 12.
 *
 * El presupuesto no es una aspiración: a 3 Mbps cada MB es un segundo largo de
 * espera con el hero congelado en el póster. Si se pasa, el script falla.
 */
const CORTES = {
  movil: {
    // Nombres que puede traer el master; se usa el primero que exista.
    masters: ["hero-movil-master.mp4", "hero-movil.mp4", "hero-vertical.mp4"],
    salida: "hero-movil.mp4",
    ancho: 608,
    alto: 1080,
    fps: 12,
    crf: 33,
    presupuesto: 1.6 * 1024 * 1024,
    // El relleno provisional se genera con esta forma mientras no haya master.
    rellenoAncho: 1080,
    rellenoAlto: 1920,
  },
  escritorio: {
    masters: ["hero-escritorio-master.mp4", "hero-escritorio.mp4", "hero-horizontal.mp4"],
    salida: "hero-escritorio.mp4",
    ancho: 1600,
    alto: 900,
    fps: 15,
    crf: 33,
    presupuesto: 3.5 * 1024 * 1024,
    rellenoAncho: 1920,
    rellenoAlto: 1080,
  },
};

/** Anchos de los WebP. El móvil no llega a pedir el de escritorio nunca. */
const POSTER = { movil: 720, escritorio: 1920 };

/**
 * El ffmpeg del sistema en esta máquina está roto —le falta la librería de
 * x265—, así que se usa siempre el binario de `ffmpeg-static`. De paso, todo el
 * que corra el script obtiene la misma versión y la misma receta.
 */
const ff = (args) => execFileSync(ffmpeg, ["-v", "error", "-y", ...args]);

/**
 * Como `ff`, pero devolviendo lo que ffmpeg cuenta por stderr, que es donde
 * escribe todo lo interesante: el informe de los flujos y las líneas de
 * `showinfo`. Va con `spawnSync` porque `execFileSync` solo devuelve stdout.
 */
function ffHablando(args) {
  const proceso = spawnSync(ffmpeg, ["-hide_banner", ...args], {
    encoding: "utf8",
    maxBuffer: 1 << 28,
  });
  if (proceso.status !== 0) throw new Error(proceso.stderr || "ffmpeg falló sin decir por qué");
  return proceso.stderr;
}

/* ------------------------------------------------------------------ huellas */

/**
 * Los archivos del hero se sirven con caché de un año e `immutable`, así que
 * sobrescribir uno no propaga nada: un navegador que ya tenga el anterior no se
 * entera. Cada uno lleva en el nombre una huella de su contenido y el hero los
 * pide por el manifiesto.
 */
function versionar(archivo, clave) {
  const ruta = join(DESTINO, archivo);
  const huella = createHash("sha256").update(readFileSync(ruta)).digest("hex").slice(0, 8);
  const extension = archivo.split(".").pop();
  const nombre = archivo.replace(/\.[^.]+$/, "");
  const versionado = `${nombre}.${huella}.${extension}`;
  renameSync(ruta, join(DESTINO, versionado));
  manifiesto[clave] = `/hero/${versionado}`;
  return join(DESTINO, versionado);
}

/* ------------------------------------------------------------------ relleno */

/**
 * Un master provisional mientras el de verdad no exista.
 *
 * No es decoración: sirve para comprobar que el script hace su trabajo de
 * verdad —que el archivo sale con todos los cuadros clave, a framerate
 * constante y dentro del presupuesto— y no solo que no revienta. Cuando lleguen
 * los masters a `arte/video/`, basta con volver a correr esto.
 *
 * El degradado va de marino a rosa pasando por el dorado del amanecer, que es
 * el recorrido de color del video real: mar nocturno, brújula, figura, amanecer.
 * Se calcula con `geq` a resolución minúscula y se amplía después, porque `geq`
 * evalúa una expresión por píxel y a 1080×1920 tardaría minutos en algo que se
 * va a tirar. El cuadrado blanco que cruza la parte de abajo es un reloj: sin
 * algo que se mueva de forma inequívoca no hay manera de ver a simple vista si
 * el scroll está pidiendo el cuadro que cree.
 */
const PALETA = {
  // marino, marino-tinta, amarillo, rosa
  r: [5, 25, 246, 253],
  g: [19, 45, 227, 243],
  b: [36, 65, 146, 241],
};

function rampa(canal) {
  const [a, b, c, d] = PALETA[canal];
  const tercio = DURACION / 3;
  return (
    `if(lt(T,${tercio}),${a}+(${b}-${a})*(T/${tercio}),` +
    `if(lt(T,${tercio * 2}),${b}+(${c}-${b})*((T-${tercio})/${tercio}),` +
    `${c}+(${d}-${c})*((T-${tercio * 2})/${tercio})))`
  );
}

function generarRelleno(destino, { rellenoAncho, rellenoAlto }) {
  // El cielo aclara hacia arriba y el mar queda oscuro abajo.
  const vertical = "(0.42+0.58*(1-Y/H))";
  const chico = Math.round(rellenoAncho / 12);
  const bajo = Math.round(rellenoAlto / 12);
  const marca = Math.round(rellenoAncho / 16);

  /*
   * El reloj va con `overlay` y no con `drawbox`, que sería lo obvio: en
   * ffmpeg 6 la `t` de las expresiones de `drawbox` es el grosor del trazo, no
   * el tiempo, y `n` ni existe. Una caja que se mueva escrita así no da error:
   * simplemente no dibuja nada, y el video sale limpio y sin reloj. `overlay`
   * sí entiende `t` con `eval=frame`.
   */
  ff([
    "-f", "lavfi",
    "-i", `color=c=black:s=${chico}x${bajo}:r=30:d=${DURACION}`,
    "-f", "lavfi",
    "-i", `color=c=white:s=${marca}x${marca}:r=30:d=${DURACION}`,
    "-filter_complex",
    `[0:v]geq=r='(${rampa("r")})*${vertical}':g='(${rampa("g")})*${vertical}':b='(${rampa("b")})*${vertical}',` +
      `scale=${rellenoAncho}:${rellenoAlto}:flags=bicubic[fondo];` +
      `[fondo][1:v]overlay=x='(W-w)*t/${DURACION}':y=H-H/8:eval=frame:format=yuv420[v]`,
    "-map", "[v]",
    "-c:v", "libx264",
    "-crf", "18",
    "-preset", "medium",
    destino,
  ]);
}

/**
 * El master de cada corte: el de `arte/video/` si existe, y si no, uno de
 * relleno en el directorio temporal. Nunca escribe dentro de `arte/`.
 */
function masterDe(nombre, corte) {
  for (const candidato of corte.masters) {
    const ruta = join(ORIGEN, candidato);
    if (existsSync(ruta)) {
      console.log(`  ${nombre}: master ${candidato}`);
      return ruta;
    }
  }

  // Se guarda entre corridas para no rehacerlo cada vez; si se cambia la receta
  // de arriba hay que borrar esta carpeta para que se vuelva a generar.
  const cocina = join(tmpdir(), "caroalonso-hero-relleno");
  mkdirSync(cocina, { recursive: true });
  const ruta = join(cocina, `relleno-${nombre}.mp4`);

  if (!existsSync(ruta)) {
    console.log(`  ${nombre}: no hay master en arte/video/, se genera un relleno…`);
    generarRelleno(ruta, corte);
  } else {
    console.log(`  ${nombre}: relleno provisional ya generado`);
  }

  provisional = true;
  return ruta;
}

/* -------------------------------------------------------------- codificación */

/**
 * La receta. Cada bandera está aquí por una razón:
 *
 * - `-an`: el hero no suena nunca y el audio sería peso muerto.
 * - `fps=N` antes de `scale`: fija el framerate constante y evita reescalar
 *   cuadros que se van a tirar.
 * - `-g 1 -keyint_min 1 -sc_threshold 0`: todos los cuadros keyframe, que es lo
 *   único que hace posible saltar a cualquier punto sin arrastrar.
 * - `-tune stillimage`: le dice a x264 que no gaste bits en predecir movimiento
 *   entre cuadros, que aquí no le sirven de nada porque no hay predicción.
 * - `-movflags +faststart`: adelanta el índice del MP4 al principio del archivo.
 *   Sin eso el navegador no puede buscar hasta tenerlo entero, que es
 *   exactamente lo contrario de lo que hace este hero.
 */
function recodificar(master, salida, { ancho, alto, fps, crf }) {
  ff([
    "-i", master,
    "-an",
    "-vf", `fps=${fps},scale=${ancho}:${alto}:flags=lanczos`,
    "-c:v", "libx264",
    "-profile:v", "high",
    "-pix_fmt", "yuv420p",
    "-crf", String(crf),
    "-g", "1",
    "-keyint_min", "1",
    "-sc_threshold", "0",
    "-tune", "stillimage",
    "-movflags", "+faststart",
    join(DESTINO, salida),
  ]);
}

/**
 * Comprueba lo que el hero da por hecho: todos los cuadros clave y framerate
 * constante al ritmo declarado.
 *
 * Se hace aquí y no a mano porque las dos cosas fallan en silencio. Un archivo
 * con keyframes cada segundo se ve idéntico en un reproductor y solo se delata
 * cuando alguien recorre el hero con la rueda y lo siente pesado; un framerate
 * variable ni siquiera se siente, simplemente desincroniza el texto del video.
 *
 * Va con `showinfo` y no con ffprobe porque `ffmpeg-static` no trae ffprobe, y
 * el del sistema está roto en esta máquina.
 */
function verificar(ruta, { fps }) {
  const salida = ffHablando(["-i", ruta, "-vf", "showinfo", "-f", "null", "-"]);

  const tiempos = [...salida.matchAll(/pts_time:([0-9.]+)/g)].map((m) => Number(m[1]));
  const claves = [...salida.matchAll(/iskey:1/g)].length;

  if (tiempos.length === 0) throw new Error(`No se pudo leer ningún cuadro de ${ruta}`);

  if (claves !== tiempos.length) {
    throw new Error(
      `${ruta}: solo ${claves} de ${tiempos.length} cuadros son clave. ` +
        "Sin `-g 1 -keyint_min 1 -sc_threshold 0` el hero se arrastra en cada salto.",
    );
  }

  // Framerate constante: todos los saltos entre cuadros tienen que medir igual.
  const saltos = tiempos.slice(1).map((t, i) => t - tiempos[i]);
  const esperado = 1 / fps;
  const peor = Math.max(...saltos.map((s) => Math.abs(s - esperado)));
  if (peor > 0.002) {
    throw new Error(
      `${ruta}: el framerate no es constante (el peor salto se desvía ${peor.toFixed(4)} s ` +
        `de los ${esperado.toFixed(4)} s que tocan a ${fps} fps).`,
    );
  }

  const medido = (tiempos.length - 1) / (tiempos.at(-1) - tiempos[0]);
  if (Math.abs(medido - fps) > 0.05) {
    throw new Error(
      `${ruta}: declara ${fps} fps y mide ${medido.toFixed(3)}. ` +
        "El hero reparte el scroll por tiempo y contaría mal los cuadros.",
    );
  }

  return { cuadros: tiempos.length, fps: medido, duracion: tiempos.at(-1) + esperado };
}

/** Falla con las palancas en el orden en que conviene tirar de ellas. */
function comprobarPresupuesto(nombre, ruta, corte) {
  const peso = statSync(ruta).size;
  if (peso <= corte.presupuesto) return peso;

  throw new Error(
    `El corte de ${nombre} pesa ${mb(peso)} y el presupuesto es ${mb(corte.presupuesto)}.\n` +
      "Palancas, en este orden:\n" +
      `  1. Bajar fps (ahora ${corte.fps}). Es la que más ahorra y la que menos se nota: ` +
      "con movimiento lento, dos fps menos no se ven y quitan cerca de un sexto del archivo.\n" +
      `  2. Bajar resolución (ahora ${corte.ancho}×${corte.alto}). El hero se pinta bajo un velo ` +
      "y en movimiento; la pérdida es difícil de ver.\n" +
      `  3. Subir el CRF (ahora ${corte.crf}), y solo al final. Es donde antes se empieza a ver ` +
      "el destrozo, sobre todo en los degradados del cielo, que es justo lo que cuenta este video.",
  );
}

/* ------------------------------------------------------------------ pósteres */

/** Un cuadro suelto del master, como WebP. */
async function poster(master, segundo, salida, ancho) {
  const bruto = join(tmpdir(), `caroalonso-poster-${Date.now()}.png`);
  ff(["-ss", String(segundo), "-i", master, "-frames:v", "1", bruto]);
  await sharp(bruto).resize(ancho).webp({ quality: 72, effort: 6 }).toFile(join(DESTINO, salida));
  rmSync(bruto, { force: true });
}

/* --------------------------------------------------------------------- obra */

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const manifiesto = {};
let provisional = false;

mkdirSync(DESTINO, { recursive: true });
for (const archivo of readdirSync(DESTINO)) unlinkSync(join(DESTINO, archivo));

console.log("Masters…");
const masterMovil = masterDe("movil", CORTES.movil);
const masterEscritorio = masterDe("escritorio", CORTES.escritorio);

console.log("Recodificando…");
recodificar(masterMovil, CORTES.movil.salida, CORTES.movil);
recodificar(masterEscritorio, CORTES.escritorio.salida, CORTES.escritorio);

console.log("Comprobando…");
const medidas = {};
for (const [nombre, corte] of Object.entries(CORTES)) {
  const ruta = join(DESTINO, corte.salida);
  medidas[nombre] = verificar(ruta, corte);
  medidas[nombre].peso = comprobarPresupuesto(nombre, ruta, corte);
}

console.log("Pósteres…");
// Cuadro 0, el mar nocturno: es el póster de arranque, y así al aparecer el
// video no hay salto entre la imagen y el primer cuadro.
await poster(masterMovil, 0, "poster-movil.webp", POSTER.movil);
await poster(masterEscritorio, 0, "poster-escritorio.webp", POSTER.escritorio);

// El final, el amanecer: es lo que ve quien pide menos movimiento, y con él ve
// también los botones. Un mar nocturno quieto no contaría nada.
await poster(masterMovil, DURACION - 0.2, "quieto-movil.webp", POSTER.movil);
await poster(masterEscritorio, DURACION - 0.2, "quieto-escritorio.webp", POSTER.escritorio);

versionar("hero-movil.mp4", "videoMovil");
versionar("hero-escritorio.mp4", "videoEscritorio");
versionar("poster-movil.webp", "posterMovil");
versionar("poster-escritorio.webp", "posterEscritorio");
versionar("quieto-movil.webp", "quietoMovil");
versionar("quieto-escritorio.webp", "quietoEscritorio");

manifiesto.duracion = DURACION;
for (const nombre of Object.keys(CORTES)) {
  manifiesto[nombre] = {
    fps: CORTES[nombre].fps,
    peso: medidas[nombre].peso,
    cuadros: medidas[nombre].cuadros,
  };
}

/** Verdadero mientras el hero se esté viendo con el degradado de relleno. */
manifiesto.provisional = provisional;

writeFileSync(MANIFIESTO, `${JSON.stringify(manifiesto, null, 2)}\n`);

for (const [nombre, medida] of Object.entries(medidas)) {
  console.log(
    `${nombre.padEnd(11)} ${mb(medida.peso).padStart(8)}  ` +
      `${medida.cuadros} cuadros a ${CORTES[nombre].fps} fps, todos clave`,
  );
}
console.log(`manifiesto  src/data/hero.json`);
if (provisional) {
  console.log(
    "\n⚠ Material PROVISIONAL: no hay masters en arte/video/ y se usó un degradado\n" +
      "  de relleno. Cuando lleguen los de verdad, basta con volver a correr esto.",
  );
}

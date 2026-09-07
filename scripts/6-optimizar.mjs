/**
 * Convierte el arte original en las variantes que sirve el sitio y escribe el
 * manifiesto `src/data/imagenes.json`.
 *
 * Los nombres NO llevan huella del contenido, a diferencia del hero. El hero la
 * necesita porque se sirve con caché de un año e `immutable`; estas otras
 * carpetas se sirven con una semana y revalidación, así que un nombre estable y
 * predecible vale más: las páginas pueden escribir `/libros/grietas.webp` sin
 * pasar por el manifiesto, y una portada corregida se propaga sola.
 *
 * Reanudable: salta lo que ya existe y esté más nuevo que su original.
 */
import sharp from "sharp";
import { readdirSync, mkdirSync, existsSync, statSync, copyFileSync, writeFileSync } from "node:fs";
import { join, parse } from "node:path";

const RAIZ = new URL("..", import.meta.url).pathname;
const forzar = process.argv.includes("--forzar");

/** Qué se convierte, de dónde a dónde, y a qué anchos. */
const TAREAS = [
  {
    nombre: "libros",
    // Fotos de producto de la editorial. Nunca se regeneran con IA.
    origen: "arte/originales/portadas",
    destino: "public/libros",
    anchos: [400, 800, 1200],
  },
  {
    nombre: "retratos",
    // Preferimos las aprobadas a mano; si aún no hay, las del motor elegido.
    origen: existsSync(join(RAIZ, "arte/elegidas")) &&
      readdirSync(join(RAIZ, "arte/elegidas")).some((f) => /\.(png|jpe?g)$/i.test(f))
      ? "arte/elegidas"
      : "arte/retratos/higgsfield",
    destino: "public/retratos",
    anchos: [400, 800, 1200],
  },
  {
    nombre: "recomendaciones",
    origen: "arte/originales/recomendaciones",
    destino: "public/recomendaciones",
    anchos: [300, 600],
  },
  {
    nombre: "texturas",
    origen: "arte/texturas",
    destino: "public/texturas",
    anchos: [800, 1600],
  },
];

const esImagen = (f) => /\.(png|jpe?g|webp)$/i.test(f);

async function convertir() {
  const manifiesto = {};

  for (const tarea of TAREAS) {
    const dirOrigen = join(RAIZ, tarea.origen);
    if (!existsSync(dirOrigen)) {
      console.log(`  ${tarea.nombre}: no hay origen (${tarea.origen}), se salta`);
      continue;
    }
    const dirDestino = join(RAIZ, tarea.destino);
    mkdirSync(dirDestino, { recursive: true });

    const archivos = readdirSync(dirOrigen).filter(esImagen);
    console.log(`\n${tarea.nombre}: ${archivos.length} originales desde ${tarea.origen}`);

    for (const archivo of archivos) {
      const base = parse(archivo).name;
      const rutaOrigen = join(dirOrigen, archivo);
      const mtimeOrigen = statSync(rutaOrigen).mtimeMs;

      const meta = await sharp(rutaOrigen).metadata();
      // Nunca escalamos hacia arriba: pedir 1200 de un original de 900 solo
      // añade peso y no añade un solo detalle.
      const anchos = tarea.anchos.filter((a) => a <= (meta.width ?? 0));
      if (anchos.length === 0) anchos.push(meta.width ?? tarea.anchos[0]);

      const entrada = { ancho: meta.width, alto: meta.height, webp: {}, avif: {} };

      for (const ancho of anchos) {
        for (const [formato, opciones] of [
          ["webp", { quality: 82, effort: 5 }],
          ["avif", { quality: 58, effort: 4 }],
        ]) {
          const salida = join(dirDestino, `${base}-${ancho}.${formato}`);
          const alDia =
            !forzar && existsSync(salida) && statSync(salida).mtimeMs > mtimeOrigen;
          if (!alDia) {
            await sharp(rutaOrigen)
              .flatten({ background: "#FBF8F6" }) // el papel del sitio, no blanco puro
              .resize({ width: ancho, withoutEnlargement: true })
              [formato](opciones)
              .toFile(salida);
          }
          entrada[formato][ancho] = `/${tarea.destino.replace("public/", "")}/${base}-${ancho}.${formato}`;
        }
      }

      // El ancho mayor también con nombre limpio, para poder escribirlo a mano
      // en un componente sin consultar el manifiesto.
      const mayor = anchos[anchos.length - 1];
      const limpio = join(dirDestino, `${base}.webp`);
      if (forzar || !existsSync(limpio) || statSync(limpio).mtimeMs <= mtimeOrigen) {
        await sharp(rutaOrigen)
          .flatten({ background: "#FBF8F6" })
          .resize({ width: mayor, withoutEnlargement: true })
          .webp({ quality: 82, effort: 5 })
          .toFile(limpio);
      }
      entrada.principal = `/${tarea.destino.replace("public/", "")}/${base}.webp`;

      // Marcador de posición: 20 px de ancho en base64, para pintar algo mientras carga.
      const difuminada = await sharp(rutaOrigen)
        .flatten({ background: "#FBF8F6" })
        .resize({ width: 20 })
        .webp({ quality: 40 })
        .toBuffer();
      entrada.difuminada = `data:image/webp;base64,${difuminada.toString("base64")}`;

      manifiesto[base] = entrada;
      console.log(`  ${base.padEnd(32)} ${anchos.join("/")} px`);
    }
  }

  // El audio rescatado de WordPress: se copia tal cual, no se recodifica.
  const audioOrigen = join(RAIZ, "arte/originales/audio");
  if (existsSync(audioOrigen)) {
    const dirAudio = join(RAIZ, "public/audio");
    mkdirSync(dirAudio, { recursive: true });
    for (const archivo of readdirSync(audioOrigen).filter((f) => f.endsWith(".mp3"))) {
      copyFileSync(join(audioOrigen, archivo), join(dirAudio, archivo));
      console.log(`\naudio: ${archivo}`);
    }
  }

  const rutaManifiesto = join(RAIZ, "src/data/imagenes.json");
  writeFileSync(rutaManifiesto, JSON.stringify(manifiesto, null, 2) + "\n", "utf8");
  console.log(`\nmanifiesto: ${Object.keys(manifiesto).length} imágenes en src/data/imagenes.json`);
}

convertir().catch((error) => {
  console.error("Falló la optimización:", error.message);
  process.exit(1);
});

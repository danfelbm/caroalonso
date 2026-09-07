/**
 * El video del hero — concepto "Coordenadas del alma".
 *
 * Dos fases, a propósito separadas para no quemar créditos:
 *
 *   node scripts/4-hero-video.mjs claves         # 3 fotogramas de arranque (16:9, 2k)
 *   node scripts/4-hero-video.mjs borrador 2     # UN borrador de 15 s a 720p desde clave-2
 *   node scripts/4-hero-video.mjs final 16x9     # master horizontal 1080p  (135 créditos)
 *   node scripts/4-hero-video.mjs final 9x16     # master vertical 720p     (67,5 créditos)
 *   node scripts/4-hero-video.mjs final          # los dos, uno detrás del otro
 *
 * El borrador exige que le digas qué clave usar: la elección de composición es
 * humana (o, en su defecto, razonada y explícita), nunca automática.
 *
 * La fase `final` solo se corre con el borrador ya aprobado: son 202,5 créditos.
 *
 * Versión ILUSTRADA (la que sigue el idioma de las portadas de Carolina):
 *   node scripts/4-hero-video.mjs claves-ilustradas                # 3 tratamientos (19,5)
 *   node scripts/4-hero-video.mjs borrador-ilustrado gouache      # borrador 720p (67,5)
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

import { RAIZ } from "./lib/env.mjs";
import { generar, registrarSaldo } from "./lib/higgsfield.mjs";

const DIR = join(RAIZ, "arte", "video");
const DIR_CLAVES = join(DIR, "claves");
const DIR_ILUSTRADAS = join(DIR, "claves-ilustradas");

const LIMPIO = "no text, no letters, no logos, no watermark, no people.";
const BASE = [
  "Cinematic wide night seascape, deep navy #051324 water and sky, a very low horizon line placed near the bottom of the frame,",
  "a vast open sky filling most of the image, lots of air and negative space, calm and contemplative,",
  "fine grain, soft natural falloff, anamorphic feeling, no visible light source.",
].join(" ");

/** Tres composiciones distintas, para poder comparar. */
const CLAVES = [
  {
    nombre: "clave-1",
    prompt: `${BASE} A perfectly still mirror-like sea reflecting a dense field of tiny stars, a faint diffuse milky way band arching high across the sky, the horizon barely visible as a soft tonal edge. Symmetrical and serene. ${LIMPIO}`,
  },
  {
    nombre: "clave-2",
    prompt: `${BASE} A dark calm ocean with very soft slow swells catching faint starlight, a thin band of the deepest blue light lingering right at the horizon, thousands of fine sharp stars above, a few noticeably brighter. Wide and spacious. ${LIMPIO}`,
  },
  {
    nombre: "clave-3",
    prompt: `${BASE} An almost black sea with a delicate path of scattered starlight running from the bottom edge toward the horizon, sparse crisp stars in a very deep sky, subtle darker vignette at the corners, minimal and abstract. ${LIMPIO}`,
  },
];

// ---------------------------------------------------------------------------
// Versión ILUSTRADA. El fotorrealismo era lo único del sitio que no hablaba el
// idioma de la marca: las siete portadas de Carolina son ilustradas, y
// `navegaciones.jpg` (faro sobre mar nocturno estrellado) es este mismo
// imaginario dibujado por ella. De ahí salen el contorno grueso, el color
// plano, las estrellas de cuatro puntas y el papel visible.
// ---------------------------------------------------------------------------

/** Paleta del sitio, no la de un render genérico. */
const PALETA = "warm paper #FBF8F6, deep navy #051324, mint #B7ECDA, soft yellow #F6E392, pale pink #FDF3F1 and blue #265C9F";

// La rosa de los vientos se pide SIN letras ni números: así no hay dónde
// inventar una N, una S o una hache donde iba el oeste.
const SIN_LETRAS = "The compass rose is drawn only as plain lines and simple pointed shapes, completely unlettered and unmarked. no text, no letters, no numbers, no logos, no watermark.";

const MOMENTO = "A calm night sea across the bottom of the frame under a vast open sky, small four-pointed stars scattered across it, and thin luminous lines just beginning to join a few of those stars into the first faint suggestion of an eight-pointed compass rose high in the sky.";

const CLAVES_ILUSTRADAS = [
  {
    nombre: "clave-gouache",
    prompt: [
      "Hand-painted gouache and wax crayon illustration, thick confident brush strokes and visible cold-press paper tooth,",
      "flat blocks of colour with slightly wobbly hand-drawn edges and bold dark outlines, in the style of a folk-art storybook cover.",
      MOMENTO,
      `Palette: ${PALETA}. Warm cream paper shows through at the edges and in the grain.`,
      "Flat 2D, no photographic realism, no perspective depth.",
      SIN_LETRAS,
    ].join(" "),
  },
  {
    nombre: "clave-tinta",
    prompt: [
      "Fine-line pen and ink illustration on warm cream paper, delicate cross-hatching and stippling like an antique engraving,",
      "drawn almost entirely in dark navy line work of varying weight, with generous bare paper left breathing.",
      MOMENTO,
      "The sea is rendered in fine parallel hatch lines and the stars as clean small ink bursts.",
      `Sparse flat washes of ${PALETA}, used sparingly over the linework.`,
      "Elegant, restrained, graphic.",
      SIN_LETRAS,
    ].join(" "),
  },
  {
    nombre: "clave-recortes",
    prompt: [
      "Layered cut-paper collage illustration: every element is a separate piece of matte coloured paper with clean scissor-cut edges,",
      "each layer casting a soft drop shadow onto the one beneath so the picture has gentle tactile depth.",
      MOMENTO,
      "The sea is built from three overlapping wave layers and the stars are small shapes punched out of paper.",
      `Palette: ${PALETA}. Visible paper fibre, flat even studio light, no gloss.`,
      SIN_LETRAS,
    ].join(" "),
  },
];

/** El recorrido no cambia: es el que ya funcionó. Solo cambia el tratamiento. */
const PROMPT_VIDEO_ILUSTRADO = [
  "Animated illustration, hand-made artwork brought to life, keeping the exact drawn style, palette and paper texture of the starting frame in every frame.",
  "A calm illustrated night sea under a wide sky of stars, very slow drift.",
  "The stars join to each other with fine luminous lines and draw an unlettered compass rose over the water.",
  "The needle of the compass then stretches downward and becomes the small silhouette of a woman walking toward the horizon.",
  "The sky finally opens into a warm pink and golden dawn over the still water.",
  "Static camera, no cuts, continuous very slow movement, everything stays flat and hand-drawn like a moving picture book.",
  "no text, no letters, no numbers, no logos.",
].join(" ");

/** El prompt del video fotorreal anterior, que se conserva por si se retoma. */
const PROMPT_VIDEO = [
  "A calm night sea under a vast field of stars, very slow drift.",
  "The stars connect to each other with fine luminous lines and draw a compass rose over the water.",
  "The compass slowly transforms into the silhouette of a woman walking toward the horizon.",
  "The sky then opens into a pink and golden dawn over the still water.",
  "Static camera, no cuts, continuous very slow movement, cinematic.",
  "no text, no letters, no logos.",
].join(" ");

const fase = process.argv[2] ?? "claves";

if (fase === "claves") {
  const antes = registrarSaldo("antes de los fotogramas clave");
  const fallos = [];
  for (const clave of CLAVES) {
    const r = generar({
      modelo: "gpt_image_2",
      prompt: clave.prompt,
      salida: join(DIR_CLAVES, `${clave.nombre}.png`),
      tipo: "imagen",
      params: ["--aspect_ratio", "16:9", "--resolution", "2k", "--quality", "high"],
      espera: "15m",
    });
    if (!r.ok) fallos.push(clave.nombre);
  }
  const despues = registrarSaldo("después de los fotogramas clave");
  console.log(`\nFotogramas en ${DIR_CLAVES}`);
  console.log(`Gasto de esta fase: ${(antes - despues).toFixed(2)} créditos`);
  console.log("\nMira los tres y elige el de mejor composición. Luego:");
  console.log("  node scripts/4-hero-video.mjs borrador <1|2|3>");
  if (fallos.length) {
    console.error(`Fallaron: ${fallos.join(", ")}`);
    process.exitCode = 1;
  }
} else if (fase === "borrador") {
  const elegida = process.argv[3];
  if (!/^[1-9]\d*$/.test(elegida ?? "")) {
    console.error("Dime qué fotograma usar: node scripts/4-hero-video.mjs borrador <1|2|3>");
    process.exit(1);
  }
  const inicio = join(DIR_CLAVES, `clave-${elegida}.png`);
  if (!existsSync(inicio)) {
    console.error(`No existe ${inicio}. Corre antes: node scripts/4-hero-video.mjs claves`);
    process.exit(1);
  }

  const antes = registrarSaldo("antes del borrador de video");
  const r = generar({
    modelo: "seedance_2_0",
    prompt: PROMPT_VIDEO,
    salida: join(DIR, "borrador-16x9.mp4"),
    tipo: "video",
    imagenInicio: inicio,
    params: ["--aspect_ratio", "16:9", "--duration", "15", "--resolution", "720p", "--generate_audio", "false", "--mode", "std"],
    espera: "25m",
  });
  const despues = registrarSaldo("después del borrador de video");
  console.log(`\nGasto de esta fase: ${(antes - despues).toFixed(2)} créditos`);
  console.log(`Fotograma de arranque: ${inicio}`);
  console.log("\nAquí se para a propósito: el final en 1080p y la versión vertical");
  console.log("se generan solo después de aprobar este borrador.");
  if (!r.ok) process.exitCode = 1;
} else if (fase === "final") {
  // El borrador ya se aprobó: se rinden los masters definitivos desde clave-2.
  const cual = process.argv[3] ?? "ambos";
  const CLAVE = join(DIR_CLAVES, "clave-2.png");
  if (!existsSync(CLAVE)) {
    console.error(`No existe ${CLAVE}. Corre antes: node scripts/4-hero-video.mjs claves`);
    process.exit(1);
  }

  const antes = registrarSaldo(`antes del master ${cual}`);
  const fallos = [];

  if (cual === "16x9" || cual === "ambos") {
    const r = generar({
      modelo: "seedance_2_0",
      prompt: PROMPT_VIDEO,
      salida: join(DIR, "coordenadas-16x9.mp4"),
      tipo: "video",
      imagenInicio: CLAVE,
      params: ["--aspect_ratio", "16:9", "--duration", "15", "--resolution", "1080p", "--generate_audio", "false", "--mode", "std"],
      espera: "40m",
    });
    if (!r.ok) fallos.push("16x9");
  }

  if (cual === "9x16" || cual === "ambos") {
    const recorte = await recortarVertical(CLAVE);
    const r = generar({
      modelo: "seedance_2_0",
      prompt: PROMPT_VIDEO,
      salida: join(DIR, "coordenadas-9x16.mp4"),
      tipo: "video",
      imagenInicio: recorte,
      params: ["--aspect_ratio", "9:16", "--duration", "15", "--resolution", "720p", "--generate_audio", "false", "--mode", "std"],
      espera: "40m",
    });
    if (!r.ok) fallos.push("9x16");
  }

  const despues = registrarSaldo(`después del master ${cual}`);
  console.log(`\nGasto de esta fase: ${(antes - despues).toFixed(2)} créditos`);
  console.log("(si corrieron otros trabajos a la vez, esa resta incluye su gasto)");
  if (fallos.length) {
    console.error(`Fallaron: ${fallos.join(", ")}`);
    process.exitCode = 1;
  }
} else if (fase === "claves-ilustradas") {
  const antes = registrarSaldo("antes de los fotogramas ilustrados");
  const fallos = [];
  for (const clave of CLAVES_ILUSTRADAS) {
    const r = generar({
      modelo: "gpt_image_2",
      prompt: clave.prompt,
      salida: join(DIR_ILUSTRADAS, `${clave.nombre}.png`),
      tipo: "imagen",
      params: ["--aspect_ratio", "16:9", "--resolution", "2k", "--quality", "high"],
      espera: "15m",
    });
    if (!r.ok) fallos.push(clave.nombre);
  }
  const despues = registrarSaldo("después de los fotogramas ilustrados");
  console.log(`\nFotogramas en ${DIR_ILUSTRADAS}`);
  console.log(`Gasto de esta fase: ${(antes - despues).toFixed(2)} créditos`);
  console.log("\nMira los tres y elige tratamiento. Luego:");
  console.log("  node scripts/4-hero-video.mjs borrador-ilustrado <gouache|tinta|recortes>");
  if (fallos.length) {
    console.error(`Fallaron: ${fallos.join(", ")}`);
    process.exitCode = 1;
  }
} else if (fase === "borrador-ilustrado") {
  const cual = process.argv[3];
  if (!["gouache", "tinta", "recortes"].includes(cual ?? "")) {
    console.error("Dime el tratamiento: node scripts/4-hero-video.mjs borrador-ilustrado <gouache|tinta|recortes>");
    process.exit(1);
  }
  const inicio = join(DIR_ILUSTRADAS, `clave-${cual}.png`);
  if (!existsSync(inicio)) {
    console.error(`No existe ${inicio}. Corre antes: node scripts/4-hero-video.mjs claves-ilustradas`);
    process.exit(1);
  }

  const antes = registrarSaldo("antes del borrador ilustrado");
  const salida = join(DIR, "borrador-ilustrado.mp4");
  const r = generar({
    modelo: "seedance_2_0",
    prompt: PROMPT_VIDEO_ILUSTRADO,
    salida,
    tipo: "video",
    imagenInicio: inicio,
    params: ["--aspect_ratio", "16:9", "--duration", "15", "--resolution", "720p", "--generate_audio", "false", "--mode", "std"],
    espera: "40m",
  });
  const despues = registrarSaldo("después del borrador ilustrado");
  console.log(`\nGasto de esta fase: ${(antes - despues).toFixed(2)} créditos`);
  console.log(`Fotograma de arranque: ${inicio}`);
  if (r.ok) hojaDeContactos(salida);
  console.log("\nAquí se para a propósito: no se generan finales.");
  console.log("El final en 1080p cuesta 135 créditos y hay que decidir si se recarga.");
  if (!r.ok) process.exitCode = 1;
} else {
  console.error(`Fase desconocida "${fase}". Usa: claves | borrador <n> | final [16x9|9x16] | claves-ilustradas | borrador-ilustrado <tratamiento>`);
  process.exit(1);
}

/**
 * Hoja de contactos: un fotograma cada 1,7 s en una rejilla, para poder juzgar
 * el recorrido completo de un vistazo sin abrir el video.
 */
function hojaDeContactos(video, cada = 1.7, columnas = 3) {
  const destino = `${video.replace(/\.mp4$/, "")}-contactos.jpg`;
  try {
    execFileSync(
      ffmpeg,
      ["-y", "-i", video, "-vf", `fps=1/${cada},scale=640:-1,tile=${columnas}x3`, "-frames:v", "1", "-q:v", "3", destino],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    console.log(`Hoja de contactos: ${destino}`);
  } catch (e) {
    console.error(`No se pudo montar la hoja de contactos: ${`${e.message ?? e}`.slice(0, 200)}`);
  }
}

/**
 * Recorta el fotograma clave al centro en 9:16 para arrancar el vertical.
 * Reanudable: si el recorte ya existe, se reutiliza.
 */
async function recortarVertical(origen) {
  const destino = join(DIR_CLAVES, "clave-2-9x16.png");
  if (existsSync(destino)) {
    console.log(`· recorte vertical ya existe: ${destino}`);
    return destino;
  }
  const { width, height } = await sharp(origen).metadata();
  const ancho = Math.round((height * 9) / 16);
  const izquierda = Math.round((width - ancho) / 2);
  await sharp(origen).extract({ left: izquierda, top: 0, width: ancho, height }).toFile(destino);
  console.log(`✓ recorte vertical ${ancho}x${height} → ${destino}`);
  return destino;
}

/**
 * Hubo un momento en que `scripts/5-hero-recodificar.mjs` (de otro agente) solo
 * buscaba hero-escritorio-master.mp4 / hero-movil-master.mp4, y aquí se dejaban
 * enlaces duros para que los encontrara. Ya no hace falta: ese script busca
 * primero coordenadas-16x9.mp4 y coordenadas-9x16.mp4, que son estos mismos.
 * Si algún día vuelve a cambiar de nombres, el arreglo es un enlace duro, no
 * copiar el archivo.
 */

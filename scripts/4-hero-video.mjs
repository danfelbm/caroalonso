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
 */
import { existsSync, linkSync, unlinkSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

import { RAIZ } from "./lib/env.mjs";
import { generar, registrarSaldo } from "./lib/higgsfield.mjs";

const DIR = join(RAIZ, "arte", "video");
const DIR_CLAVES = join(DIR, "claves");

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

/** El prompt del video: la idea completa de "Coordenadas del alma". */
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
} else {
  console.error(`Fase desconocida "${fase}". Usa: claves | borrador <n>`);
  process.exit(1);
}

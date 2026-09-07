/**
 * Texturas de fondo del sitio, con GPT Image 2. Sin personas y sin texto.
 *
 *   node scripts/3-texturas.mjs            # las que falten
 *   node scripts/3-texturas.mjs papel      # solo una, por nombre
 *
 * Reanudable: si el PNG ya existe, se salta. Cada pieza deja su bitácora
 * .json al lado, con el prompt literal dentro.
 */
import { join } from "node:path";

import { RAIZ } from "./lib/env.mjs";
import { generar, registrarSaldo } from "./lib/higgsfield.mjs";

const DESTINO = join(RAIZ, "arte", "texturas");
const filtro = process.argv[2] ?? null;

// La coletilla que de verdad funciona para quitar tipografía y marcas.
const LIMPIO = "no text, no letters, no logos, no people, no watermark.";

const TEXTURAS = [
  {
    nombre: "papel",
    prompt: [
      "Flat scan of warm off-white paper in soft cream tone #FBF8F6, seamless and tileable.",
      "Visible cotton fibers and fine natural grain, subtle tooth of uncoated stock, a few faint darker specks.",
      "Evenly lit like a flatbed scanner, no shadows, no vignette, no folds, no edges of the sheet.",
      "Neutral warm paper only, filling the entire frame.",
      LIMPIO,
    ].join(" "),
    params: ["--aspect_ratio", "1:1", "--resolution", "1k", "--quality", "medium"],
  },
  {
    nombre: "constelacion",
    prompt: [
      "Deep night sky filling the frame, rich dark navy #051324 background with a gentle darker vignette at the corners.",
      "Fine scattered stars of different sizes, most of them tiny pinpricks of pale mint white #E0F7F1, a few brighter with a soft glow.",
      "Some of the stars are joined by very thin luminous straight lines in pale blue #C3E9FE, drawing delicate constellation figures across the sky, elegant and sparse.",
      "Astronomical chart feeling, minimal, lots of empty dark space, cinematic and calm.",
      LIMPIO,
    ].join(" "),
    params: ["--aspect_ratio", "16:9", "--resolution", "2k", "--quality", "high"],
  },
  {
    nombre: "lavanda",
    prompt: [
      "Pure abstract gradient background, extremely smooth and soft, going from pale icy blue #E2EFFF at the top left to soft lavender periwinkle #A1B2EE at the bottom right.",
      "Even diagonal blend with no bands and no hard edges, wrapped in a fine analog film grain that gives it a matte printed feeling.",
      "Nothing else in the frame: no shapes, no objects, no horizon, no light source.",
      LIMPIO,
    ].join(" "),
    params: ["--aspect_ratio", "16:9", "--resolution", "2k", "--quality", "high"],
  },
  {
    nombre: "olas",
    prompt: [
      "Extremely minimal seascape at dawn: a calm flat sea with very soft low ripples in the lower third, and a wide empty sky above.",
      "The whole scene bathed in pale blush pink #FDF3F1 and warm golden light #F6E392, with the low horizon line placed near the bottom.",
      "Soft haze, no sun disc, no clouds with detail, no land, no boats, no birds.",
      "Serene, airy, lots of negative space, muted pastel palette, fine grain, cinematic wide shot.",
      LIMPIO,
    ].join(" "),
    params: ["--aspect_ratio", "16:9", "--resolution", "2k", "--quality", "high"],
  },
];

const lote = filtro ? TEXTURAS.filter((t) => t.nombre === filtro) : TEXTURAS;
if (!lote.length) {
  console.error(`No hay textura "${filtro}". Opciones: ${TEXTURAS.map((t) => t.nombre).join(", ")}`);
  process.exit(1);
}

const antes = registrarSaldo("antes de las texturas");

const fallos = [];
for (const textura of lote) {
  const r = generar({
    modelo: "gpt_image_2",
    prompt: textura.prompt,
    salida: join(DESTINO, `${textura.nombre}.png`),
    tipo: "imagen",
    params: textura.params,
    espera: "15m",
  });
  if (!r.ok) fallos.push(textura.nombre);
}

const despues = registrarSaldo("después de las texturas");
console.log(`\nTexturas en ${DESTINO}`);
console.log(`Gasto de esta fase: ${(antes - despues).toFixed(2)} créditos`);
if (fallos.length) {
  console.error(`Fallaron: ${fallos.join(", ")}`);
  process.exitCode = 1;
}

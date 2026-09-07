/**
 * Las mismas 5 escenas con los dos motores, para poder compararlos:
 *   Motor A — Higgsfield Soul 2.0  -> arte/retratos/higgsfield/
 *   Motor B — OpenRouter GPT Image 2 con 3 fotos de referencia -> arte/retratos/openrouter/
 *
 *   node scripts/2-retratos.mjs                  # los dos motores
 *   node scripts/2-retratos.mjs higgsfield       # solo el motor A
 *   node scripts/2-retratos.mjs openrouter       # solo el motor B
 *   node scripts/2-retratos.mjs openrouter retrato-libro   # una sola escena
 *
 * Reanudable: cada PNG que ya exista se salta. Al final escribe el
 * comparador.html para que una persona elija. El script NO elige.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { RAIZ } from "./lib/env.mjs";
import { generar, registrarSaldo } from "./lib/higgsfield.mjs";
import { generarImagen } from "./lib/openrouter.mjs";

const DIR = join(RAIZ, "arte", "retratos");
const DIR_A = join(DIR, "higgsfield");
const DIR_B = join(DIR, "openrouter");
const FOTOS = join(RAIZ, "arte", "originales", "carolina");
const MODELO_OR = "openai/gpt-5.4-image-2";

const [motorPedido = "ambos", escenaPedida = null] = process.argv.slice(2);

// --- Quién es ella. El mismo párrafo en los dos motores, para que comparen de verdad ---
const ELLA = [
  "a Colombian woman in her early fifties, warm olive skin,",
  "dark brown almost black wavy hair falling to her shoulders with a side part,",
  "clear burgundy and rose dyed streaks near the ends of her hair,",
  "thick dark arched eyebrows, warm brown eyes with gentle laugh lines,",
  "a wide warm genuine smile, dressed in black,",
].join(" ");

const FOTOGRAFIA = "Natural editorial portrait photography, 50mm lens, shallow depth of field, soft realistic skin texture, true to life, no retouching plastic look.";
const LIMPIO = "no text, no letters, no logos, no watermark.";

// Las 3 fotos que se le pasan al motor B: un primer plano, un plano medio y una foto con fondo real.
const REFERENCIAS = ["carolina.jpg", "carolina_alonso_c.png", "carolia_alonso_c_libro.jpg"].map((f) => join(FOTOS, f));

// La foto que el comparador enseña al lado de cada escena.
const ESCENAS = [
  {
    nombre: "retrato-quien-soy",
    referencia: "carolina_alonso_c.png",
    // El modelo Soul no acepta 4:5; 3:4 es el vertical más cercano.
    aspectoA: "3:4",
    encuadre: "Vertical portrait, 4:5 framing, she is seated",
    escena: [
      "She is sitting relaxed on a simple chair, body turned slightly to one side, hands resting calmly in her lap,",
      "warm afternoon window light falling across her face from the left, soft shadows,",
      "the background is a plain warm off-white paper wall in tone #FBF8F6, completely empty.",
    ].join(" "),
  },
  {
    nombre: "retrato-escritorio",
    referencia: "P1013993.png",
    aspectoA: "3:4",
    encuadre: "Vertical portrait, 4:5 framing, three quarter view",
    escena: [
      "She is writing by hand in an open notebook on a wooden desk, pen in her right hand, looking down at the page with quiet concentration and a faint smile,",
      "warm window light from the side, a few books and a cup out of focus behind her,",
      "calm intimate study atmosphere, muted warm tones.",
    ].join(" "),
  },
  {
    nombre: "retrato-libro",
    referencia: "carolia_alonso_c_libro.jpg",
    aspectoA: "3:4",
    encuadre: "Vertical portrait, 4:5 framing, waist up",
    escena: [
      "She is holding a closed hardcover book with both hands at chest height and looking straight into the camera with a warm confident smile,",
      "soft even light, the background a plain warm off-white wall in tone #FBF8F6,",
      "the book cover is plain and blank with no title and no design.",
    ].join(" "),
  },
  {
    nombre: "retrato-podcast",
    referencia: "P1013588-1.png",
    aspectoA: "3:4",
    encuadre: "Vertical portrait, 4:5 framing, waist up",
    escena: [
      "She is wearing black over-ear headphones and speaking into a large studio condenser microphone on a boom arm in front of her,",
      "she leans slightly toward the microphone, mid conversation, animated and warm,",
      "a softly blurred dark studio background with a warm lamp glow behind her, moody podcast lighting.",
    ].join(" "),
  },
  {
    nombre: "retrato-contacto",
    referencia: "carolina.jpg",
    aspectoA: "1:1",
    encuadre: "Square 1:1 framing, close up head and shoulders",
    escena: [
      "A friendly close up of her face and shoulders, looking directly into the camera with an open welcoming smile,",
      "soft flattering frontal light, the background a plain warm off-white paper tone #FBF8F6, completely empty and slightly out of focus.",
    ].join(" "),
  },
];

/** Prompt del motor A: el Soul ya sabe la cara, así que se describe la escena. */
const promptA = (e) => `${e.encuadre}. ${ELLA} ${e.escena} ${FOTOGRAFIA} ${LIMPIO}`;

/** Prompt del motor B: hay que pedirle explícitamente que conserve la cara de las fotos. */
const promptB = (e) =>
  [
    "Generate a new photograph of the exact same woman shown in the reference photographs.",
    "Keep her facial identity strictly identical to the references: the same face shape, the same nose, the same eyes and eyebrows, the same smile and teeth, the same hairline and hair colour with its burgundy streaks, the same age and skin.",
    "This must look like the same real person, photographed on another day, not a lookalike and not a younger version.",
    `She is ${ELLA.replace(/^a /, "")}`,
    e.escena,
    e.encuadre + ".",
    FOTOGRAFIA,
    LIMPIO,
  ].join(" ");

const lote = escenaPedida ? ESCENAS.filter((e) => e.nombre === escenaPedida) : ESCENAS;
if (!lote.length) {
  console.error(`No hay escena "${escenaPedida}". Opciones: ${ESCENAS.map((e) => e.nombre).join(", ")}`);
  process.exit(1);
}

const hacerA = motorPedido === "ambos" || motorPedido === "higgsfield";
const hacerB = motorPedido === "ambos" || motorPedido === "openrouter";

// --- Motor A: Higgsfield Soul --------------------------------------------
async function motorA() {
  const ficha = join(RAIZ, "arte", "soul", "soul.json");
  if (!existsSync(ficha)) {
    console.error("Falta arte/soul/soul.json. Corre antes: node scripts/1-soul.mjs");
    return { hecho: 0, fallos: ["sin-soul"] };
  }
  const { referenceId, estado } = JSON.parse(readFileSync(ficha, "utf8"));
  if (!referenceId || estado !== "completed") {
    console.error(`El Soul no está listo (estado: ${estado}). Corre antes: node scripts/1-soul.mjs`);
    return { hecho: 0, fallos: ["soul-no-listo"] };
  }

  const antes = registrarSaldo("antes de los retratos Higgsfield");
  const fallos = [];
  let hecho = 0;
  for (const e of lote) {
    const r = generar({
      modelo: "text2image_soul_v2",
      prompt: promptA(e),
      salida: join(DIR_A, `${e.nombre}.png`),
      tipo: "imagen",
      params: ["--custom_reference_id", referenceId, "--quality", "2k", "--aspect_ratio", e.aspectoA],
      espera: "15m",
    });
    if (r.ok) hecho++;
    else fallos.push(e.nombre);
  }
  const despues = registrarSaldo("después de los retratos Higgsfield");
  // text2image_soul_v2 cuesta ~0.12 créditos por imagen. La resta de saldos NO
  // sirve aquí: este script corre los dos motores a la vez y puede haber otros
  // trabajos en paralelo, así que esa diferencia incluiría gasto ajeno.
  console.log(`Motor A: ${hecho} imágenes ≈ ${(hecho * 0.12).toFixed(2)} créditos`);
  console.log(`  (saldo ${antes.toFixed(2)} → ${despues.toFixed(2)}; la diferencia incluye lo que gastara cualquier otro trabajo en paralelo)`);
  return { hecho, fallos };
}

// --- Motor B: OpenRouter con fotos de referencia --------------------------
async function motorB() {
  const ausentes = REFERENCIAS.filter((r) => !existsSync(r));
  if (ausentes.length) {
    console.error(`Faltan fotos de referencia: ${ausentes.join(", ")}`);
    return { hecho: 0, fallos: ["sin-referencias"] };
  }
  const fallos = [];
  let hecho = 0;
  for (const e of lote) {
    const r = await generarImagen({
      modelo: MODELO_OR,
      prompt: promptB(e),
      referencias: REFERENCIAS,
      salida: join(DIR_B, `${e.nombre}.png`),
      // gpt-5.4-image-2 tampoco acepta 4:5; se pide el mismo 3:4 que el motor A.
      imageConfig: { aspect_ratio: e.aspectoA, quality: "high" },
    });
    if (r.ok) hecho++;
    else fallos.push(e.nombre);
  }
  return { hecho, fallos };
}

// --- El comparador, para que elija una persona ----------------------------
function escribirComparador() {
  const filas = ESCENAS.map((e) => {
    const celda = (titulo, ruta, existe) =>
      existe
        ? `<figure><img src="${ruta}" alt="${titulo} — ${e.nombre}"><figcaption>${titulo}</figcaption></figure>`
        : `<figure class="falta"><div class="hueco">no se generó</div><figcaption>${titulo}</figcaption></figure>`;
    return `<section>
    <h2>${e.nombre}<small>${e.aspectoA === "1:1" ? "1:1" : "4:5 (generado 3:4)"}</small></h2>
    <div class="fila">
      ${celda("Foto real de referencia", `../originales/carolina/${e.referencia}`, true)}
      ${celda("Motor A · Higgsfield Soul 2.0", `higgsfield/${e.nombre}.png`, existsSync(join(DIR_A, `${e.nombre}.png`)))}
      ${celda("Motor B · OpenRouter GPT Image 2", `openrouter/${e.nombre}.png`, existsSync(join(DIR_B, `${e.nombre}.png`)))}
    </div>
  </section>`;
  }).join("\n");

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Retratos de Carolina — comparador de motores</title>
<style>
  :root { --papel:#FBF8F6; --marino:#051324; --tinta:#192D41; --menta:#C2EFE3; --linea:#e6ded9; }
  * { box-sizing: border-box; }
  body { margin:0; padding:40px 32px 80px; background:var(--papel); color:var(--marino);
         font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif; }
  header { max-width:1500px; margin:0 auto 40px; }
  h1 { font-size:30px; margin:0 0 8px; letter-spacing:-0.02em; }
  header p { margin:0; color:var(--tinta); max-width:70ch; }
  header mark { background:var(--menta); padding:2px 6px; border-radius:4px; }
  section { max-width:1500px; margin:0 auto 56px; }
  h2 { font-size:19px; margin:0 0 16px; padding-bottom:10px; border-bottom:1px solid var(--linea);
       display:flex; align-items:baseline; gap:12px; }
  h2 small { font-weight:400; font-size:13px; color:#6d7f8f; }
  .fila { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; align-items:start; }
  figure { margin:0; }
  figure img { width:100%; height:auto; display:block; border-radius:10px;
               background:#fff; box-shadow:0 2px 14px rgba(5,19,36,.10); }
  figcaption { margin-top:10px; font-size:14px; font-weight:600; color:var(--tinta); text-align:center; }
  .falta .hueco { aspect-ratio:4/5; display:grid; place-items:center; border:2px dashed var(--linea);
                  border-radius:10px; color:#9aa8b4; font-size:14px; }
  @media (max-width:900px) { .fila { grid-template-columns:1fr; } }
</style>
</head>
<body>
<header>
  <h1>Retratos de Carolina — comparador de motores</h1>
  <p>Cada fila es la misma escena: a la izquierda la <strong>foto real</strong> de referencia, y al lado las dos versiones generadas.
  <mark>Elige tú</mark> cuál se parece de verdad a ella; los scripts no eligen. Generado el ${new Date().toLocaleString("es-CO")}.</p>
</header>
${filas}
</body>
</html>
`;
  const ruta = join(DIR, "comparador.html");
  mkdirSync(DIR, { recursive: true });
  writeFileSync(ruta, html);
  console.log(`\nComparador: ${ruta}`);
}

// --- Los dos motores en paralelo -----------------------------------------
mkdirSync(DIR_A, { recursive: true });
mkdirSync(DIR_B, { recursive: true });

const [resA, resB] = await Promise.all([
  hacerA ? motorA() : Promise.resolve({ hecho: 0, fallos: [], omitido: true }),
  hacerB ? motorB() : Promise.resolve({ hecho: 0, fallos: [], omitido: true }),
]);

escribirComparador();
console.log(`\nMotor A (Higgsfield): ${resA.omitido ? "omitido" : `${resA.hecho} listos${resA.fallos.length ? `, fallaron ${resA.fallos.join(", ")}` : ""}`}`);
console.log(`Motor B (OpenRouter): ${resB.omitido ? "omitido" : `${resB.hecho} listos${resB.fallos.length ? `, fallaron ${resB.fallos.join(", ")}` : ""}`}`);

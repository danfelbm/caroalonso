/**
 * Retratos definitivos de Carolina con el motor elegido: Higgsfield Soul 2.0.
 *
 *   node scripts/2-retratos.mjs                    # las 9 escenas x 3 variantes
 *   node scripts/2-retratos.mjs retrato-libro      # solo una escena
 *
 * Salen a arte/retratos/soul/ como `<escena>-1.png`, `-2.png`, `-3.png`, para
 * poder elegir. El script NO elige: al final escribe comparador.html con la
 * foto real al lado de las tres variantes.
 *
 * Los retratos de la comparación anterior de motores siguen en
 * arte/retratos/higgsfield/ y arte/retratos/openrouter/ como historial.
 *
 * Dos correcciones respecto de aquella tanda:
 *  1. El fondo se describe con insistencia (pared de yeso con textura, luz
 *     lateral de ventana, sombra proyectada real, profundidad de campo). Cuatro
 *     de las seis fotos de entrenamiento son recortes sobre blanco, y sin esto
 *     el Soul devuelve fondos planos y un halo de recorte alrededor del pelo.
 *  2. `retrato-libro` sacaba letras inventadas en la cubierta. Ahora cada
 *     variante usa un encuadre distinto donde la cubierta no se ve.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { RAIZ } from "./lib/env.mjs";
import { generar, registrarSaldo } from "./lib/higgsfield.mjs";

const DIR = join(RAIZ, "arte", "retratos");
const DESTINO = join(DIR, "soul");
const FOTOS = join(RAIZ, "arte", "originales", "carolina");

const escenaPedida = process.argv[2] ?? null;

// --- Quién es ella -------------------------------------------------------
const ELLA = [
  "a Colombian woman in her early fifties, warm olive skin,",
  "dark brown almost black wavy hair falling to her shoulders with a side part,",
  "clear burgundy and rose dyed streaks near the ends of her hair,",
  "thick dark arched eyebrows, warm brown eyes with gentle laugh lines,",
  "a wide warm genuine smile, dressed in black,",
].join(" ");

// --- El fondo, insistiendo: es lo que arregla el halo y el blanco plano ---
const FONDO = [
  "She is standing inside a real room, several steps in front of a warm plaster wall",
  "with visible hand-troweled texture and soft tonal variation.",
  "Soft directional window light from one side wraps around her hair and shoulders,",
  "and her own soft shadow falls naturally on the wall behind her.",
  "Shallow depth of field lets the wall fall gently out of focus, with real depth between her and it.",
].join(" ");

const FOTOGRAFIA = "Natural editorial portrait photography, 50mm lens, soft realistic skin texture, true to life, visible pores and fine lines, no plastic retouching.";
const LIMPIO = "no text, no letters, no logos, no watermark.";

const ESCENAS = [
  {
    nombre: "retrato-quien-soy",
    referencia: "carolina_alonso_c.png",
    pedido: "4:5",
    aspecto: "3:4",
    encuadre: "Vertical portrait, she is seated",
    escena: "She sits relaxed on a simple wooden chair, body turned slightly to one side, hands resting calmly in her lap, warm late afternoon light across her face.",
  },
  {
    nombre: "retrato-escritorio",
    referencia: "P1013993.png",
    pedido: "4:5",
    aspecto: "3:4",
    encuadre: "Vertical portrait, three quarter view",
    escena: "She writes by hand in an open notebook on a wooden desk, pen in her right hand, looking down at the page with quiet concentration and a faint smile. A few books and a cup sit out of focus beside her.",
  },
  {
    nombre: "retrato-libro",
    referencia: "carolia_alonso_c_libro.jpg",
    pedido: "4:5",
    aspecto: "3:4",
    encuadre: "Vertical portrait, waist up",
    // Tres encuadres distintos: en ninguno se ve la cubierta, así que no hay
    // dónde inventar letras.
    escena: "She holds a closed book.",
    // Ninguna variante deja a la vista una superficie impresa: si hay cubierta o
    // sobrecubierta visible, el modelo escribe títulos inventados encima.
    // Probado: en cuanto una cubierta mira a la cámara, el modelo le imprime un
    // título inventado, incluso pidiéndola lisa. Las tres variantes evitan que
    // haya ninguna cara impresa de frente.
    variantes: [
      "She stands relaxed holding a closed book in one hand down at her side, low and mostly below the bottom edge of the frame, softly out of focus. The picture is about her face: she looks into the lens smiling warmly.",
      "She stands with a closed book tucked under one arm, the spine edge forward and the covers pressed flat against her ribs, hands relaxed. She looks into the lens with a warm confident smile.",
      "She stands relaxed with a closed book held in one hand down at her side, low and mostly below the bottom edge of the frame, softly out of focus. The picture is about her face: she looks into the lens smiling warmly.",
    ],
  },
  {
    nombre: "retrato-podcast",
    referencia: "P1013588-1.png",
    pedido: "4:5",
    aspecto: "3:4",
    encuadre: "Vertical portrait, waist up",
    escena: "She wears black over-ear headphones and speaks into a large studio condenser microphone on a boom arm, leaning slightly toward it, mid conversation, animated and warm. A warm lamp glows softly behind her.",
  },
  {
    nombre: "retrato-contacto",
    referencia: "carolina.jpg",
    pedido: "1:1",
    aspecto: "1:1",
    encuadre: "Square framing, close up head and shoulders",
    escena: "A friendly close up of her face and shoulders, looking directly into the camera with an open welcoming smile, soft flattering light from the side.",
  },
  // --- Escenas nuevas ---
  {
    nombre: "retrato-hero",
    referencia: "carolina_alonso_c.png",
    pedido: "3:2",
    aspecto: "3:2",
    // El Soul tira a primer plano centrado y mirando a cámara: hay que decirle
    // la composición con números y con el lado exacto, o la ignora.
    encuadre: "Wide horizontal editorial photograph, medium shot framed from the waist up, camera standing well back from her",
    escena: "She stands small in the frame, occupying only about one third of the picture width, calm and thoughtful with a faint smile, her chin slightly lifted and her eyes directed off toward the empty side of the frame, watching something beyond the edge of the picture.",
    variantes: [
      "She stands over at the right-hand third of the frame, her body angled to the left, her gaze travelling out past the left edge of the picture. The entire left two thirds of the image is bare plaster wall, empty and unoccupied, deliberately left as open space for text.",
      "She stands over at the left-hand third of the frame, her body angled to the right, her gaze travelling out past the right edge of the picture. The entire right two thirds of the image is bare plaster wall, empty and unoccupied, deliberately left as open space for text.",
      "She stands at the right-hand third of the frame in near profile, turned away from the lens toward the window light, eyes lowered and thoughtful. The left two thirds of the image is bare plaster wall, empty and unoccupied, deliberately left as open space for text.",
    ],
  },
  {
    nombre: "retrato-heroina",
    referencia: "P1013588-1.png",
    pedido: "4:5",
    aspecto: "3:4",
    encuadre: "Vertical portrait, standing, three quarter length",
    escena: "She stands tall and at ease, weight on one leg, arms relaxed, turning to the camera with a bright open smile, bathed in warm golden window light that catches the side of her face.",
  },
  {
    nombre: "retrato-reconexion",
    referencia: "P1013993.png",
    pedido: "1:1",
    aspecto: "1:1",
    encuadre: "Square framing, chest up, hands clearly visible in frame",
    escena: "She rests one open hand softly over her heart and the other loosely below it, eyes calm and gentle, a serene unforced expression, in very soft diffused light.",
  },
  {
    nombre: "retrato-firma",
    referencia: "carolina.jpg",
    pedido: "1:1",
    aspecto: "1:1",
    encuadre: "Square framing, tight head shot",
    escena: "A tight, warm portrait of her face, smiling openly and directly at the camera, eyes bright, lit softly and evenly.",
  },
];

// Tres semillas fijas: variantes reproducibles, no lotería.
const SEMILLAS = [11, 27, 43];

const lote = escenaPedida ? ESCENAS.filter((e) => e.nombre === escenaPedida) : ESCENAS;
if (!lote.length) {
  console.error(`No hay escena "${escenaPedida}". Opciones: ${ESCENAS.map((e) => e.nombre).join(", ")}`);
  process.exit(1);
}

/** El Soul ya sabe la cara: aquí se describe la escena y, sobre todo, el fondo. */
function prompt(escena, indice) {
  const cuerpo = escena.variantes?.[indice] ?? escena.escena;
  return `${escena.encuadre}. ${ELLA} ${cuerpo} ${FONDO} ${FOTOGRAFIA} ${LIMPIO}`;
}

// --- Generar -------------------------------------------------------------
const ficha = join(RAIZ, "arte", "soul", "soul.json");
if (!existsSync(ficha)) {
  console.error("Falta arte/soul/soul.json. Corre antes: node scripts/1-soul.mjs");
  process.exit(1);
}
const { referenceId, estado } = JSON.parse(readFileSync(ficha, "utf8"));
if (!referenceId || estado !== "completed") {
  console.error(`El Soul no está listo (estado: ${estado}). Corre antes: node scripts/1-soul.mjs`);
  process.exit(1);
}

mkdirSync(DESTINO, { recursive: true });
const antes = registrarSaldo("antes de los retratos Soul");

const fallos = [];
let hechas = 0;
for (const escena of lote) {
  for (let i = 0; i < 3; i++) {
    const r = generar({
      modelo: "text2image_soul_v2",
      prompt: prompt(escena, i),
      salida: join(DESTINO, `${escena.nombre}-${i + 1}.png`),
      tipo: "imagen",
      params: ["--custom_reference_id", referenceId, "--quality", "2k", "--aspect_ratio", escena.aspecto, "--seed", String(SEMILLAS[i])],
      espera: "15m",
    });
    if (r.ok) hechas++;
    else fallos.push(`${escena.nombre}-${i + 1}`);
  }
}

// --- El comparador, para que elija una persona ---------------------------
function escribirComparador() {
  const filas = ESCENAS.map((e) => {
    const celda = (titulo, ruta, existe) =>
      existe
        ? `<figure><img src="${ruta}" alt="${titulo} — ${e.nombre}"><figcaption>${titulo}</figcaption></figure>`
        : `<figure class="falta"><div class="hueco">no se generó</div><figcaption>${titulo}</figcaption></figure>`;
    const variantes = [1, 2, 3]
      .map((n) => celda(`Variante ${n}`, `soul/${e.nombre}-${n}.png`, existsSync(join(DESTINO, `${e.nombre}-${n}.png`))))
      .join("\n      ");
    const nota = e.pedido !== e.aspecto ? ` · pedido ${e.pedido}, generado ${e.aspecto}` : ` · ${e.aspecto}`;
    return `<section>
    <h2>${e.nombre}<small>${nota}</small></h2>
    <div class="fila">
      ${celda("Foto real de referencia", `../originales/carolina/${e.referencia}`, true)}
      ${variantes}
    </div>
  </section>`;
  }).join("\n");

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Retratos de Carolina — variantes con Soul 2.0</title>
<style>
  :root { --papel:#FBF8F6; --marino:#051324; --tinta:#192D41; --menta:#C2EFE3; --linea:#e6ded9; }
  * { box-sizing: border-box; }
  body { margin:0; padding:40px 32px 80px; background:var(--papel); color:var(--marino);
         font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif; }
  header { max-width:1700px; margin:0 auto 40px; }
  h1 { font-size:30px; margin:0 0 8px; letter-spacing:-0.02em; }
  header p { margin:0 0 6px; color:var(--tinta); max-width:78ch; }
  header mark { background:var(--menta); padding:2px 6px; border-radius:4px; }
  section { max-width:1700px; margin:0 auto 56px; }
  h2 { font-size:19px; margin:0 0 16px; padding-bottom:10px; border-bottom:1px solid var(--linea);
       display:flex; align-items:baseline; gap:12px; }
  h2 small { font-weight:400; font-size:13px; color:#6d7f8f; }
  .fila { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; align-items:start; }
  figure { margin:0; }
  figure img { width:100%; height:auto; display:block; border-radius:10px;
               background:#fff; box-shadow:0 2px 14px rgba(5,19,36,.10); }
  figcaption { margin-top:10px; font-size:14px; font-weight:600; color:var(--tinta); text-align:center; }
  .fila figure:first-child figcaption { color:#6d7f8f; }
  .falta .hueco { aspect-ratio:4/5; display:grid; place-items:center; border:2px dashed var(--linea);
                  border-radius:10px; color:#9aa8b4; font-size:14px; }
  @media (max-width:1100px) { .fila { grid-template-columns:repeat(2,1fr); } }
  @media (max-width:620px)  { .fila { grid-template-columns:1fr; } }
</style>
</head>
<body>
<header>
  <h1>Retratos de Carolina — variantes con Soul 2.0</h1>
  <p>Cada fila es una escena: primero la <strong>foto real</strong> de referencia y después las tres variantes generadas.
  <mark>Elige tú</mark> cuál se queda; los scripts no eligen.</p>
  <p>El modelo Soul no acepta 4:5, así que ahí se generó en 3:4, el vertical más cercano. Generado el ${new Date().toLocaleString("es-CO")}.</p>
</header>
${filas}
</body>
</html>
`;
  const ruta = join(DIR, "comparador.html");
  writeFileSync(ruta, html);
  console.log(`\nComparador: ${ruta}`);
}

escribirComparador();

const despues = registrarSaldo("después de los retratos Soul");
console.log(`\n${hechas} imágenes ≈ ${(hechas * 0.12).toFixed(2)} créditos`);
console.log(`  (saldo ${antes.toFixed(2)} → ${despues.toFixed(2)}; esa resta incluye lo que gastara cualquier trabajo en paralelo)`);
if (fallos.length) {
  console.error(`Fallaron: ${fallos.join(", ")}`);
  process.exitCode = 1;
}

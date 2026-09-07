/**
 * Entrena el Soul 2.0 de Carolina con sus 6 fotos reales.
 *
 *   node scripts/1-soul.mjs
 *
 * Reanudable: si arte/soul/soul.json ya tiene un referenceId entrenado, no
 * vuelve a entrenar. Si quedó a medias, retoma la espera del mismo id.
 *
 * El coste de entrenar un Soul no está documentado: por eso se registra el
 * saldo antes y después. OJO: esa diferencia solo mide el Soul si no corre
 * nada más en paralelo. El cobro ocurre al CREAR el Soul, no al terminar el
 * entrenamiento, así que "costeCreditos" se toma en ese momento y no al
 * final de la espera, que puede durar media hora.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { RAIZ } from "./lib/env.mjs";
import { estadoCuenta, registrarSaldo } from "./lib/higgsfield.mjs";

const FOTOS = [
  "carolina_alonso_c.png",
  "P1013588-1.png",
  "P1013993.png",
  "aboutme.jpg",
  "carolina.jpg",
  "carolia_alonso_c_libro.jpg",
];

const DIR_FOTOS = join(RAIZ, "arte", "originales", "carolina");
const DIR_SOUL = join(RAIZ, "arte", "soul");
const FICHA = join(DIR_SOUL, "soul.json");

// --- 1. El plan debe ser de pago: en el gratuito no se puede entrenar Soul ---
const cuenta = estadoCuenta();
if (!cuenta.subscription_plan_type || /free|libre/i.test(cuenta.subscription_plan_type)) {
  console.error(`Plan "${cuenta.subscription_plan_type}": entrenar un Soul necesita un plan de pago. Aborto.`);
  process.exit(1);
}
console.log(`Plan ${cuenta.subscription_plan_type} · ${cuenta.email}`);

// --- 2. ¿Ya hay un Soul entrenado? ---
mkdirSync(DIR_SOUL, { recursive: true });
let ficha = existsSync(FICHA) ? JSON.parse(readFileSync(FICHA, "utf8")) : null;
if (ficha?.referenceId && ficha?.estado === "completed") {
  console.log(`· Soul ya entrenado: ${ficha.referenceId} (${ficha.fecha})`);
  process.exit(0);
}

// --- 3. Las 6 fotos tienen que estar ---
const rutas = FOTOS.map((f) => join(DIR_FOTOS, f));
const ausentes = rutas.filter((r) => !existsSync(r));
if (ausentes.length) {
  console.error(`Faltan fotos: ${ausentes.join(", ")}. Corre antes: node scripts/0-descargar.mjs`);
  process.exit(1);
}

const saldoAntes = registrarSaldo("antes de entrenar el Soul");

// --- 4. Crear (o retomar) el entrenamiento ---
let soulId = ficha?.referenceId;
let saldoTrasCrear = ficha?.saldoTrasCrear ?? null;
let respuestaCrear = ficha?.respuestaCrear ?? null;

if (!soulId) {
  console.log(`→ entrenando Soul 2.0 "carolina" con ${rutas.length} fotos…`);
  const crudo = execFileSync(
    "higgsfield",
    ["soul-id", "create", "--name", "carolina", "--soul-2", ...rutas.flatMap((r) => ["--image", r]), "--json", "--no-color"],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "inherit"] },
  );
  respuestaCrear = parsearJson(crudo) ?? { crudo };
  soulId = buscarId(respuestaCrear) ?? buscarIdEnTexto(crudo);
  if (!soulId) {
    writeFileSync(join(DIR_SOUL, "soul-error.json"), crudo);
    console.error("No se pudo leer el id del Soul; respuesta cruda en arte/soul/soul-error.json");
    process.exit(1);
  }
  console.log(`  id: ${soulId}`);
  // El cobro es inmediato: se mide aquí, antes de esperar, para que la cifra
  // sea del Soul y no de todo lo que pase mientras entrena.
  saldoTrasCrear = registrarSaldo("justo después de crear el Soul");
  console.log(`  coste del Soul: ${(saldoAntes - saldoTrasCrear).toFixed(2)} créditos`);
  // Se guarda ya, para poder retomar la espera si el proceso se corta.
  writeFileSync(FICHA, `${JSON.stringify({ referenceId: soulId, estado: "training", fecha: new Date().toISOString(), fotos: FOTOS, saldoAntes, saldoTrasCrear, costeCreditos: Number((saldoAntes - saldoTrasCrear).toFixed(2)), respuestaCrear }, null, 2)}\n`);
} else {
  console.log(`→ retomando la espera del Soul ${soulId}…`);
}

// --- 5. Esperar a que termine el entrenamiento ---
console.log("  esperando (hasta 60m)…");
let respuestaEspera = null;
try {
  const crudo = execFileSync("higgsfield", ["soul-id", "wait", soulId, "--timeout", "60m", "--json", "--no-color"], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"],
  });
  respuestaEspera = parsearJson(crudo) ?? { crudo };
} catch (e) {
  console.error(`El entrenamiento falló o expiró: ${`${e.message ?? e}`.slice(0, 400)}`);
  respuestaEspera = { error: `${e.message ?? e}`.slice(0, 2000), stdout: `${e.stdout ?? ""}`.slice(0, 8000) };
}

const saldoDespues = registrarSaldo("después de entrenar el Soul");
const estado = respuestaEspera?.status ?? respuestaEspera?.state ?? (respuestaEspera?.error ? "failed" : "completed");

writeFileSync(
  FICHA,
  `${JSON.stringify(
    {
      referenceId: soulId,
      estado,
      fecha: new Date().toISOString(),
      fotos: FOTOS,
      modelo: "soul-2",
      saldoAntes,
      saldoTrasCrear,
      saldoDespues,
      // El cobro es al crear. Si saldoTrasCrear existe, esa resta es la buena;
      // la otra incluiría lo que hayan gastado otros trabajos en paralelo.
      costeCreditos: Number(((saldoAntes - (saldoTrasCrear ?? saldoDespues))).toFixed(2)),
      notaCoste: saldoTrasCrear == null
        ? "medido de extremo a extremo: puede incluir gasto de otros trabajos en paralelo"
        : "medido en el momento del cobro (creación del Soul)",
      respuestaCrear,
      respuestaEspera,
    },
    null,
    2,
  )}\n`,
);

console.log(`\nSoul ${soulId} — estado: ${estado}`);
if (saldoTrasCrear != null) {
  console.log(`Coste del entrenamiento: ${(saldoAntes - saldoTrasCrear).toFixed(2)} créditos (cobrado al crear)`);
} else {
  console.log(`Coste aproximado: ${(saldoAntes - saldoDespues).toFixed(2)} créditos (medido de extremo a extremo)`);
}
console.log(`Ficha: ${FICHA}`);
if (estado !== "completed") process.exitCode = 1;

// --- utilidades ---
function parsearJson(texto) {
  for (const bloque of [texto, ...texto.split("\n")]) {
    const t = bloque.trim();
    if (!t.startsWith("{") && !t.startsWith("[")) continue;
    try {
      return JSON.parse(t);
    } catch {
      /* sigue */
    }
  }
  return null;
}

/** Busca recursivamente algo que parezca el id del Soul. */
function buscarId(nodo) {
  if (!nodo || typeof nodo !== "object") return null;
  for (const clave of ["reference_id", "referenceId", "custom_reference_id", "id", "soul_id"]) {
    const v = nodo[clave];
    if (typeof v === "string" && v.length >= 8) return v;
  }
  for (const valor of Object.values(nodo)) {
    const encontrado = buscarId(valor);
    if (encontrado) return encontrado;
  }
  return null;
}

function buscarIdEnTexto(texto) {
  return texto.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] ?? null;
}

/**
 * Mini-parser de .env.local sin dependencias.
 * Nunca exporta la clave al proceso ni la imprime: quien la necesite la pide
 * por nombre y la usa en memoria.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Raíz del proyecto (scripts/lib/ -> ../../). */
export const RAIZ = join(import.meta.dirname, "..", "..");

/** Lee .env.local y lo mezcla con process.env. */
export function leerEnv() {
  let texto = "";
  try {
    texto = readFileSync(join(RAIZ, ".env.local"), "utf8");
  } catch {
    return { ...process.env };
  }
  const env = { ...process.env };
  for (const linea of texto.split("\n")) {
    const l = linea.trim();
    if (!l || l.startsWith("#") || !l.includes("=")) continue;
    const i = l.indexOf("=");
    const clave = l.slice(0, i).trim();
    let valor = l.slice(i + 1).trim();
    // Quita comillas envolventes, simples o dobles.
    valor = valor.replace(/^"(.*)"$/s, "$1").replace(/^'(.*)'$/s, "$1");
    env[clave] = valor;
  }
  return env;
}

/**
 * Devuelve una variable obligatoria o aborta con un mensaje claro.
 * El valor NUNCA se imprime.
 */
export function exigir(nombre) {
  const valor = leerEnv()[nombre];
  if (!valor) {
    console.error(`Falta ${nombre} en .env.local (o en el entorno).`);
    process.exit(1);
  }
  return valor;
}

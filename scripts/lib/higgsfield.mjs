/**
 * Envoltorio reanudable del CLI de Higgsfield.
 *
 * Patrón (tomado de /Users/testuser/Herd/gabinete/scripts/higgsfield.mjs):
 *   1. Si el archivo de salida ya existe, se salta.
 *   2. Ejecuta el CLI con --json y --wait.
 *   3. Extrae la URL del resultado del JSON.
 *   4. Descarga con curl.
 *   5. Guarda una bitácora .json junto al archivo, con el prompt literal dentro.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { huella } from "./hash.mjs";

const EXTENSIONES = {
  imagen: "png|jpg|jpeg|webp|avif",
  video: "mp4|webm|mov|m4v",
};

/** Estado de la cuenta: { credits, email, subscription_plan_type }. */
export function estadoCuenta() {
  const salida = execFileSync("higgsfield", ["account", "status", "--json", "--no-color"], {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  return JSON.parse(salida);
}

/** Créditos disponibles, como número. */
export function saldo() {
  return Number(estadoCuenta().credits);
}

/** Imprime y devuelve el saldo, etiquetado, para llevar la cuenta del gasto. */
export function registrarSaldo(etiqueta) {
  const creditos = saldo();
  console.log(`[saldo] ${etiqueta}: ${creditos.toFixed(2)} créditos`);
  return creditos;
}

/**
 * Busca la URL del resultado en la salida del CLI.
 * Primero intenta parsear el JSON; si no, cae a expresiones regulares.
 */
export function extraerUrls(stdout, tipo = "imagen") {
  const encontradas = [];

  const recorrer = (nodo) => {
    if (!nodo) return;
    if (typeof nodo === "string") {
      if (/^https?:\/\//.test(nodo)) encontradas.push(nodo);
      return;
    }
    if (Array.isArray(nodo)) {
      for (const hijo of nodo) recorrer(hijo);
      return;
    }
    if (typeof nodo === "object") {
      // Se priorizan las claves que suelen traer el resultado final.
      const preferidas = ["url", "video_url", "image_url", "result_url", "raw", "min", "output"];
      for (const clave of preferidas) if (clave in nodo) recorrer(nodo[clave]);
      for (const [clave, valor] of Object.entries(nodo)) {
        if (!preferidas.includes(clave)) recorrer(valor);
      }
    }
  };

  // El CLI puede imprimir varios objetos JSON seguidos: se prueba línea a línea.
  const bloques = [stdout, ...stdout.split("\n")];
  for (const bloque of bloques) {
    const t = bloque.trim();
    if (!t.startsWith("{") && !t.startsWith("[")) continue;
    try {
      recorrer(JSON.parse(t));
      if (encontradas.length) break;
    } catch {
      /* no era JSON completo: se sigue */
    }
  }

  const ext = EXTENSIONES[tipo] ?? EXTENSIONES.imagen;
  const conExtension = encontradas.filter((u) => new RegExp(`\\.(?:${ext})(?:\\?|$)`, "i").test(u));
  if (conExtension.length) return conExtension;

  if (encontradas.length) return encontradas;

  // Último recurso: rastrear el texto crudo.
  const crudas = [...stdout.matchAll(new RegExp(`https?://[^"'\\s]+\\.(?:${ext})(?:\\?[^"'\\s]*)?`, "gi"))].map((m) => m[0]);
  return crudas;
}

/** Descarga una URL a disco con curl. */
export function descargar(url, destino) {
  mkdirSync(dirname(destino), { recursive: true });
  execFileSync("curl", ["-fsSL", "--retry", "3", "--retry-delay", "2", "-o", destino, url], {
    stdio: ["ignore", "ignore", "inherit"],
  });
}

/**
 * Genera una pieza y la deja en `salida`. Reanudable.
 *
 * @param {object} p
 * @param {string} p.modelo        job_type de Higgsfield (gpt_image_2, seedance_2_0, ...)
 * @param {string} p.prompt        prompt literal
 * @param {string} p.salida        ruta absoluta del archivo final
 * @param {"imagen"|"video"} p.tipo
 * @param {string[]} [p.params]    parámetros extra del CLI, ya en pares --clave valor
 * @param {string} [p.imagenInicio] ruta para --start-image
 * @param {string[]} [p.referencias] rutas para --image-references
 * @param {string} [p.espera]      timeout de --wait-timeout (por defecto 20m)
 * @returns {{ok: boolean, saltado?: boolean, salida: string, error?: string}}
 */
export function generar({ modelo, prompt, salida, tipo = "imagen", params = [], imagenInicio, referencias = [], espera = "20m" }) {
  if (existsSync(salida)) {
    console.log(`· ya existe, se salta: ${salida}`);
    return { ok: true, saltado: true, salida };
  }
  mkdirSync(dirname(salida), { recursive: true });

  const argumentos = [
    "generate",
    "create",
    modelo,
    "--prompt",
    prompt,
    ...(imagenInicio ? ["--start-image", imagenInicio] : []),
    ...referencias.flatMap((r) => ["--image-references", r]),
    ...params,
    "--wait",
    "--wait-timeout",
    espera,
    "--json",
    "--no-color",
  ];

  console.log(`→ ${modelo} :: ${salida.split("/").slice(-2).join("/")}`);
  let stdout = "";
  try {
    stdout = execFileSync("higgsfield", argumentos, {
      encoding: "utf8",
      maxBuffer: 40 * 1024 * 1024,
      stdio: ["ignore", "pipe", "inherit"],
    });
  } catch (e) {
    const error = `${e.message ?? e}`.slice(0, 500);
    console.error(`  ✗ falló: ${error}`);
    escribirBitacora(salida, { modelo, prompt, params, imagenInicio, referencias, error, stdout: `${e.stdout ?? ""}`.slice(0, 20000) });
    return { ok: false, salida, error };
  }

  const urls = extraerUrls(stdout, tipo);
  escribirBitacora(salida, { modelo, prompt, params, imagenInicio, referencias, urls, stdout: stdout.slice(0, 200000) });

  if (!urls.length) {
    console.error(`  ✗ sin URL de resultado (ver bitácora ${salida}.json)`);
    return { ok: false, salida, error: "sin-url" };
  }

  try {
    descargar(urls[0], salida);
  } catch (e) {
    const error = `descarga falló: ${`${e.message ?? e}`.slice(0, 300)}`;
    console.error(`  ✗ ${error}`);
    return { ok: false, salida, error };
  }
  console.log(`  ✓ ${salida}`);
  return { ok: true, salida, url: urls[0] };
}

/** Bitácora junto al archivo: siempre con el prompt literal dentro. */
export function escribirBitacora(salida, datos) {
  mkdirSync(dirname(salida), { recursive: true });
  const conHuella = datos.prompt ? { huellaPrompt: huella(datos.prompt), ...datos } : datos;
  writeFileSync(`${salida}.json`, `${JSON.stringify({ generado: new Date().toISOString(), ...conHuella }, null, 2)}\n`);
}

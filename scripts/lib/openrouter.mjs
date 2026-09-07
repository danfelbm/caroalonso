/**
 * Cliente mínimo de OpenRouter para generar imágenes con fotos de referencia.
 *
 * Usa /chat/completions con modalities ["image","text"]: las fotos de
 * referencia viajan dentro del mensaje como data URI en base64 y la imagen
 * generada vuelve, también en base64, dentro de la respuesta.
 *
 * La clave se lee de .env.local y NUNCA se imprime ni se guarda en la bitácora.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname } from "node:path";

import { exigir } from "./env.mjs";
import { huella } from "./hash.mjs";

const PUNTO_FINAL = "https://openrouter.ai/api/v1/chat/completions";

const TIPOS = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** Convierte un archivo de imagen en un data URI base64. */
export function aDataUri(ruta) {
  const tipo = TIPOS[extname(ruta).toLowerCase()] ?? "image/png";
  return `data:${tipo};base64,${readFileSync(ruta).toString("base64")}`;
}

/**
 * Rastrea la respuesta buscando la imagen generada. OpenRouter la devuelve en
 * choices[0].message.images[].image_url.url, pero según el modelo puede
 * aparecer en otras claves: se buscan todas y se admite base64 pelado.
 * El esquema dice "URL o datos en base64": por eso también se admite http(s).
 */
export function extraerImagen(respuesta) {
  const candidatas = [];

  const mirar = (valor) => {
    if (typeof valor !== "string") return;
    if (valor.startsWith("data:image/")) {
      const coma = valor.indexOf(",");
      candidatas.push({ base64: valor.slice(coma + 1), tipo: valor.slice(5, valor.indexOf(";")) });
      return;
    }
    if (/^https?:\/\/\S+$/.test(valor) && /\.(png|jpe?g|webp)(\?|$)/i.test(valor)) {
      candidatas.push({ enlace: valor, tipo: "image/png", base64: "" });
      return;
    }
    if (valor.length < 256) return;
    if (/^[A-Za-z0-9+/\s]+={0,2}$/.test(valor.slice(0, 512))) {
      // base64 sin encabezado: se acepta si además huele a PNG/JPEG/WebP.
      if (/^(iVBORw0KGgo|\/9j\/|UklGR|R0lGOD)/.test(valor.trim())) {
        const cabecera = valor.trim().slice(0, 4);
        const tipo = cabecera.startsWith("iVBO") ? "image/png" : cabecera.startsWith("/9j") ? "image/jpeg" : "image/webp";
        candidatas.push({ base64: valor.trim(), tipo });
      }
    }
  };

  const recorrer = (nodo, profundidad = 0) => {
    if (profundidad > 12 || nodo == null) return;
    if (typeof nodo === "string") return mirar(nodo);
    if (Array.isArray(nodo)) return nodo.forEach((h) => recorrer(h, profundidad + 1));
    if (typeof nodo === "object") {
      // Rutas conocidas primero.
      for (const clave of ["images", "image_url", "url", "b64_json", "data", "image", "content"]) {
        if (clave in nodo) recorrer(nodo[clave], profundidad + 1);
      }
      for (const [clave, valor] of Object.entries(nodo)) {
        if (!["images", "image_url", "url", "b64_json", "data", "image", "content"].includes(clave)) recorrer(valor, profundidad + 1);
      }
    }
  };

  recorrer(respuesta);
  // La más larga suele ser la imagen final, no una miniatura.
  candidatas.sort((a, b) => b.base64.length - a.base64.length);
  return candidatas[0] ?? null;
}

/** Si la imagen llegó como enlace en vez de base64, se baja. */
async function resolverBytes(imagen) {
  if (imagen.base64) return Buffer.from(imagen.base64, "base64");
  const r = await fetch(imagen.enlace);
  if (!r.ok) throw new Error(`no se pudo bajar la imagen: HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

/**
 * Genera una imagen y la escribe en `salida`. Reanudable: si ya existe, se salta.
 *
 * @param {object} p
 * @param {string} p.modelo       p.ej. "openai/gpt-5.4-image-2"
 * @param {string} p.prompt       instrucción literal
 * @param {string[]} [p.referencias] rutas de imágenes de referencia
 * @param {string} p.salida       ruta absoluta del PNG final
 * @param {object} [p.imageConfig] opciones del proveedor: { aspect_ratio, quality, ... }
 * @param {number} [p.reintentos] intentos ante error de red o 5xx
 * @returns {Promise<{ok:boolean, saltado?:boolean, salida:string, error?:string}>}
 */
export async function generarImagen({ modelo, prompt, referencias = [], salida, imageConfig = null, reintentos = 2 }) {
  if (existsSync(salida)) {
    console.log(`· ya existe, se salta: ${salida}`);
    return { ok: true, saltado: true, salida };
  }
  mkdirSync(dirname(salida), { recursive: true });

  const clave = exigir("OPENROUTER_API_KEY");
  const contenido = [
    { type: "text", text: prompt },
    ...referencias.map((ruta) => ({ type: "image_url", image_url: { url: aDataUri(ruta) } })),
  ];
  // El texto va primero y las imágenes después: es como OpenRouter lo parsea.
  const cuerpo = {
    model: modelo,
    messages: [{ role: "user", content: contenido }],
    modalities: ["image", "text"],
    ...(imageConfig ? { image_config: imageConfig } : {}),
  };

  console.log(`→ ${modelo} :: ${salida.split("/").slice(-2).join("/")} (${referencias.length} referencias)`);

  let ultimoError = null;
  for (let intento = 1; intento <= reintentos + 1; intento++) {
    let datos = null;
    try {
      const r = await fetch(PUNTO_FINAL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clave}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://www.caroalonso.com",
          "X-Title": "caroalonso-arte",
        },
        body: JSON.stringify(cuerpo),
      });
      const texto = await r.text();
      try {
        datos = JSON.parse(texto);
      } catch {
        datos = { crudo: texto.slice(0, 4000) };
      }
      if (!r.ok) {
        ultimoError = `HTTP ${r.status}: ${(datos?.error?.message ?? texto).slice(0, 300)}`;
        // 4xx que no sea 429 no se reintenta: el prompt o el modelo están mal.
        if (r.status < 500 && r.status !== 429) {
          bitacora(salida, { modelo, prompt, referencias, error: ultimoError, respuesta: recortar(datos) });
          console.error(`  ✗ ${ultimoError}`);
          return { ok: false, salida, error: ultimoError };
        }
        console.error(`  intento ${intento}: ${ultimoError}`);
        await dormir(2500 * intento);
        continue;
      }
    } catch (e) {
      ultimoError = `red: ${`${e.message ?? e}`.slice(0, 200)}`;
      console.error(`  intento ${intento}: ${ultimoError}`);
      await dormir(2500 * intento);
      continue;
    }

    const imagen = extraerImagen(datos);
    if (!imagen) {
      ultimoError = "la respuesta no traía imagen";
      bitacora(salida, { modelo, prompt, referencias, error: ultimoError, respuesta: recortar(datos) });
      console.error(`  ✗ ${ultimoError} (ver ${salida}.json)`);
      return { ok: false, salida, error: ultimoError };
    }

    let bytes;
    try {
      bytes = await resolverBytes(imagen);
    } catch (e) {
      ultimoError = `${e.message ?? e}`.slice(0, 200);
      bitacora(salida, { modelo, prompt, referencias, imageConfig, error: ultimoError, respuesta: recortar(datos) });
      console.error(`  ✗ ${ultimoError}`);
      return { ok: false, salida, error: ultimoError };
    }
    writeFileSync(salida, bytes);
    bitacora(salida, {
      modelo,
      prompt,
      referencias,
      imageConfig,
      tipoImagen: imagen.tipo,
      bytes: bytes.length,
      costeUsd: datos?.usage?.cost ?? null,
      respuesta: recortar(datos),
    });
    console.log(`  ✓ ${salida}`);
    return { ok: true, salida };
  }

  bitacora(salida, { modelo, prompt, referencias, error: ultimoError });
  console.error(`  ✗ agotados los intentos: ${ultimoError}`);
  return { ok: false, salida, error: ultimoError };
}

/** Quita los base64 gigantes para que la bitácora sea legible. */
function recortar(nodo, profundidad = 0) {
  if (profundidad > 10) return "…";
  if (typeof nodo === "string") return nodo.length > 400 ? `${nodo.slice(0, 120)}…[${nodo.length} car.]` : nodo;
  if (Array.isArray(nodo)) return nodo.map((h) => recortar(h, profundidad + 1));
  if (nodo && typeof nodo === "object") {
    return Object.fromEntries(Object.entries(nodo).map(([k, v]) => [k, recortar(v, profundidad + 1)]));
  }
  return nodo;
}

/** Bitácora junto al archivo, con el prompt literal y sin la clave. */
function bitacora(salida, datos) {
  mkdirSync(dirname(salida), { recursive: true });
  const conHuella = datos.prompt ? { huellaPrompt: huella(datos.prompt), ...datos } : datos;
  writeFileSync(`${salida}.json`, `${JSON.stringify({ generado: new Date().toISOString(), motor: "openrouter", ...conHuella }, null, 2)}\n`);
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

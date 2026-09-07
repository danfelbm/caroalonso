/**
 * Huellas cortas para versionar nombres de archivo: si cambia el prompt,
 * cambia el sufijo y el script vuelve a generar la pieza en vez de saltarla.
 */
import { createHash } from "node:crypto";

/** sha256 recortado a 8 caracteres hexadecimales. */
export function huella(...partes) {
  const h = createHash("sha256");
  for (const parte of partes) h.update(String(parte));
  return h.digest("hex").slice(0, 8);
}

/** "retrato-libro" + prompt -> "retrato-libro-3f9a1c2b.png" */
export function nombreVersionado(base, extension, ...partes) {
  return `${base}-${huella(...partes)}.${extension}`;
}

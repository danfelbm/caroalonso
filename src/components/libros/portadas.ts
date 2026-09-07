import "server-only";

import { closeSync, existsSync, openSync, readSync } from "node:fs";
import { join } from "node:path";

import { rutaPortada } from "@/lib/datos";

/** Los anchos que escribe `scripts/6-optimizar.mjs` para la carpeta de libros. */
const ANCHOS = [400, 800, 1200] as const;

export interface ArchivoPortada {
  /** El archivo de nombre estable, el que sirve de reserva. */
  src: string;
  /** Los anchos que existen de verdad, en formato `srcset`. Puede ir vacío. */
  srcSet: string;
  ancho: number;
  alto: number;
}

/**
 * Qué hay en `public/libros/` para un libro dado, o `null` si aún no hay nada.
 *
 * DE PASO: EL MANIFIESTO LLEGARÁ DESPUÉS. `scripts/6-optimizar.mjs` ya escribe
 * `src/data/imagenes.json` con el ancho, el alto y las variantes de cada
 * archivo, pero `src/lib/datos` todavía no lo expone y las vistas no leen
 * `src/data` directamente. Mientras esa puerta no exista, este módulo mira el
 * disco en tiempo de construcción —las ocho páginas se prerenderizan, así que
 * nadie paga esto en una visita— y el día que haya un `getImagen()` se borra
 * entero y `portada-libro.tsx` le pide los mismos cuatro datos a él.
 *
 * Que devuelva `null` no es un error: significa que todavía no se ha corrido el
 * pipeline de arte, y la portada se pinta como marco de color.
 *
 * Sin memoria de una llamada a otra, a propósito. Son cinco `stat` por portada
 * y no llegan a un milisegundo; recordarlos ahorraría eso y a cambio dejaría
 * una portada recién generada sin aparecer hasta reiniciar el servidor de
 * desarrollo, que es exactamente el rato en que más cambian.
 */
export function archivoPortada(base: string): ArchivoPortada | null {
  const publico = join(process.cwd(), "public");
  const src = rutaPortada(base);

  const medidas = medirWebp(join(publico, src));
  if (!medidas) return null;

  const variantes = ANCHOS.map((ancho) => ({ ancho, ruta: rutaPortada(`${base}-${ancho}`) })).filter(
    ({ ruta }) => existsSync(join(publico, ruta)),
  );

  return {
    src,
    srcSet: variantes.map(({ ancho, ruta }) => `${ruta} ${ancho}w`).join(", "),
    ...medidas,
  };
}

/**
 * Ancho y alto reales, leídos de la cabecera del WebP.
 *
 * Hacen falta por dos razones. Un `<img>` sin `width` ni `height` empuja la
 * página hacia abajo cuando termina de bajar la imagen, y aquí hay siete. Y
 * las siete portadas no tienen la misma proporción: cinco son fotos de
 * producto cuadradas, «Sal del laberinto» es un montaje apaisado y «Sé la
 * heroína» es la cubierta plana, vertical. Con las medidas de verdad el
 * navegador reserva el hueco exacto, la sombra abraza el libro y ninguna
 * portada se recorta ni se estira.
 *
 * Se leen 32 bytes y ya: el tamaño va en la cabecera, y los tres sabores de
 * WebP lo guardan en sitios distintos.
 */
function medirWebp(ruta: string): { ancho: number; alto: number } | null {
  const cabecera = Buffer.alloc(32);
  let descriptor: number | null = null;

  try {
    descriptor = openSync(ruta, "r");
    if (readSync(descriptor, cabecera, 0, 32, 0) < 30) return null;
  } catch {
    // No existe, o no se puede leer: para el caso es lo mismo que no estar.
    return null;
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }

  if (cabecera.toString("latin1", 0, 4) !== "RIFF") return null;
  if (cabecera.toString("latin1", 8, 12) !== "WEBP") return null;

  switch (cabecera.toString("latin1", 12, 16)) {
    // Con pérdida: los catorce bits bajos de cada uno de los dos enteros.
    case "VP8 ":
      return {
        ancho: cabecera.readUInt16LE(26) & 0x3fff,
        alto: cabecera.readUInt16LE(28) & 0x3fff,
      };
    // Sin pérdida: los dos van empaquetados en un entero de cuatro bytes, y
    // guardados con uno de menos que el valor real.
    case "VP8L": {
      const empaquetado = cabecera.readUInt32LE(21);
      return {
        ancho: (empaquetado & 0x3fff) + 1,
        alto: ((empaquetado >> 14) & 0x3fff) + 1,
      };
    }
    // Extendido (animación, alfa, metadatos): tres bytes cada uno, también
    // con uno de menos.
    case "VP8X":
      return {
        ancho: cabecera.readUIntLE(24, 3) + 1,
        alto: cabecera.readUIntLE(27, 3) + 1,
      };
    default:
      return null;
  }
}

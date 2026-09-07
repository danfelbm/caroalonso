import Link from "next/link";

import { IconoFlechaDerecha } from "@/components/ui/iconos";
import { urlLibro } from "@/lib/datos";
import { cn } from "@/lib/utils";
import type { Libro, LibrosAdyacentes } from "@/types/libro";

import { paletaLibro } from "./paleta";

/**
 * El pie de cada ficha: el libro de antes y el de después.
 *
 * La lista es circular —`getLibrosAdyacentes()` da la vuelta—, así que las
 * etiquetas no pueden ser «más nuevo» y «más viejo»: desde el primero, el
 * anterior es el último. «Anterior» y «Siguiente» dicen la verdad, y el año
 * junto al título coloca al lector sin necesidad de más.
 */
export function NavegacionLibros({ anterior, siguiente }: LibrosAdyacentes) {
  if (!anterior && !siguiente) return null;

  return (
    <nav aria-label="Otros libros" className="grid gap-4 sm:grid-cols-2 sm:gap-6">
      {anterior && <Vecino libro={anterior} sentido="anterior" />}
      {siguiente && <Vecino libro={siguiente} sentido="siguiente" />}
    </nav>
  );
}

function Vecino({ libro, sentido }: { libro: Libro; sentido: "anterior" | "siguiente" }) {
  const paleta = paletaLibro(libro);
  const siguiente = sentido === "siguiente";

  return (
    <Link
      href={urlLibro(libro.slug)}
      className={cn(
        "tactil group flex items-center gap-5 rounded-panel border border-marino/10 p-5 hover:border-marino/25 sm:p-6",
        // El siguiente empuja su contenido hacia el borde derecho: el gesto de
        // «se sigue por aquí» sin tener que escribirlo.
        siguiente && "sm:flex-row-reverse sm:text-right",
      )}
    >
      {/* Los dos colores del vecino, en miniatura: se reconoce a dónde se va
          antes de leer el título. */}
      <span
        aria-hidden
        className="size-12 shrink-0 rounded-tarjeta border-2 sm:size-14"
        style={{ backgroundColor: libro.colorSeccion, borderColor: paleta.papel.acento }}
      />

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "eyebrow flex items-center gap-2 opacity-45",
            siguiente && "sm:justify-end",
          )}
        >
          {/* La flecha vive dentro de la etiqueta y no suelta en un borde: así
              apunta al lado correcto tanto de ida como de vuelta. */}
          {!siguiente && <IconoFlechaDerecha className="rotate-180 text-[1.125rem]" />}
          {siguiente ? "Siguiente" : "Anterior"}
          {siguiente && <IconoFlechaDerecha className="text-[1.125rem]" />}
        </span>
        <span className="mt-2 block font-display text-rotulo group-hover:text-azul">
          {libro.titulo}
        </span>
        <span className="cifras mt-1 block text-nota opacity-50">{libro.anio}</span>
      </span>
    </Link>
  );
}

import Link from "next/link";

import { IconoFlechaDerecha } from "@/components/ui/iconos";
import { urlLibro } from "@/lib/datos";
import { cn } from "@/lib/utils";
import type { Libro } from "@/types/libro";

import { paletaLibro } from "./paleta";
import { PortadaLibro } from "./portada-libro";

interface FilaLibroProps {
  libro: Libro;
  /** Las filas van cambiando de lado, como las secciones de Lookback. */
  invertida?: boolean;
}

/**
 * Un libro del catálogo en el índice: bloque de color con la portada a un lado
 * y el año, el título y el resumen al otro.
 *
 * El color del libro se queda en el bloque de la portada y no en la banda
 * entera. Seis bandas de color seguidas cansan; seis marcos de color sobre
 * papel dejan que cada libro tenga el suyo y que la página siga respirando.
 */
export function FilaLibro({ libro, invertida }: FilaLibroProps) {
  const paleta = paletaLibro(libro);
  const ficha = urlLibro(libro.slug);
  const catalogo = [libro.genero, libro.editorial].filter(Boolean).join(" · ");

  return (
    <article className="group grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-16">
      {/* La portada también lleva a la ficha, pero sin ser una segunda parada
          del tabulador ni un segundo anuncio: el enlace de verdad es el
          título, y esto es el mismo destino con otra forma. */}
      <Link
        href={ficha}
        aria-hidden
        tabIndex={-1}
        className={cn(
          "panel tactil flex items-center justify-center p-8 sm:p-12 lg:p-14",
          invertida && "lg:order-2",
        )}
        style={{ backgroundColor: libro.colorSeccion }}
      >
        <PortadaLibro
          libro={libro}
          sizes="(min-width: 64rem) 22rem, (min-width: 40rem) 55vw, 72vw"
          className="max-h-[16rem] sm:max-h-[20rem]"
        />
      </Link>

      <div>
        <p className="cifras font-display text-subtitulo" style={{ color: paleta.papel.acento }}>
          {libro.anio}
        </p>

        <h3 className="mt-3 text-rotulo sm:text-subtitulo">
          <Link href={ficha} className="tactil inline-flex items-baseline gap-3 hover:text-azul">
            {libro.titulo}
            <IconoFlechaDerecha className="shrink-0 self-center text-[0.9em] text-marino-tenue transition-[color,transform] duration-300 ease-suave group-hover:translate-x-1 group-hover:text-azul" />
          </Link>
        </h3>

        {catalogo && <p className="mt-3 text-nota opacity-50">{catalogo}</p>}

        <p className="mt-5 max-w-[46ch] text-entradilla opacity-70">{libro.resumen}</p>

        {libro.estado === "solo-consulta" && (
          <p className="mt-5 text-nota opacity-50">Ya no está en librerías.</p>
        )}
      </div>
    </article>
  );
}

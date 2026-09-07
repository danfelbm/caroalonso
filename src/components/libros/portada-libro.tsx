import { colorTexto } from "@/lib/color";
import { cn } from "@/lib/utils";
import type { Libro } from "@/types/libro";

import { archivoPortada } from "./portadas";

type LibroConPortada = Pick<Libro, "titulo" | "portada" | "colorPortada">;

interface PortadaLibroProps {
  libro: LibroConPortada;
  /**
   * La primera portada de cada página se pide de inmediato; las demás esperan
   * a que el lector se acerque.
   */
  prioridad?: boolean;
  /** Qué ancho ocupará en pantalla, para que el navegador elija el archivo. */
  sizes?: string;
  /** Aquí manda el tope de alto: cada portada tiene su propia proporción. */
  className?: string;
}

/**
 * La portada como objeto: la foto de producto de la editorial con la sombra
 * proyectada del sistema, para que se lea como un libro sobre una mesa.
 *
 * Ni `object-cover` ni una proporción fija. Las siete portadas no miden lo
 * mismo —hay cuadradas, apaisadas y una cubierta plana vertical— y cualquier
 * caja de proporción única acabaría recortando el título de alguna. Se dejan a
 * su tamaño natural, limitadas por el alto que ponga quien la use, y el
 * `width`/`height` del archivo real le da al navegador la proporción antes de
 * bajar un solo byte.
 */
export function PortadaLibro({ libro, prioridad, sizes, className }: PortadaLibroProps) {
  const archivo = archivoPortada(libro.portada);

  if (!archivo) return <MarcoDeColor libro={libro} className={className} />;

  return (
    /*
      `<img>` a pelo y no `next/image`. Estas portadas ya salen convertidas y
      redimensionadas de `scripts/6-optimizar.mjs`, con nombres estables y una
      cabecera de caché propia en next.config.ts: pasarlas otra vez por
      /_next/image sería optimizar lo ya optimizado y meter un componente de
      cliente donde no hace falta ninguno.
    */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={archivo.src}
      srcSet={archivo.srcSet || undefined}
      sizes={archivo.srcSet ? sizes : undefined}
      width={archivo.ancho}
      height={archivo.alto}
      alt={`Portada de ${libro.titulo}`}
      loading={prioridad ? "eager" : "lazy"}
      fetchPriority={prioridad ? "high" : undefined}
      decoding="async"
      className={cn("mx-auto block h-auto w-auto max-w-full rounded-tarjeta shadow-portada", className)}
    />
  );
}

/**
 * Lo que se ve mientras no haya archivo: un marco en el color real de la
 * portada con el título dentro.
 *
 * No es un adorno para el futuro: si alguien clona el repositorio y construye
 * sin haber corrido `npm run assets:optimizar`, `public/libros/` está vacía y
 * un `<img>` roto pintaría siete iconos grises. Esto mantiene la página en pie
 * y en la paleta del libro.
 */
function MarcoDeColor({ libro, className }: { libro: LibroConPortada; className?: string }) {
  const tinta = colorTexto(libro.colorPortada);

  return (
    <div
      className={cn(
        "mx-auto flex aspect-[4/5] w-full max-w-[18rem] items-center justify-center rounded-tarjeta border-2 p-7 text-center shadow-portada",
        className,
      )}
      style={{
        borderColor: tinta,
        color: tinta,
        // Un velo del color de la portada sobre el papel: se reconoce el libro
        // sin que el texto pierda contraste.
        backgroundColor: `color-mix(in srgb, ${libro.colorPortada} 10%, var(--color-papel))`,
      }}
    >
      <p className="font-display text-rotulo">{libro.titulo}</p>
    </div>
  );
}

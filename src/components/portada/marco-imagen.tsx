import type { CSSProperties, ReactNode } from "react";

import { contraste } from "@/lib/color";
import { cn } from "@/lib/utils";
import type { Libro } from "@/types/libro";

/* ==================================================================
   EL MANIFIESTO DE IMÁGENES LLEGA DESPUÉS

   `scripts/6-optimizar.mjs` —el paso que recorta y comprime las
   portadas y los retratos— lo está escribiendo otro frente. Hoy, en
   `public/libros/` y `public/retratos/` no hay un solo archivo: la
   portada apunta a las rutas que ese script promete y se encuentra
   con un 404 en todas.

   Por eso cada imagen se pinta ENCIMA de un marco de color con su
   título dentro. Si el WebP no está, se ve el marco; cuando esté, lo
   tapa entero. La página no cambia de forma en ninguno de los dos
   casos porque el marco es quien pone la proporción, no la imagen.
   ================================================================== */

/**
 * Anchos de las variantes de cada imagen, en píxeles.
 *
 * Vacío A PROPÓSITO. Con la lista vacía no se emite `srcSet` y el navegador se
 * queda con la ruta canónica —`/libros/<base>.webp`, `/retratos/<base>.webp`—,
 * que es la única que el pipeline promete hoy.
 *
 * Adivinar los anchos sería PEOR que no ponerlos: cuando un candidato de
 * `srcSet` no existe, el navegador no vuelve al `src`, deja la imagen rota. Con
 * un nombre de variante inventado, la portada seguiría vacía el día que el
 * archivo bueno sí esté, y el respaldo taparía el fallo tan bien que nadie se
 * enteraría.
 *
 * Cuando `scripts/6-optimizar.mjs` publique sus anchos, se escriben aquí
 * —algo como `[240, 360, 480, 720]`— y se comprueba que `nombreVariante`
 * coincida con el nombre que escribe el script. Es el único sitio que tocar.
 */
const ANCHOS: readonly number[] = [];

/** Cómo se llama la variante de un ancho. Tiene que casar con el script. */
function nombreVariante(base: string, ancho: number) {
  return `${base}-${ancho}`;
}

interface MarcoProps {
  /** Carpeta de `public/` donde el pipeline deja el archivo. */
  carpeta: "libros" | "retratos";
  /** Nombre base del archivo, sin carpeta ni extensión. */
  base: string;
  /** Fondo del respaldo; decide también el color de su texto. */
  color: string;
  /** Proporción de la caja, en la sintaxis de `aspect-ratio`. */
  proporcion: string;
  /** Lo que se lee dentro del marco mientras el archivo no exista. */
  respaldo: ReactNode;
  sizes?: string;
  className?: string;
  /** Encima del pliegue: se pide con prioridad y sin diferir. */
  prioridad?: boolean;
  /**
   * Texto alternativo. Vacío por defecto y vacío en toda la portada: al lado de
   * cada imagen está escrito, en texto de verdad, lo que la imagen muestra —el
   * título del libro, el nombre de quien posa—, así que describirla otra vez
   * haría que un lector de pantalla dijera lo mismo dos veces seguidas.
   *
   * De paso resuelve el respaldo: con `alt=""` un navegador que no encuentra el
   * archivo no pinta nada en su lugar —ni icono roto ni texto suelto— y deja el
   * marco de color a la vista tal cual.
   */
  alt?: string;
}

/**
 * Una imagen del pipeline sobre un marco de color que la sostiene.
 *
 * El marco no es solo un respaldo: es también lo que reserva el sitio antes de
 * que la imagen llegue, así que la página no da el salto de maquetación que
 * daría una imagen sin medidas.
 */
export function Marco({
  carpeta,
  base,
  color,
  proporcion,
  respaldo,
  sizes,
  className,
  prioridad = false,
  alt = "",
}: MarcoProps) {
  const { texto } = contraste(color);
  const src = `/${carpeta}/${base}.webp`;
  const srcSet =
    ANCHOS.length > 0
      ? ANCHOS.map((ancho) => `/${carpeta}/${nombreVariante(base, ancho)}.webp ${ancho}w`).join(", ")
      : undefined;

  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{ aspectRatio: proporcion, backgroundColor: color, color: texto } as CSSProperties}
    >
      {/* `aria-hidden` porque es un duplicado visual de lo que ya está escrito
          al lado: sirve a los ojos mientras falta el archivo, a nadie más. */}
      <span
        aria-hidden
        className="absolute inset-0 flex items-end p-4 text-balance font-display text-rotulo leading-tight opacity-90 sm:p-6"
      >
        {respaldo}
      </span>

      {/* `<img>` y no `next/image` a propósito, como en el hero: las variantes
          salen ya recortadas y comprimidas del pipeline de arte, así que pasar
          por `/_next/image` volvería a optimizar lo optimizado y ataría el
          sitio a un servidor con Node cuando lo que se despliega es estático. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={prioridad ? "eager" : "lazy"}
        fetchPriority={prioridad ? "high" : undefined}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

/**
 * La portada de un libro: proporción 2:3 y la sombra proyectada que la hace
 * parecer un objeto sobre la mesa en vez de una imagen pegada.
 */
export function PortadaLibro({
  libro,
  sizes,
  className,
  prioridad,
}: {
  libro: Libro;
  sizes?: string;
  className?: string;
  prioridad?: boolean;
}) {
  return (
    <Marco
      carpeta="libros"
      base={libro.portada}
      color={libro.colorPortada}
      proporcion="2 / 3"
      respaldo={libro.titulo}
      sizes={sizes}
      prioridad={prioridad}
      className={cn("rounded-tarjeta shadow-portada", className)}
    />
  );
}

/**
 * Un retrato del pipeline. El respaldo lleva la firma en serif: si la foto
 * todavía no está, el hueco sigue siendo suyo.
 */
export function Retrato({
  base,
  color,
  proporcion = "3 / 4",
  firma,
  sizes,
  className,
  prioridad,
}: {
  base: string;
  color: string;
  proporcion?: string;
  firma: string;
  sizes?: string;
  className?: string;
  prioridad?: boolean;
}) {
  return (
    <Marco
      carpeta="retratos"
      base={base}
      color={color}
      proporcion={proporcion}
      respaldo={firma}
      sizes={sizes}
      prioridad={prioridad}
      className={cn("rounded-panel", className)}
    />
  );
}

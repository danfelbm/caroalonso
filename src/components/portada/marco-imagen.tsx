import type { CSSProperties, ReactNode } from "react";

import imagenes from "@/data/imagenes.json";
import { contraste } from "@/lib/color";
import { cn } from "@/lib/utils";
import type { Libro } from "@/types/libro";

/* ==================================================================
   EL MANIFIESTO DE IMÁGENES

   `src/data/imagenes.json` no se escribe a mano: lo genera el paso de
   optimización del pipeline de arte, que recorta cada original a sus
   anchos y lo guarda en WebP y AVIF. Por cada imagen deja el ancho y
   el alto reales, las variantes de los dos formatos, la ruta canónica
   y una miniatura difuminada en base64 de menos de medio kilobyte.

   Se importa aquí directamente, como `hero-narrativo.tsx` importa
   `hero.json`: es un artefacto de construcción y no contenido, así
   que no pasa por `lib/datos` —donde vive lo que algún día vendrá de
   Supabase— sino por el componente que lo consume.

   TODAVÍA NO ESTÁN TODAS. `retrato-reconexion`, `retrato-heroina`,
   `retrato-hero` y `retrato-firma` son escenas declaradas en
   `scripts/2-retratos.mjs` que aún no han pasado por el pipeline. Por
   eso cada imagen se pinta ENCIMA de un marco de color con su título
   dentro: si el archivo no está, se ve el marco, y la página no
   cambia de forma en ninguno de los dos casos porque quien pone la
   proporción es el marco, no la imagen.
   ================================================================== */

interface EntradaManifiesto {
  ancho: number;
  alto: number;
  /** Anchos disponibles, del ancho en píxeles a su ruta. */
  webp: Record<string, string>;
  avif: Record<string, string>;
  principal: string;
  /** Miniatura en base64, para tener algo debajo mientras la buena baja. */
  difuminada: string;
}

const MANIFIESTO = imagenes as Record<string, EntradaManifiesto>;

/** `srcSet` a partir de un mapa ancho → ruta, de menor a mayor. */
function conjuntoDeFuentes(variantes: Record<string, string>) {
  return Object.entries(variantes)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([ancho, ruta]) => `${ruta} ${ancho}w`)
    .join(", ");
}

type Ajuste = "cubrir" | "contener";

interface MarcoProps {
  /** Nombre base del archivo, sin carpeta ni extensión: la clave del manifiesto. */
  base: string;
  /** Carpeta de `public/`. Solo se usa para la ruta de reserva. */
  carpeta: "libros" | "retratos" | "texturas";
  /** Fondo del marco; decide también el color de su texto de reserva. */
  color: string;
  /** Lo que se lee dentro del marco cuando la imagen todavía no existe. */
  respaldo: ReactNode;
  /**
   * Proporción forzada, en la sintaxis de `aspect-ratio`. Sin ella manda la
   * proporción real de la imagen, que es lo correcto cuando la imagen es la
   * pieza principal del bloque.
   */
  proporcion?: string;
  /**
   * `cubrir` llena el marco recortando lo que sobre; `contener` mete la imagen
   * entera y deja ver el fondo alrededor. Con una proporción forzada casi
   * siempre se quiere `contener`: las portadas de los libros no comparten forma
   * —unas son escaneos verticales y otras fotos de producto apaisadas— y
   * recortarlas a todas a la misma caja les cortaría el título.
   */
  ajuste?: Ajuste;
  sizes?: string;
  className?: string;
  /** Encima del pliegue: se pide con prioridad y sin diferir. */
  prioridad?: boolean;
  /** Vacío cuando lo que la imagen muestra ya está escrito al lado. */
  alt?: string;
}

/**
 * Una imagen del pipeline sobre un marco que la sostiene.
 *
 * El marco reserva el sitio antes de que la imagen llegue —así la página se
 * ahorra el salto de maquetación de una imagen sin medidas— y, debajo, pinta la
 * miniatura difuminada: mientras baja la buena hay una mancha con sus colores
 * en vez de un rectángulo vacío.
 */
export function Marco({
  base,
  carpeta,
  color,
  respaldo,
  proporcion,
  ajuste = "cubrir",
  sizes,
  className,
  prioridad = false,
  alt = "",
}: MarcoProps) {
  const entrada = MANIFIESTO[base];
  const { texto } = contraste(color);

  const estilo: CSSProperties = {
    aspectRatio: proporcion ?? (entrada ? `${entrada.ancho} / ${entrada.alto}` : "2 / 3"),
    backgroundColor: color,
    color: texto,
  };

  if (entrada) {
    estilo.backgroundImage = `url("${entrada.difuminada}")`;
    estilo.backgroundSize = "cover";
    estilo.backgroundPosition = "center";
  }

  const clasesImagen = cn(
    "absolute inset-0 h-full w-full",
    ajuste === "cubrir" ? "object-cover" : "object-contain",
  );

  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={estilo}>
      {/* El respaldo solo existe mientras el pipeline no conozca esta imagen:
          en cuanto está en el manifiesto sobra, y con `contener` además se
          asomaría por los lados. Va `aria-hidden` porque es un duplicado visual
          de lo que ya está escrito al lado, no información nueva. */}
      {!entrada && (
        <span
          aria-hidden
          className="absolute inset-0 flex items-end p-4 text-balance font-display text-rotulo leading-tight opacity-90 sm:p-6"
        >
          {respaldo}
        </span>
      )}

      {/*
        `<picture>` con AVIF delante de WebP: el navegador se queda con el
        primer tipo que entienda y AVIF pesa alrededor de un tercio menos a la
        misma calidad. Va con `<img>` y no con `next/image` a propósito, como el
        hero: las variantes salen ya recortadas y comprimidas del pipeline, así
        que pasar por `/_next/image` volvería a optimizar lo optimizado y ataría
        el sitio a un servidor con Node cuando lo que se despliega es estático.

        `sizes` se repite en cada fuente y en la imagen: un `<source>` sin él
        ignora el suyo propio y elige por el ancho de la ventana.
      */}
      <picture>
        {entrada && (
          <>
            <source type="image/avif" srcSet={conjuntoDeFuentes(entrada.avif)} sizes={sizes} />
            <source type="image/webp" srcSet={conjuntoDeFuentes(entrada.webp)} sizes={sizes} />
          </>
        )}
        <img
          src={entrada?.principal ?? `/${carpeta}/${base}.webp`}
          alt={alt}
          width={entrada?.ancho}
          height={entrada?.alto}
          sizes={sizes}
          loading={prioridad ? "eager" : "lazy"}
          fetchPriority={prioridad ? "high" : undefined}
          decoding="async"
          className={clasesImagen}
        />
      </picture>
    </div>
  );
}

/**
 * La portada de un libro, con la sombra proyectada que la hace parecer un
 * objeto sobre la mesa en vez de una imagen pegada.
 *
 * Sin `proporcion` cada portada sale con su forma real. En una fila donde todas
 * tienen que medir lo mismo —el carrusel— se le pasa una y `contener`, y la
 * miniatura difuminada del fondo rellena lo que sobra: cada libro queda en su
 * propio halo de color en vez de sobre una banda gris.
 */
export function PortadaLibro({
  libro,
  proporcion,
  ajuste,
  sizes,
  className,
  prioridad,
}: {
  libro: Libro;
  proporcion?: string;
  ajuste?: Ajuste;
  sizes?: string;
  className?: string;
  prioridad?: boolean;
}) {
  return (
    <Marco
      base={libro.portada}
      carpeta="libros"
      color={libro.colorPortada}
      respaldo={libro.titulo}
      proporcion={proporcion}
      ajuste={ajuste}
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
  firma,
  alt,
  proporcion,
  sizes,
  className,
  prioridad,
}: {
  base: string;
  color: string;
  firma: string;
  alt: string;
  proporcion?: string;
  sizes?: string;
  className?: string;
  prioridad?: boolean;
}) {
  return (
    <Marco
      base={base}
      carpeta="retratos"
      color={color}
      respaldo={firma}
      alt={alt}
      proporcion={proporcion}
      sizes={sizes}
      prioridad={prioridad}
      className={cn("rounded-panel", className)}
    />
  );
}

/**
 * Una textura del pipeline a sangre detrás de una banda de color.
 *
 * Decorativa siempre: va `aria-hidden`, sin proporción propia —se estira a lo
 * que mida la sección— y con la opacidad baja para que el color de la banda
 * siga siendo el que manda.
 */
export function Textura({
  base,
  opacidad = 0.5,
  sizes = "100vw",
  className,
}: {
  base: string;
  opacidad?: number;
  sizes?: string;
  className?: string;
}) {
  const entrada = MANIFIESTO[base];
  if (!entrada) return null;

  /* Sin `aria-hidden` en el <picture>: es un elemento sin rol propio y ARIA no
     se aplica ahí. Quien la saca del árbol de accesibilidad es el `alt=""` de
     la imagen, que es lo correcto para una textura de fondo. */
  return (
    <picture>
      <source type="image/avif" srcSet={conjuntoDeFuentes(entrada.avif)} sizes={sizes} />
      <source type="image/webp" srcSet={conjuntoDeFuentes(entrada.webp)} sizes={sizes} />
      <img
        src={entrada.principal}
        alt=""
        sizes={sizes}
        loading="lazy"
        decoding="async"
        style={{ opacity: opacidad }}
        className={cn("pointer-events-none absolute inset-0 h-full w-full object-cover", className)}
      />
    </picture>
  );
}

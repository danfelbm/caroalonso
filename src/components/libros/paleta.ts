import type { CSSProperties } from "react";

import { colorTexto, contraste } from "@/lib/color";
import type { Libro } from "@/types/libro";

/**
 * Los dos colores de un libro, ya convertidos en algo que se puede pintar.
 *
 * `colorSeccion` sale de la paleta y va de fondo; `colorPortada` es el color
 * real de la portada impresa y entra como acento pequeño. Crudo, ese acento no
 * se puede leer: el amarillo de «Reinventa el amor» sobre el lavanda de su
 * sección se queda en 1.25:1, y el aguamarina de «A través de las grietas»
 * sobre su amarillo, en 1.22:1. Por eso ningún componente usa `colorPortada`
 * tal cual para texto: lo pasa por `colorTexto()`, que lo oscurece lo justo
 * para llegar a 4.5:1 sobre el fondo concreto donde va a caer.
 *
 * De ahí que haya dos juegos: uno para cuando el acento cae sobre la banda de
 * color del libro y otro para cuando cae sobre el papel. Es el mismo color,
 * calculado contra fondos distintos.
 */
export interface PaletaLibro {
  /**
   * Variables en línea para `<Seccion fondo="acento">`. Van como `style` y no
   * como clase porque el color es un dato del libro, no una decisión de
   * diseño (ver el bloque `@theme inline` de globals.css).
   */
  estilo: CSSProperties;
  /** Colores sobre la banda de `colorSeccion`. */
  banda: {
    /** Tinta principal. */
    tinta: string;
    /** Texto secundario. */
    suave: string;
    /** El acento del libro, legible como texto o como filete. */
    acento: string;
    /** Tinta legible ENCIMA de un relleno de `acento` (la etiqueta del año). */
    sobreAcento: string;
  };
  /** Los mismos, calculados contra el papel. */
  papel: {
    acento: string;
    sobreAcento: string;
  };
}

export function paletaLibro(
  libro: Pick<Libro, "colorSeccion" | "colorPortada">,
): PaletaLibro {
  const seccion = contraste(libro.colorSeccion);
  const acentoBanda = colorTexto(libro.colorPortada, libro.colorSeccion);
  const acentoPapel = colorTexto(libro.colorPortada);

  return {
    estilo: {
      "--acento": libro.colorSeccion,
      "--acento-tinta": seccion.texto,
    } as CSSProperties,
    banda: {
      tinta: seccion.texto,
      suave: seccion.suave,
      acento: acentoBanda,
      sobreAcento: contraste(acentoBanda).texto,
    },
    papel: {
      acento: acentoPapel,
      sobreAcento: contraste(acentoPapel).texto,
    },
  };
}

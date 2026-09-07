/** Los siete libros de Carolina: la entidad central del sitio. */

/**
 * Un libro puede comprarse hoy o solo consultarse.
 *
 * Los cinco títulos anteriores a 2021 se vendían por la tienda WooCommerce del
 * sitio viejo, que desaparece con la migración. Hasta que haya nuevos enlaces,
 * esos libros existen en la web pero no se pueden comprar desde ella.
 */
export type EstadoLibro = "en-libreria" | "solo-consulta";

/** Un mismo libro puede venderse en tres soportes con tiendas distintas. */
export type SoporteCompra = "digital" | "fisico" | "audio";

export interface EnlaceCompra {
  tienda: string;
  url: string;
}

export type Compra = Record<SoporteCompra, EnlaceCompra[]>;

export interface Cita {
  texto: string;
  /** De dónde sale la cita: el propio libro, una reseña, un medio. */
  fuente: string;
}

export interface Libro {
  slug: string;
  titulo: string;
  subtitulo: string | null;
  anio: number;
  /**
   * La biografía de Carolina y la tienda del sitio viejo se contradicen en el
   * año de tres libros. Aquí manda la biografía, y esta bandera permite
   * mostrarlo con reserva hasta que ella confirme (ver docs/por-confirmar.md).
   */
  anioPorConfirmar: boolean;
  editorial: string | null;
  isbn: string | null;
  genero: string;
  estado: EstadoLibro;
  /** El lanzamiento vigente, el que abre la página de libros. Solo uno. */
  destacado: boolean;
  /** Fondo de su sección, de la paleta Lookback. */
  colorSeccion: string;
  /** El color dominante de la portada real, medido sobre la imagen. */
  colorPortada: string;
  /** Nombre base del archivo de portada, sin carpeta ni extensión. */
  portada: string;
  cita: Cita | null;
  /** Una línea para los listados. */
  resumen: string;
  /** El texto largo de la ficha, ya partido en párrafos. */
  descripcion: string[];
  compra: Compra;
}

/** Vecinos en el orden del catálogo, para navegar de ficha en ficha. */
export interface LibrosAdyacentes {
  anterior: Libro | null;
  siguiente: Libro | null;
}

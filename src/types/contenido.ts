/** Todo lo que no es un libro: páginas, episodios, recomendaciones, servicios. */

export interface Enlace {
  texto: string;
  url: string;
}

/* ------------------------------- Quién soy ------------------------------- */

export interface Certificacion {
  titulo: string;
  institucion: string;
  url: string | null;
}

export interface QuienSoy {
  titulo: string;
  titular: string;
  /** La historia personal, un párrafo por elemento. */
  biografia: string[];
  trayectoria: {
    titular: string;
    parrafos: string[];
  };
  formacion: {
    titular: string;
    academica: string;
    certificaciones: Certificacion[];
  };
}

/* ------------------------------ Sé la heroína ---------------------------- */

/**
 * Un episodio del ciclo en YouTube sobre el libro.
 *
 * `orden` 0 es el de introducción y no lleva número en pantalla; de ahí que la
 * etiqueta se componga en `formato.ts` y no se guarde repetida en el JSON.
 */
export interface Episodio {
  orden: number;
  titulo: string;
  resumen: string;
  /** Identificador del vídeo en YouTube, no la URL completa. */
  video: string;
}

export type TipoPrensa = "radio" | "audio" | "podcast";

export interface AparicionPrensa {
  slug: string;
  medio: string;
  titulo: string;
  fecha: string;
  tipo: TipoPrensa;
  url: string;
}

export interface Heroina {
  titulo: string;
  entradilla: string;
  presentacion: string[];
  episodios: Episodio[];
  prensa: AparicionPrensa[];
}

/* ----------------------------- Recomendaciones --------------------------- */

export type TipoRecomendacion =
  | "novela"
  | "memorias"
  | "libro"
  | "libro-y-pelicula"
  | "audiolibro"
  | "pelicula"
  | "podcast";

export interface Recomendacion {
  slug: string;
  tipo: TipoRecomendacion;
  titulo: string;
  autor: string | null;
  fecha: string;
  texto: string;
  /**
   * Sigue apuntando a la biblioteca de WordPress: son las únicas copias que
   * existen de estas ocho imágenes (ver docs/por-confirmar.md).
   */
  imagen: string;
  /** El enlace que ella misma dejó dentro del texto, si lo había. */
  enlace: string | null;
  color: string;
}

/* --------------------------------- Podcast -------------------------------- */

export interface ProgramaPodcast {
  nombre: string;
  descripcion: string;
  plataforma: string;
  /** Identificador del programa en Spotify, para el reproductor incrustado. */
  showId: string;
  url: string;
}

export interface CanalYouTube {
  slug: string;
  nombre: string;
  descripcion: string;
  url: string | null;
  /** El canal existe pero nadie ha dado todavía su dirección. */
  porConfirmar: boolean;
}

export interface Podcast {
  entradilla: string;
  programa: ProgramaPodcast;
  canales: CanalYouTube[];
}

/* -------------------------------- Servicios ------------------------------- */

export interface Precio {
  cantidad: number;
  moneda: string;
  nota: string;
}

export interface Formulario {
  /** Identificador interno del formulario, no un texto de pantalla. */
  nombre: string;
  invitacion: string;
}

export interface Servicio {
  slug: string;
  nombre: string;
  entradilla: string;
  definicion: string;
  efectos: {
    entradilla: string;
    lista: string[];
  };
  proceso: {
    titular: string;
    pasos: string[];
  };
  precio: Precio;
  formulario: Formulario;
}

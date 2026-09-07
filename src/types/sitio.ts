/** Identidad, redes y navegación: lo que se repite en todas las páginas. */

export interface Identidad {
  nombre: string;
  /** Cómo firma sus libros, con la inicial del segundo apellido. */
  firma: string;
  oficio: string;
  lema: string;
  dominio: string;
  url: string;
  descripciones: {
    /** Para la etiqueta meta y las tarjetas al compartir. */
    breve: string;
    /** En primera persona, tal como la escribió ella. */
    larga: string;
  };
}

export type PlataformaRed = "youtube" | "instagram" | "tiktok" | "spotify";

export interface Red {
  plataforma: PlataformaRed;
  nombre: string;
  usuario: string;
  url: string;
}

export interface Contacto {
  /** Todavía sin confirmar: no hay ninguna dirección publicada en el sitio. */
  correo: string | null;
  ciudad: string;
}

export interface Destino {
  titulo: string;
  ruta: string;
}

/**
 * El boletín aún no tiene proveedor de correo detrás. El formulario se pinta
 * pero no envía a ningún sitio, y el aviso lo dice en voz alta para que nadie
 * crea que se ha suscrito.
 */
export interface Boletin {
  activo: boolean;
  titular: string;
  entradilla: string;
  etiquetaCampo: string;
  textoBoton: string;
  aviso: string;
}

export interface Sitio {
  identidad: Identidad;
  redes: Red[];
  contacto: Contacto;
  navegacion: Destino[];
  navegacionSecundaria: Destino[];
  boletin: Boletin;
}

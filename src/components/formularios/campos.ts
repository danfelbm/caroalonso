/**
 * La forma de los tres formularios del sitio, declarada como datos puros.
 *
 * POR QUÉ AQUÍ Y NO DENTRO DEL COMPONENTE.
 * Los tres formularios —boletín, contacto y reconexión— se pintan con el mismo
 * `<Formulario>`; lo único que cambia entre ellos son los campos y los textos.
 * Sacándolos a datos, añadir un campo es editar una lista y no tocar JSX, y las
 * tres páginas quedan obligadas a decir lo mismo sobre lo que hoy no funciona.
 *
 * Este archivo no lleva `"use client"` ni JSX: lo importan tanto el componente
 * de cliente como las páginas de servidor que lo montan.
 */

export type TipoCampo = "texto" | "correo" | "telefono" | "parrafo";

export interface Campo {
  /** Va al `name` y, con el prefijo de `useId()`, al `id` que ata la etiqueta. */
  nombre: string;
  /** El texto del `<label>`. Nunca se degrada a marcador de posición. */
  etiqueta: string;
  tipo: TipoCampo;
  /**
   * El valor exacto del atributo `autocomplete`. Se declara aquí, campo a
   * campo, porque deducirlo del `tipo` acierta en «email» y falla en todo lo
   * demás: dos campos de texto pueden ser un nombre y una ciudad.
   */
  autocompletado: string;
  obligatorio: boolean;
  /**
   * Un EJEMPLO del formato esperado, jamás el nombre del campo. Si algún día
   * alguien pone aquí «Tu correo», el marcador de posición se habrá convertido
   * en la etiqueta y la etiqueta habrá dejado de hacer falta: eso es lo que se
   * está evitando.
   */
  ejemplo?: string;
}

export interface Maqueta {
  /** Identificador interno del formulario, no un texto de pantalla. */
  nombre: string;
  titulo: string;
  entradilla: string;
  /**
   * La nota discreta que se lee ANTES de escribir nada.
   *
   * El daño de un formulario falso no es el clic perdido: es que alguien
   * escriba de verdad, con su historia dentro, y se quede esperando respuesta.
   * Por eso la advertencia no espera al envío.
   */
  nota: string | null;

  /** El titular que se anuncia al enviar. */
  confirmacion: string;
  textoBoton: string;
  /** Lo que se anuncia al pulsar. Ver `aviso` en `<Formulario>`. */
  aviso: string;
  campos: Campo[];
}

/* -------------------------------------------------------------------------- */

const NOMBRE: Campo = {
  nombre: "nombre",
  etiqueta: "Tu nombre",
  tipo: "texto",
  autocompletado: "name",
  obligatorio: true,
};

const CORREO: Campo = {
  nombre: "correo",
  etiqueta: "Tu correo electrónico",
  tipo: "correo",
  autocompletado: "email",
  obligatorio: true,
  ejemplo: "nombre@correo.com",
};

/* --------------------------------- Boletín -------------------------------- */

/**
 * Vive en el pie de todas las páginas. Sus textos de pantalla están además en
 * `sitio.json`, y `<FormularioBoletin>` los deja mandar sobre estos: el pie ya
 * pinta el titular por su cuenta y los dos tienen que decir lo mismo.
 */
export const FORMULARIO_BOLETIN: Maqueta = {
  nombre: "boletin",
  titulo: "Recibe el boletín",
  entradilla: "Tu nombre y tu correo. Nada más.",
  nota: null,
  textoBoton: "Quiero recibirlo",
  confirmacion: "Listo, ya estás dentro",
  aviso: "Te escribiré cuando haya algo que valga la pena contarte. Sin prisa y sin ruido.",
  campos: [NOMBRE, CORREO],
};

/* --------------------------------- Contacto ------------------------------- */

export const FORMULARIO_CONTACTO: Maqueta = {
  nombre: "contacto",
  titulo: "Escríbeme",
  entradilla:
    "Una pregunta, un libro que buscas, una idea que te dio vueltas mientras leías. Aquí llega.",
  nota: null,
  textoBoton: "Enviar el mensaje",
  confirmacion: "Gracias, tu mensaje llegó",
  aviso: "Te respondo lo antes que pueda, y siempre respondo.",
  campos: [
    NOMBRE,
    CORREO,
    {
      nombre: "mensaje",
      etiqueta: "Tu mensaje",
      tipo: "parrafo",
      // `off` a propósito: el navegador no tiene nada guardado que ofrecer para
      // un texto libre, y sugerir ahí direcciones o nombres solo estorba.
      autocompletado: "off",
      obligatorio: true,
    },
  ],
};

/* -------------------------------- Reconexión ------------------------------ */

/** El único formulario del sitio viejo que sí llegaba a alguna parte. */
export const FORMULARIO_RECONEXION: Maqueta = {
  nombre: "reconexion",
  titulo: "Pide tu Reconexión",
  entradilla:
    "Si quieres más información o programar tu reconexión, déjame tus datos y hablamos.",
  nota: null,
  textoBoton: "Quiero saber más",
  confirmacion: "Gracias, ya tengo tus datos",
  aviso: "Te escribo pronto para coordinar las dos sesiones y resolver lo que necesites.",
  campos: [
    NOMBRE,
    CORREO,
    {
      nombre: "celular",
      etiqueta: "Tu celular",
      tipo: "telefono",
      autocompletado: "tel",
      obligatorio: false,
      ejemplo: "+57 300 000 0000",
    },
    {
      nombre: "comentarios",
      etiqueta: "Comentarios",
      tipo: "parrafo",
      autocompletado: "off",
      obligatorio: false,
    },
  ],
};

/** Las tres maquetas por nombre, para quien prefiera pedirlas así. */
export const MAQUETAS = {
  boletin: FORMULARIO_BOLETIN,
  contacto: FORMULARIO_CONTACTO,
  reconexion: FORMULARIO_RECONEXION,
} as const;

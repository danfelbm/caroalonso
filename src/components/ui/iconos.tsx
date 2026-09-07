import type { ComponentProps } from "react";

export type PropsIcono = ComponentProps<"svg">;

/**
 * SVG propios en lugar de una librería de iconos: son quince, pesan menos que
 * el import y así el trazo (1.8, extremos redondos) es el mismo en todos.
 * Todos heredan `currentColor` y son `aria-hidden`: el nombre accesible lo
 * pone el enlace o el botón que los envuelve, nunca el icono.
 */
const base = {
  width: "1em",
  height: "1em",
  viewBox: "0 0 24 24",
  "aria-hidden": true,
  focusable: false,
} as const;

/** Marcas: glifo macizo, que es como se distribuyen oficialmente. */
const macizo = { ...base, fill: "currentColor" } as const;

/** Interfaz: trazo abierto, para que case con el peso del texto. */
const trazo = {
  ...base,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function IconoYoutube(props: PropsIcono) {
  return (
    <svg {...macizo} {...props}>
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
    </svg>
  );
}

export function IconoInstagram(props: PropsIcono) {
  return (
    <svg {...trazo} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconoTiktok(props: PropsIcono) {
  return (
    <svg {...macizo} {...props}>
      <path d="M16.6 0h-3.3v16.2a2.9 2.9 0 0 1-2.9 2.9 2.9 2.9 0 0 1-2.9-2.9 2.9 2.9 0 0 1 2.6-2.9v-3.4a6.3 6.3 0 0 0-5.9 6.3A6.3 6.3 0 0 0 10.4 24a6.3 6.3 0 0 0 6.3-6.3V9.4A7.7 7.7 0 0 0 21.2 11V7.6a4.6 4.6 0 0 1-4.6-4.6V0Z" />
    </svg>
  );
}

export function IconoSpotify(props: PropsIcono) {
  return (
    <svg {...macizo} {...props}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0Zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02Zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14C9.6 9.9 15 10.56 18.72 12.84c.36.18.54.78.24 1.2Zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3Z" />
    </svg>
  );
}

export function IconoFlechaDerecha(props: PropsIcono) {
  return (
    <svg {...trazo} {...props}>
      <path d="M4 12h16m-6.5-6.5L20 12l-6.5 6.5" />
    </svg>
  );
}

/** La diagonal ↗ es la convención para "esto abre fuera del sitio". */
export function IconoFlechaDiagonal(props: PropsIcono) {
  return (
    <svg {...trazo} {...props}>
      <path d="M7 17 17 7M8.5 7H17v8.5" />
    </svg>
  );
}

export function IconoChevron(props: PropsIcono) {
  return (
    <svg {...trazo} {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

export function IconoMenu(props: PropsIcono) {
  return (
    <svg {...trazo} {...props}>
      <path d="M4 8h16M4 16h16" />
    </svg>
  );
}

export function IconoCerrar(props: PropsIcono) {
  return (
    <svg {...trazo} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/* ------------------------------------------------------------------
   Los seis de la barra de pestañas.

   Dibujados a mano dentro de la misma caja de 24 y con el mismo trazo
   de 1.8 que los de arriba, porque a 21 px —que es como se ven en la
   barra— una figura importada de otra librería canta enseguida: cambia
   el grosor, cambia el radio de las esquinas y el conjunto deja de
   leerse como un juego.

   Todos ocupan de 3,3 a 20,7 y están centrados en 12: apilados en la
   fila de la barra, los seis pesan lo mismo y ninguno baila.
   ------------------------------------------------------------------ */

/** Inicio. */
export function IconoInicio(props: PropsIcono) {
  return (
    <svg {...trazo} {...props}>
      <path d="M3.8 10.4 12 3.9l8.2 6.5v8.4a1.7 1.7 0 0 1-1.7 1.7h-13a1.7 1.7 0 0 1-1.7-1.7Z" />
      <path d="M9.4 20.5v-6.2h5.2v6.2" />
    </svg>
  );
}

/** Quién soy. */
export function IconoPersona(props: PropsIcono) {
  return (
    <svg {...trazo} {...props}>
      <circle cx="12" cy="8.1" r="3.7" />
      <path d="M4.6 20.4a7.4 7.4 0 0 1 14.8 0" />
    </svg>
  );
}

/** Libros. El lomo del centro es lo que lo distingue de una hoja suelta. */
export function IconoLibro(props: PropsIcono) {
  return (
    <svg {...trazo} {...props}>
      <path d="M12 6.9C10.8 5.4 9.1 4.6 6.7 4.6H3.6v12.6h3.1c2.4 0 4.1.8 5.3 2.2 1.2-1.4 2.9-2.2 5.3-2.2h3.1V4.6h-3.1c-2.4 0-4.1.8-5.3 2.3Z" />
      <path d="M12 6.9v12.5" />
    </svg>
  );
}

/**
 * Reconexión. Corazón y no mano abierta: a 21 px los cuatro dedos de
 * una mano se juntan en una mancha, y el corazón se reconoce entero
 * incluso a la mitad de ese tamaño.
 */
export function IconoCorazon(props: PropsIcono) {
  return (
    <svg {...trazo} {...props}>
      <path d="M12 20.3 4.9 13.2a4.7 4.7 0 1 1 6.6-6.6l.5.5.5-.5a4.7 4.7 0 1 1 6.6 6.6Z" />
    </svg>
  );
}

/** Sé la heroína. */
export function IconoEstrella(props: PropsIcono) {
  return (
    <svg {...trazo} {...props}>
      <path d="m12 3.5 2.7 5.5 6 .9-4.35 4.24 1.03 5.99L12 17.3l-5.38 2.83 1.03-5.99L3.3 9.9l6-.9Z" />
    </svg>
  );
}

/** Más: lo que no cupo en las cinco pestañas. */
export function IconoCuadricula(props: PropsIcono) {
  return (
    <svg {...trazo} {...props}>
      <rect x="3.8" y="3.8" width="7" height="7" rx="1.8" />
      <rect x="13.2" y="3.8" width="7" height="7" rx="1.8" />
      <rect x="3.8" y="13.2" width="7" height="7" rx="1.8" />
      <rect x="13.2" y="13.2" width="7" height="7" rx="1.8" />
    </svg>
  );
}

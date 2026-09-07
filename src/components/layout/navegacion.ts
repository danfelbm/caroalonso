import type { ComponentType } from "react";

import {
  IconoCorazon,
  IconoEstrella,
  IconoInicio,
  IconoInstagram,
  IconoLibro,
  IconoPersona,
  IconoSpotify,
  IconoTiktok,
  IconoYoutube,
  type PropsIcono,
} from "@/components/ui/iconos";
import type { Destino, PlataformaRed, Red } from "@/types/sitio";

/**
 * Datos y reglas de la navegación. Sin JSX y sin `server-only`.
 *
 * POR QUÉ AQUÍ NO SE LLAMA A `getSitio()`.
 * La navegación vive en `src/data/sitio.json` y se lee con `getSitio()`, pero
 * ese módulo lleva `import "server-only"`: importarlo desde aquí envenenaría
 * este archivo, y la barra y la hoja del menú —que son componentes de cliente—
 * ya no podrían usar `esActiva`. Así que el layout, que sí es de servidor, lee
 * `getSitio()` una vez y baja el menú como props. Los datos no se duplican en
 * ningún sitio; lo único que vive aquí son las reglas.
 */

/** Lo que la cáscara necesita saber del sitio para pintarse. */
export interface Menu {
  /** Los cinco destinos de la barra. */
  principal: Destino[];
  /** Recomendaciones, podcast y contacto: van en la hoja y en el pie. */
  secundaria: Destino[];
  redes: Red[];
}

/**
 * El destino que la barra saca del menú y convierte en botón menta.
 *
 * Sigue apareciendo también entre los cinco: son dos gestos distintos hacia el
 * mismo sitio —uno es orientación, el otro es invitación— y esconderlo del menú
 * dejaría a quien navega con el teclado sin «Libros» donde lo espera.
 */
export const RUTA_DESTACADA = "/libros";

/** El texto del botón. Distinto de «Libros» para que no se lean como un eco. */
export const TEXTO_DESTACADO = "Ver los libros";

/**
 * Si un destino es el que se está mirando.
 *
 * La raíz se compara exacta: `"/algo".startsWith("/")` es cierto para todas las
 * rutas del sitio, así que la regla general marcaría «Inicio» como activo en
 * todas las páginas. El resto sí acepta descendientes, para que `/libros/slug`
 * mantenga «Libros» encendido mientras se lee una ficha.
 */
export function esActiva(ruta: string, pathname: string): boolean {
  if (ruta === "/") return pathname === "/";
  return pathname === ruta || pathname.startsWith(`${ruta}/`);
}

/**
 * Qué glifo le toca a cada red.
 *
 * Es una tabla de referencias a componentes, no JSX: por eso puede vivir en un
 * `.ts` y la comparten la hoja del menú (cliente) y el pie (servidor) sin que
 * ninguno de los dos arrastre al otro dentro de su paquete.
 */
export const ICONOS_RED: Record<PlataformaRed, ComponentType<PropsIcono>> = {
  youtube: IconoYoutube,
  instagram: IconoInstagram,
  tiktok: IconoTiktok,
  spotify: IconoSpotify,
};

/* ==================================================================
   LAS PESTAÑAS DE LA BARRA INFERIOR
   ================================================================== */

/** Un destino del menú, ya vestido para la barra de pestañas. */
export interface Pestana extends Destino {
  /** Cabe en un sexto de pantalla; `titulo` no siempre. */
  corta: string;
  icono: ComponentType<PropsIcono>;
}

/**
 * Icono y etiqueta corta por ruta.
 *
 * ADORNO, NO FUENTE. Los destinos y su orden siguen saliendo de
 * `getSitio()`; esta tabla solo dice con qué dibujo y con qué palabra corta
 * se pinta cada uno en la barra. Si mañana el sitio renombra «Reconexión»,
 * el nombre largo cambia solo en la barra superior, en la hoja y en el pie, y
 * aquí no hay que tocar nada.
 *
 * Las cortas están medidas contra un sexto de 390 px (65 px) a 11 px de Inter:
 * «Reconexión», que es la más larga, ocupa 57 px y entra en un solo renglón.
 */
const VESTUARIO: Record<string, Pick<Pestana, "corta" | "icono">> = {
  "/": { corta: "Inicio", icono: IconoInicio },
  "/quien-soy": { corta: "Quién soy", icono: IconoPersona },
  "/se-la-heroina": { corta: "Heroína", icono: IconoEstrella },
  "/libros": { corta: "Libros", icono: IconoLibro },
  "/reconexion": { corta: "Reconexión", icono: IconoCorazon },
};

/**
 * Los destinos del sitio convertidos en pestañas.
 *
 * Un destino sin entrada en `VESTUARIO` se cae de la barra en vez de salir sin
 * icono: seis huecos iguales con uno vacío se ve peor que cinco llenos, y el
 * destino sigue estando en la hoja que abre «Más».
 */
export function pestanas(principal: Destino[]): Pestana[] {
  return principal.flatMap((destino) => {
    const vestido = VESTUARIO[destino.ruta];
    return vestido ? [{ ...destino, ...vestido }] : [];
  });
}

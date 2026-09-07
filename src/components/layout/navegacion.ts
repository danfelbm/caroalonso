import type { ComponentType } from "react";

import {
  IconoInstagram,
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

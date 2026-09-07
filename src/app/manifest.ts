import type { MetadataRoute } from "next";

import { getSitio } from "@/lib/datos";

/**
 * EL MANIFIESTO
 *
 * No es una aplicación y no pretende serlo: esto es lo que Android e iOS leen
 * cuando alguien guarda el sitio en su pantalla de inicio. Sin manifiesto, el
 * atajo se queda con el título completo de la pestaña recortado a la mitad y
 * con una captura de la página por icono.
 *
 * `background_color` es el papel del sitio y `theme_color` también: la pantalla
 * de arranque tiene que ser del color del sitio, no blanca. El marino se queda
 * para la tinta —es el color de los iconos, no de las superficies grandes—;
 * pintar de marino la barra del navegador contradiría el `themeColor` que
 * `layout.tsx` ya declara en el viewport, y ganaría uno de los dos a suertes.
 *
 * `display: "standalone"` porque la navegación del sitio se basta sola: la
 * barra en píldora está fija arriba en todas las páginas y no hace falta la
 * del navegador. Sin barra de direcciones tampoco hay botón de recargar, así
 * que `start_url` apunta a la portada y no a la última página vista.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { identidad } = await getSitio();

  return {
    name: `${identidad.firma} · ${identidad.oficio}`,
    // Debajo del icono en una pantalla de inicio caben unos doce caracteres:
    // «Carolina Alonso C.» se cortaría en «Carolina Alo…».
    short_name: identidad.nombre.split(" ")[0],
    description: identidad.descripciones.breve,
    lang: "es-CO",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBF8F6",
    theme_color: "#FBF8F6",
    categories: ["books", "education", "lifestyle"],
    /*
     * Los mismos archivos que sirve `icon.png` y `apple-icon.png` desde esta
     * carpeta, declarados a mano porque el manifiesto no los hereda. `maskable`
     * en el de 512: Android recorta el icono a la forma que use el lanzador
     * —círculo, cuadrado con esquinas, gota— y solo respeta el margen de
     * seguridad si se lo dicen. La firma va centrada con aire de sobra para
     * sobrevivir a ese recorte.
     */
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}

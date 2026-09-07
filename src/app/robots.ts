import type { MetadataRoute } from "next";

import { absoluta } from "@/lib/seo";

/**
 * ROBOTS
 *
 * Todo abierto menos `/muestrario`, que es el banco de pruebas de los
 * componentes: existe para mirar botones y tipografías durante la construcción
 * y desaparecerá. Indexada competiría en los resultados con las páginas de
 * verdad, y con un contenido que no le dice nada a nadie.
 *
 * `Disallow` pide que NO SE RASTREE, que no es lo mismo que no indexar: una
 * página bloqueada aquí puede seguir saliendo en los resultados si alguien la
 * enlaza desde fuera, porque el rastreador ve el enlace pero no puede entrar a
 * leer un `noindex`. Para el muestrario basta: nadie lo enlaza y no está en el
 * mapa del sitio. El 404, en cambio, sí lleva `robots: { index: false }` en su
 * propia página, que es la marca que de verdad lo saca del índice.
 *
 * El mapa se declara en absoluto a propósito: `sitemap` es el único campo del
 * archivo que exige una URL completa; con una ruta relativa, los rastreadores
 * lo ignoran en silencio.
 *
 * Sin `Host`: era una extensión de Yandex que ellos mismos retiraron en 2018 y
 * que nadie más leyó nunca. Quién es el dominio bueno ya lo dice el `canonical`
 * de cada página, que sí lo respetan todos.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/muestrario",
    },
    sitemap: absoluta("/sitemap.xml"),
  };
}

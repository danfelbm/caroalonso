import type { MetadataRoute } from "next";

import { getLibros } from "@/lib/datos";
import { absoluta } from "@/lib/seo";

/**
 * EL MAPA DEL SITIO
 *
 * Once rutas públicas más las siete fichas de libro. `/muestrario` NO entra:
 * es la página de pruebas de los componentes y solo existe mientras se
 * construye el sitio. Anunciarla en el mapa sería pedir explícitamente que la
 * indexen — es justo lo contrario de lo que hace `robots.ts` con ella.
 *
 * Los libros se leen de `getLibros()` y no se escriben a mano: el día que
 * llegue un octavo título, aparece aquí solo. Es la misma razón por la que la
 * página de libros pinta su lista desde el catálogo.
 *
 * `lastModified` es la fecha de construcción y no una fecha por ruta. Podría
 * parecer perezoso, pero el contenido vive en JSON dentro del repositorio: no
 * hay fecha de modificación por página que consultar, y una fecha inventada por
 * ruta es peor que una honesta para todas. El día que llegue Supabase, cada
 * entidad traerá la suya.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const libros = await getLibros();
  const construido = new Date();

  /**
   * La prioridad es relativa DENTRO del sitio, no una nota entre 0 y 1 que
   * compita con nadie más: dice a qué le importa más al sitio que se rastree.
   * La portada manda; después, las dos páginas que la gente busca por su
   * nombre —los libros y quién es ella—; el resto acompaña.
   */
  const paginas: MetadataRoute.Sitemap = [
    { url: absoluta("/"), changeFrequency: "monthly", priority: 1 },
    { url: absoluta("/quien-soy"), changeFrequency: "yearly", priority: 0.9 },
    { url: absoluta("/libros"), changeFrequency: "monthly", priority: 0.9 },
    // Tiene libro propio, nueve episodios y prensa: es una sección, no una ficha.
    { url: absoluta("/se-la-heroina"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluta("/reconexion"), changeFrequency: "yearly", priority: 0.7 },
    { url: absoluta("/podcast"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluta("/recomendaciones"), changeFrequency: "yearly", priority: 0.5 },
    { url: absoluta("/contacto"), changeFrequency: "yearly", priority: 0.5 },
  ];

  /*
   * El libro vigente por delante de los descatalogados: es el único que se
   * puede comprar en librería hoy y el que más se va a buscar por su título.
   * `getLibros()` ya los devuelve del más reciente al más antiguo.
   */
  const fichas: MetadataRoute.Sitemap = libros.map((libro) => ({
    url: absoluta(`/libros/${libro.slug}`),
    changeFrequency: "yearly",
    priority: libro.destacado ? 0.8 : 0.6,
  }));

  return [...paginas, ...fichas].map((entrada) => ({ ...entrada, lastModified: construido }));
}

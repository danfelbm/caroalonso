import "server-only";

import type { Metadata } from "next";

import { getSitio } from "@/lib/datos";
import type { Libro } from "@/types/libro";

/**
 * LA CAPA TÉCNICA DE SEO
 *
 * Dos cosas viven aquí y no en las páginas:
 *
 *   1. `construirMetadata()`, para que las etiquetas de compartir se escriban
 *      una sola vez. Las páginas de hoy declaran su `openGraph` a mano —está
 *      bien y funciona—, pero cada una repite `locale`, el tamaño de la imagen
 *      y la tarjeta de Twitter. Cualquiera puede adoptar esta función sin
 *      cambiar una coma de su HTML: devuelve exactamente lo mismo.
 *
 *   2. Los nodos de datos estructurados. Google no lee la maquetación: lee
 *      JSON-LD. Es lo que decide si la ficha de un libro sale en el buscador
 *      como un libro —con autora, ISBN y año— o como una página cualquiera.
 *
 * Lleva `server-only` porque `personaCarolina()` y `sitioWeb()` leen del
 * catálogo, que también lo lleva. Ningún componente de cliente lo importa.
 */

/**
 * El dominio público, con la misma reserva que `layout.tsx`.
 *
 * Se repite el valor a propósito en vez de importarlo del layout: un `import`
 * desde `app/layout.tsx` arrastraría las fuentes y el árbol entero de
 * componentes a cualquier script que solo quiera una URL.
 */
export const URL_SITIO = process.env.NEXT_PUBLIC_SITIO_URL ?? "https://www.caroalonso.com";

/** Ruta absoluta desde una relativa; las dos formas se usan en el sitio. */
export function absoluta(ruta: string) {
  return new URL(ruta, URL_SITIO).toString();
}

interface OpcionesMetadata {
  /** Sin la firma: la plantilla de `layout.tsx` la añade sola. */
  titulo: string;
  descripcion: string;
  /** Ruta relativa con barra inicial: `/libros`, `/quien-soy`. */
  ruta: string;
  /** La tarjeta de compartir, también relativa: `/og/libros.jpg`. */
  og: string;
  /**
   * `website` para casi todo. `profile` en «Quién soy» y `book` en las fichas:
   * son los dos únicos sitios donde el tipo cambia lo que enseña la tarjeta.
   */
  tipo?: "website" | "profile" | "book" | "article";
  /** Solo el 404 y el muestrario. Excluye la página del índice, no de la rastreada. */
  noindex?: boolean;
  /** Texto alternativo de la imagen; por defecto, el propio título. */
  altOg?: string;
}

/**
 * El objeto `Metadata` completo de una página.
 *
 * `alternates.canonical` no es opcional: sin él, una misma página servida con
 * `?utm_source=…` o con y sin `www` se cuenta como varias direcciones distintas
 * y el buscador reparte entre ellas la autoridad que debería ir a una sola.
 */
export async function construirMetadata({
  titulo,
  descripcion,
  ruta,
  og,
  tipo = "website",
  noindex = false,
  altOg,
}: OpcionesMetadata): Promise<Metadata> {
  const { identidad } = await getSitio();

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: ruta },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: tipo,
      // Colombiano y no `es` a secas: es lo que decide comillas, fechas y voz.
      locale: "es_CO",
      url: ruta,
      siteName: identidad.firma,
      title: titulo,
      description: descripcion,
      images: [{ url: og, width: 1200, height: 630, alt: altOg ?? titulo }],
    },
    /*
     * El bloque `twitter` se declara entero aunque repita el texto. Si una
     * página no pone el suyo, hereda el del layout —donde el título es el del
     * sitio— y compartirla enseñaría el rótulo genérico en vez del propio.
     */
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
      images: [og],
    },
  };
}

/* ------------------------------------------------------------------
   DATOS ESTRUCTURADOS

   Cada función devuelve un nodo JSON-LD suelto, sin `<script>` ni
   serializar: eso lo hace `<DatosEstructurados>`, que es el único sitio
   donde se escapa el `<`. Aquí solo se construyen objetos.
   ------------------------------------------------------------------ */

/** Un nodo de schema.org: un objeto plano con `@type`. */
export type NodoJsonLd = Record<string, unknown>;

/**
 * `Person`: quién es Carolina para el buscador.
 *
 * `sameAs` es la parte que trabaja de verdad. Es la lista de perfiles que un
 * buscador puede reconciliar con esta página: sin ella, el YouTube, el
 * Instagram y este sitio son tres entidades sin relación entre sí, y ninguna
 * hereda la autoridad de las otras.
 *
 * `@id` fija la identidad en una sola dirección para todo el sitio, así que los
 * `Person` de la portada y de «Quién soy» son la misma persona y no dos.
 */
export async function personaCarolina(): Promise<NodoJsonLd> {
  const { identidad, redes, contacto } = await getSitio();
  const [ciudad, pais] = contacto.ciudad.split(",").map((parte) => parte.trim());

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${URL_SITIO}/#persona`,
    name: identidad.firma,
    alternateName: identidad.nombre,
    url: URL_SITIO,
    description: identidad.descripciones.larga,
    // Los tres oficios sueltos: `jobTitle` admite una lista y la del JSON viene
    // en una sola frase separada por comas y una «y».
    jobTitle: identidad.oficio
      .split(/,|\sy\s/)
      .map((oficio) => oficio.trim())
      .filter(Boolean),
    knowsLanguage: "es-CO",
    homeLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: ciudad,
        addressCountry: pais ?? "Colombia",
      },
    },
    sameAs: redes.map((red) => red.url),
    image: absoluta("/retratos/retrato-quien-soy.webp"),
  };
}

/**
 * `Book`: una ficha de libro.
 *
 * `workExample` es el motivo de que esto no sea un `Book` a secas. En
 * schema.org, el libro es la obra y cada edición —papel, digital, audiolibro—
 * es un `Book` distinto colgado de ella con su propio `bookFormat`. Un solo
 * nodo con el ISBN del papel deja fuera el audiolibro de «Sé la heroína», que
 * existe y se vende.
 *
 * Los libros sin editorial ni ISBN —los cinco anteriores a 2021— salen sin esos
 * campos, no con cadenas vacías: un ISBN inventado es peor que ninguno.
 */
export async function libroJsonLd(libro: Libro): Promise<NodoJsonLd> {
  const { identidad } = await getSitio();
  const url = absoluta(`/libros/${libro.slug}`);
  const autora = { "@id": `${URL_SITIO}/#persona` };

  /**
   * Las ediciones que sí tienen dónde comprarse. `datePublished` NO se copia a
   * las ediciones: el año del JSON es el de la obra, y el audiolibro de «Sé la
   * heroína» salió después que el papel.
   */
  const ediciones = (
    [
      { clave: "fisico", formato: "https://schema.org/Hardcover" },
      { clave: "digital", formato: "https://schema.org/EBook" },
      { clave: "audio", formato: "https://schema.org/AudiobookFormat" },
    ] as const
  )
    .filter(({ clave }) => libro.compra[clave].length > 0)
    .map(({ clave, formato }) => ({
      "@type": "Book",
      "@id": `${url}#${clave}`,
      bookFormat: formato,
      // Cada tienda es una oferta: es lo que permite que el buscador diga
      // «disponible en» sin que nadie escriba precios que aquí no existen.
      offers: libro.compra[clave].map((enlace) => ({
        "@type": "Offer",
        url: enlace.url,
        seller: { "@type": "Organization", name: enlace.tienda },
        availability: "https://schema.org/InStock",
      })),
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": url,
    url,
    name: libro.titulo,
    ...(libro.subtitulo ? { alternativeHeadline: libro.subtitulo } : {}),
    description: libro.resumen,
    abstract: libro.descripcion.join(" "),
    inLanguage: "es",
    genre: libro.genero,
    author: autora,
    // El año llega a secas del catálogo y `datePublished` admite solo el año.
    datePublished: String(libro.anio),
    ...(libro.isbn ? { isbn: libro.isbn } : {}),
    ...(libro.editorial ? { publisher: { "@type": "Organization", name: libro.editorial } } : {}),
    image: absoluta(`/libros/${libro.portada}.webp`),
    ...(ediciones.length ? { workExample: ediciones } : {}),
    // Sirve de firma en los resultados enriquecidos cuando no hay reseñas.
    copyrightHolder: { "@type": "Person", name: identidad.firma },
  };
}

export interface MigaDePan {
  nombre: string;
  /** Ruta relativa; se absolutiza aquí. La última miga puede ir sin ruta. */
  ruta?: string;
}

/**
 * `BreadcrumbList`: el camino hasta esta página.
 *
 * Es lo que cambia la segunda línea del resultado de búsqueda: en vez de la URL
 * cruda `caroalonso.com › libros › sal-del-laberinto…`, el buscador enseña
 * «Inicio › Libros › Sal del laberinto de soledad». La `position` empieza en 1,
 * no en 0 — con 0 el nodo se descarta entero sin avisar.
 */
export function migasDePan(items: MigaDePan[]): NodoJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, indice) => ({
      "@type": "ListItem",
      position: indice + 1,
      name: item.nombre,
      ...(item.ruta ? { item: absoluta(item.ruta) } : {}),
    })),
  };
}

/**
 * `WebSite`: el sitio como entidad, no como página.
 *
 * Va solo en la portada. Es lo que permite que el buscador muestre el nombre
 * «Carolina Alonso C.» en lugar del dominio pelado, y quien sostiene el
 * `publisher` de cualquier otro nodo que quiera apuntar al sitio.
 *
 * Sin `SearchAction` a propósito: el sitio no tiene buscador, y declarar uno
 * que no existe manda a los rastreadores a una ruta que devuelve 404.
 */
export async function sitioWeb(): Promise<NodoJsonLd> {
  const { identidad } = await getSitio();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${URL_SITIO}/#sitio`,
    url: URL_SITIO,
    name: identidad.firma,
    alternateName: identidad.dominio,
    description: identidad.descripciones.breve,
    inLanguage: "es-CO",
    publisher: { "@id": `${URL_SITIO}/#persona` },
    copyrightHolder: { "@id": `${URL_SITIO}/#persona` },
  };
}

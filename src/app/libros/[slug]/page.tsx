import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Boton } from "@/components/layout/boton";
import { Seccion } from "@/components/layout/seccion";
import { BloqueCompra } from "@/components/libros/bloque-compra";
import { CitaLibro } from "@/components/libros/cita-libro";
import { NavegacionLibros } from "@/components/libros/navegacion-libros";
import { paletaLibro } from "@/components/libros/paleta";
import { PortadaLibro } from "@/components/libros/portada-libro";
import { DatosEstructurados } from "@/components/ui/datos-estructurados";
import { IconoFlechaDerecha } from "@/components/ui/iconos";
import { Prosa } from "@/components/ui/prosa";
import { Subrayado } from "@/components/ui/subrayado";
import { getLibro, getLibros, getLibrosAdyacentes, getSitio, urlLibro } from "@/lib/datos";
import { libroJsonLd, migasDePan } from "@/lib/seo";

interface PropsFicha {
  params: Promise<{ slug: string }>;
}

/**
 * Las siete fichas se construyen al desplegar y no hay una octava: cualquier
 * otro slug es un 404 de verdad, no una página vacía generada al vuelo.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  const libros = await getLibros();
  return libros.map((libro) => ({ slug: libro.slug }));
}

export async function generateMetadata({ params }: PropsFicha): Promise<Metadata> {
  const { slug } = await params;
  const libro = await getLibro(slug);
  if (!libro) return {};

  const { identidad } = await getSitio();
  const completo = libro.subtitulo ? `${libro.titulo}. ${libro.subtitulo}` : libro.titulo;

  return {
    // La plantilla de layout.tsx le añade la firma; aquí solo va el título.
    title: libro.titulo,
    description: libro.resumen,
    alternates: { canonical: urlLibro(libro.slug) },
    openGraph: {
      type: "book",
      title: completo,
      description: libro.resumen,
      url: urlLibro(libro.slug),
      authors: identidad.firma,
      isbn: libro.isbn ?? undefined,
      tags: libro.genero,
      /*
       * La tarjeta la captura `npm run og` en otro frente. Se anuncia desde ya
       * porque la ruta es predecible y porque el día que aparezca el archivo no
       * hay que volver a tocar esta página.
       */
      images: [
        {
          url: `/og/libros/${libro.slug}.jpg`,
          width: 1200,
          height: 630,
          alt: `${completo}, de ${identidad.firma}`,
        },
      ],
    },
    /*
     * La tarjeta de Twitter/X se declara aquí aunque repita el texto. Sin este
     * bloque, `twitter:title` y `twitter:description` se heredan enteros del
     * layout y las siete fichas se comparten con el mismo rótulo genérico del
     * sitio; solo la imagen se hereda del openGraph de arriba.
     */
    twitter: {
      card: "summary_large_image",
      title: completo,
      description: libro.resumen,
    },
  };
}

/**
 * La ficha de un libro.
 *
 * El sistema de color es el mismo en las siete: `colorSeccion` es la banda de
 * la cabecera y `colorPortada` entra en pequeño —la etiqueta del año, el trazo
 * bajo el titular, el filete de la cita—, siempre pasado por `paletaLibro()`,
 * que lo oscurece hasta que se pueda leer sobre el fondo que le toque.
 */
export default async function FichaLibro({ params }: PropsFicha) {
  const { slug } = await params;
  const libro = await getLibro(slug);
  if (!libro) notFound();

  const paleta = paletaLibro(libro);
  const { anterior, siguiente } = await getLibrosAdyacentes(slug);

  const catalogo = [
    libro.genero,
    libro.editorial,
    libro.isbn && `ISBN ${libro.isbn}`,
  ].filter(Boolean);

  /*
   * El trazo manuscrito va bajo la última palabra del título, y las siete caen
   * bien: soledad, historia, amor, grietas, medida, posibles, naufragios. Sin
   * itálica, a diferencia del resto del sitio: el título del libro es un dato
   * y no se le cambia la letra a mitad.
   */
  const palabras = libro.titulo.split(" ");
  const ultima = palabras[palabras.length - 1];
  const antes = palabras.slice(0, -1).join(" ");

  /*
   * `Book` con sus ediciones y las migas de pan. Las migas son lo que cambia la
   * segunda línea del resultado de búsqueda: en vez de la dirección cruda, el
   * buscador escribe «Inicio › Libros › <título>». La última miga va sin ruta a
   * propósito — es la página en la que ya estamos.
   */
  const libroLd = await libroJsonLd(libro);
  const migas = migasDePan([
    { nombre: "Inicio", ruta: "/" },
    { nombre: "Libros", ruta: "/libros" },
    { nombre: libro.titulo },
  ]);

  return (
    <>
      <DatosEstructurados nodos={[libroLd, migas]} />

      <Seccion fondo="acento" tamano="lg" conGrano style={paleta.estilo}>
        <Link
          href="/libros"
          className="tactil group inline-flex items-center gap-2 text-nota opacity-60 hover:opacity-100"
        >
          <IconoFlechaDerecha className="rotate-180 text-[1.125rem] transition-transform duration-300 ease-suave group-hover:-translate-x-1" />
          Todos los libros
        </Link>

        <div className="mt-10 grid gap-10 sm:gap-12 lg:mt-14 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-center lg:gap-20">
          <PortadaLibro
            libro={libro}
            prioridad
            sizes="(min-width: 64rem) 22rem, (min-width: 40rem) 20rem, 72vw"
            className="max-h-[20rem] sm:max-h-[26rem]"
          />

          <div>
            <p
              className="cifras inline-flex items-center rounded-pildora px-3.5 py-1.5 text-nota font-semibold"
              style={{ backgroundColor: paleta.banda.acento, color: paleta.banda.sobreAcento }}
            >
              {libro.anio}
            </p>

            <h1 className="mt-6 text-titular">
              {antes && `${antes} `}
              <Subrayado variante="onda" color={paleta.banda.acento}>
                {ultima}
              </Subrayado>
            </h1>

            {libro.subtitulo && (
              <p className="mt-6 font-display text-rotulo" style={{ color: paleta.banda.suave }}>
                {libro.subtitulo}
              </p>
            )}

            {catalogo.length > 0 && (
              <p className="mt-7 text-nota" style={{ color: paleta.banda.suave }}>
                {catalogo.join(" · ")}
              </p>
            )}

            <Boton href="#comprar" className="mt-10">
              {libro.estado === "en-libreria" ? "Dónde comprarlo" : "Cómo conseguirlo"}
            </Boton>
          </div>
        </div>
      </Seccion>

      <Seccion fondo="papel" tamano="lg">
        {/* La cita abre el bloque de lectura en vez de tener sección propia:
            entre dos bandas de papel seguidas quedaba un hueco de nada. */}
        <CitaLibro
          libro={libro}
          color={paleta.papel.acento}
          tamano="lg"
          className="mb-16 max-w-[44rem] sm:mb-20"
        />

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-20">
          <Prosa>
            {libro.descripcion.map((parrafo, indice) => (
              <p key={indice}>{parrafo}</p>
            ))}
          </Prosa>

          {/* Se queda a la vista mientras se lee la sinopsis; en móvil, debajo. */}
          <BloqueCompra
            libro={libro}
            color={paleta.papel.acento}
            className="lg:sticky lg:top-28 lg:self-start"
          />
        </div>
      </Seccion>

      <Seccion fondo="papel" tamano="md" className="border-t border-marino/10">
        <NavegacionLibros anterior={anterior} siguiente={siguiente} />
      </Seccion>
    </>
  );
}

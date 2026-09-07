import type { Metadata } from "next";
import Link from "next/link";

import { Boton } from "@/components/layout/boton";
import { Seccion, Titulo } from "@/components/layout/seccion";
import { DestacadoLibro } from "@/components/libros/destacado-libro";
import { FilaLibro } from "@/components/libros/fila-libro";
import { Subrayado } from "@/components/ui/subrayado";
import { getLibroDestacado, getLibros, urlLibro } from "@/lib/datos";

const DESCRIPCION =
  "Los siete libros de Carolina Alonso C., de los relatos de 2004 al ensayo sobre la soledad que publicó Planeta en 2024.";

export const metadata: Metadata = {
  title: "Libros",
  description: DESCRIPCION,
  alternates: { canonical: "/libros" },
  openGraph: {
    title: "Libros",
    description: DESCRIPCION,
    url: "/libros",
    // La genera `npm run og` por captura; hasta entonces la ruta apunta a un
    // archivo que todavía no existe, que es mejor que no anunciar ninguna.
    images: [{ url: "/og/libros.jpg", width: 1200, height: 630, alt: "Los libros de Carolina Alonso C." }],
  },
  // Sin esto, la tarjeta de Twitter/X hereda el título del layout y esta página
  // se comparte con el rótulo genérico del sitio.
  twitter: { card: "summary_large_image", title: "Libros", description: DESCRIPCION },
};

/**
 * El índice de libros.
 *
 * No es un catálogo, es una trayectoria: por eso los años están arriba en fila
 * —veinte de punta a punta— y por eso cada ficha lleva el suyo en grande. El
 * orden lo pone `getLibros()`, del más reciente al más antiguo.
 */
export default async function Libros() {
  const libros = await getLibros();
  const destacado = await getLibroDestacado();
  const otros = libros.filter((libro) => libro.slug !== destacado?.slug);
  const haySinLibreria = libros.some((libro) => libro.estado === "solo-consulta");

  return (
    <>
      <Seccion fondo="papel" tamano="lg" conGrano>
        <div className="max-w-[46rem]">
          <p className="eyebrow opacity-55">Obra publicada</p>
          <h1 className="mt-6 text-titular">
            Siete libros, veinte años de{" "}
            <Subrayado variante="onda">
              <em>escritura</em>
            </Subrayado>
          </h1>
          <p className="mt-8 max-w-[48ch] text-entradilla opacity-70">
            Del primer libro de relatos, en 2004, al ensayo sobre la soledad que publicó
            Planeta en 2024. Están ordenados del más reciente al más antiguo.
          </p>
        </div>

        {/* Los siete años seguidos: es el dato que cuenta la trayectoria de un
            vistazo, y de paso un atajo a cualquier ficha. */}
        <ul className="mt-12 flex flex-wrap items-baseline gap-x-7 gap-y-3 border-t border-marino/12 pt-8 sm:mt-16 sm:gap-x-10">
          {libros.map((libro) => (
            <li key={libro.slug}>
              <Link
                href={urlLibro(libro.slug)}
                className="tactil cifras font-display text-rotulo text-marino-tenue hover:text-azul"
              >
                {libro.anio}
                <span className="sr-only"> · {libro.titulo}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Seccion>

      {destacado && <DestacadoLibro libro={destacado} />}

      <Seccion fondo="papel" tamano="lg">
        <Titulo
          eyebrow="Trayectoria"
          titulo={
            <>
              De 2021 hacia <em>atrás</em>
            </>
          }
          entradilla="Relatos, una novela, un cuento ilustrado y los libros de acompañamiento que vinieron después."
        />

        <ol>
          {otros.map((libro, indice) => (
            <li
              key={libro.slug}
              className="border-t border-marino/10 py-16 first:border-t-0 first:pt-0 last:pb-0 sm:py-20"
            >
              {/* Alternar el lado es lo que impide que seis filas iguales se
                  lean como una tabla. */}
              <FilaLibro libro={libro} invertida={indice % 2 === 1} />
            </li>
          ))}
        </ol>
      </Seccion>

      {haySinLibreria && (
        <Seccion fondo="menta-niebla" tamano="md">
          <div className="max-w-[42rem]">
            <h2 className="text-subtitulo">¿Buscas uno de los antiguos?</h2>
            <p className="mt-6 text-entradilla opacity-75">
              Los títulos anteriores a 2021 se vendían en la tienda del sitio anterior, que
              se cerró. Si te interesa alguno, escríbeme y miramos cómo conseguirlo.
            </p>
            <Boton href="/contacto" className="mt-9">
              Escríbeme
            </Boton>
          </div>
        </Seccion>
      )}
    </>
  );
}

import type { Metadata } from "next";

import { Boton } from "@/components/layout/boton";
import { Seccion, Titulo } from "@/components/layout/seccion";
import { Ficha } from "@/components/recomendaciones/ficha";
import { Subrayado } from "@/components/ui/subrayado";
import { getRecomendaciones, getSitio } from "@/lib/datos";

const DESCRIPCION =
  "Novelas, memorias, un podcast y dos películas que Carolina Alonso recomienda, cada una con el comentario que escribió sobre ella.";

export async function generateMetadata(): Promise<Metadata> {
  const { identidad } = await getSitio();
  const titulo = "Recomendaciones";

  return {
    title: titulo,
    description: DESCRIPCION,
    alternates: { canonical: "/recomendaciones" },
    openGraph: {
      // Next SUSTITUYE el openGraph del layout en vez de fusionarlo campo a
      // campo, así que estas dos hay que repetirlas o la página se comparte sin
      // idioma ni nombre de sitio.
      locale: "es_CO",
      siteName: "Carolina Alonso C.",
      type: "website",
      url: "/recomendaciones",
      title: `${titulo} · ${identidad.firma}`,
      description: DESCRIPCION,
      // La tarjeta la genera `npm run og` por captura. Se declara aunque el
      // archivo no exista todavía: el día que se genere, no hay que volver
      // por aquí, y mientras tanto la red social cae en la del sitio.
      images: [{ url: "/og/recomendaciones.jpg", width: 1200, height: 630, alt: titulo }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${titulo} · ${identidad.firma}`,
      description: DESCRIPCION,
      images: ["/og/recomendaciones.jpg"],
    },
  };
}

export default async function PaginaRecomendaciones() {
  // Ya llegan de la más reciente a la más antigua desde `lib/datos`.
  const recomendaciones = await getRecomendaciones();

  return (
    <>
      {/* ------------------------------ Cabecera ------------------------------ */}
      <Seccion fondo="menta-niebla" tamano="lg" conGrano>
        <Titulo
          nivel="h1"
          tamano="xl"
          eyebrow={`${recomendaciones.length} recomendaciones`}
          titulo={
            <>
              Lo que leo, escucho y veo cuando no estoy{" "}
              <Subrayado variante="onda">
                <em>escribiendo</em>
              </Subrayado>
            </>
          }
          entradilla="Las fui dejando aquí entre 2020 y 2021. El comentario de cada una es el que escribí entonces."
          className="mb-0"
        />
      </Seccion>

      {/* ------------------------------ La pared ------------------------------ */}
      {/*
        `overflow-x-clip` y no `overflow-hidden`: las notas van giradas y su
        caja rotada sobresale unos píxeles del container, lo justo para provocar
        barra horizontal en un móvil de 375 px. `clip` recorta ese sobrante sin
        crear un contenedor de scroll, así que el anclaje `#slug` de cada ficha
        sigue llevando a su sitio.
      */}
      <Seccion fondo="papel" tamano="lg" conGrano className="overflow-x-clip">
        <ul className="grid list-none gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {recomendaciones.map((recomendacion, indice) => (
            <li key={recomendacion.slug} className="flex">
              <Ficha recomendacion={recomendacion} indice={indice} />
            </li>
          ))}
        </ul>
      </Seccion>

      {/* ------------------------------- Cierre ------------------------------- */}
      <Seccion fondo="amarillo-claro" tamano="md">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="max-w-[18ch] text-subtitulo">¿Y los libros que escribió ella?</h2>
            <p className="mt-4 max-w-[46ch] text-entradilla opacity-75">
              Están todos en la biblioteca. Cinco ya no se consiguen en librerías; por esos
              conviene preguntar.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Boton href="/libros">Ver los libros</Boton>
            <Boton href="/contacto" variante="borde">
              Preguntar por uno
            </Boton>
          </div>
        </div>
      </Seccion>
    </>
  );
}

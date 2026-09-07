import type { Metadata } from "next";
import Link from "next/link";

import { FORMULARIO_CONTACTO } from "@/components/formularios/campos";
import { Formulario } from "@/components/formularios/formulario";
import { Boton } from "@/components/layout/boton";
import { ICONOS_RED } from "@/components/layout/navegacion";
import { Seccion, Titulo } from "@/components/layout/seccion";
import { IconoFlechaDiagonal } from "@/components/ui/iconos";
import { Subrayado } from "@/components/ui/subrayado";
import { getLibrosPorEstado, getSitio, urlLibro } from "@/lib/datos";

const DESCRIPCION =
  "Escríbele a Carolina Alonso: preguntas sobre sus libros —incluidos los que ya no están en librerías—, procesos de acompañamiento y todo lo demás.";

export async function generateMetadata(): Promise<Metadata> {
  const { identidad } = await getSitio();
  const titulo = "Contacto";

  return {
    title: titulo,
    description: DESCRIPCION,
    alternates: { canonical: "/contacto" },
    openGraph: {
      type: "website",
      url: "/contacto",
      title: `${titulo} · ${identidad.firma}`,
      description: DESCRIPCION,
      // La genera `npm run og` por captura; se declara aunque aún no exista.
      images: [{ url: "/og/contacto.jpg", width: 1200, height: 630, alt: titulo }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${titulo} · ${identidad.firma}`,
      description: DESCRIPCION,
      images: ["/og/contacto.jpg"],
    },
  };
}

export default async function PaginaContacto() {
  const { contacto, redes } = await getSitio();
  /*
   * Los cinco libros que ya no se compran. Las fichas de esos libros mandan
   * aquí con un «Pregúntame por este libro», así que esta página tiene que
   * responder a esa expectativa antes de que nadie pregunte por qué llegó.
   * Se leen del catálogo y no se escriben a mano: el día que uno vuelva a
   * librerías, sale solo de esta lista.
   */
  const descatalogados = await getLibrosPorEstado("solo-consulta");

  return (
    <>
      {/* ------------------------------ Cabecera ------------------------------ */}
      <Seccion fondo="amarillo-claro" tamano="lg" conGrano>
        <Titulo
          nivel="h1"
          tamano="xl"
          eyebrow="Contacto"
          titulo={
            <>
              Cuéntame qué te trajo hasta{" "}
              <Subrayado variante="onda">
                <em>aquí</em>
              </Subrayado>
            </>
          }
          entradilla="Una pregunta sobre un libro, una idea que te dio vueltas mientras leías, un proceso que quieres empezar. Todo eso cabe."
          className="mb-0"
        />
      </Seccion>

      {/* -------------------- Formulario y vías que sí funcionan -------------- */}
      <Seccion fondo="papel" tamano="lg" conGrano>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* ---------------------------- El formulario --------------------- */}
          <div className="lg:col-span-7">
            {/*
              Las redes bajan hasta el formulario porque el aviso de envío las
              necesita: decir «esto no llega» sin ofrecer a la vez un sitio al
              que sí se llega deja a la persona exactamente donde no queremos.
            */}
            <Formulario maqueta={FORMULARIO_CONTACTO} redes={redes} />
          </div>

          {/* ------------------------ La columna de al lado ------------------ */}
          <div className="flex flex-col gap-10 lg:col-span-5">
            {/* Los libros descatalogados: la razón por la que mucha gente llega. */}
            {descatalogados.length > 0 && (
              <section
                aria-labelledby="contacto-libros"
                className="rounded-panel bg-menta-niebla p-7 text-marino sm:p-8"
              >
                <p className="eyebrow opacity-50">Lo que más se pregunta</p>
                <h2 id="contacto-libros" className="mt-4 text-rotulo">
                  Los libros que ya no están en librerías
                </h2>
                <p className="mt-4 text-cuerpo text-marino-suave">
                  Se vendían por la tienda del sitio anterior, que ya no existe. Por aquí es por
                  donde se pregunta por ellos: escríbeme y vemos qué se puede hacer.
                </p>
                <ul className="mt-5 space-y-1">
                  {descatalogados.map((libro) => (
                    <li key={libro.slug}>
                      <Link
                        href={urlLibro(libro.slug)}
                        className="tactil flex min-h-11 items-center gap-2 text-cuerpo"
                      >
                        <span className="enlace">{libro.titulo}</span>
                        <span className="cifras text-nota opacity-45">{libro.anio}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* La vía que hoy sí funciona de verdad. */}
            <section aria-labelledby="contacto-redes">
              <p className="eyebrow opacity-50">Donde sí llega hoy</p>
              <h2 id="contacto-redes" className="mt-4 text-rotulo">
                Sus redes están abiertas
              </h2>
              <p className="mt-4 max-w-[42ch] text-cuerpo text-marino-suave">
                Mientras el formulario de arriba sea una maqueta, este es el camino que
                funciona: un mensaje directo por cualquiera de estas puertas.
              </p>

              <ul className="mt-6 space-y-1">
                {redes.map((red) => {
                  const Icono = ICONOS_RED[red.plataforma];
                  return (
                    <li key={red.plataforma}>
                      <a
                        href={red.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tactil group flex min-h-11 items-center gap-3 text-cuerpo"
                      >
                        <Icono
                          aria-hidden
                          className="shrink-0 text-[1.125rem] text-marino-tenue transition-colors group-hover:text-azul"
                        />
                        <span className="enlace font-medium">{red.nombre}</span>
                        <span className="text-nota text-marino-tenue">{red.usuario}</span>
                        <IconoFlechaDiagonal
                          aria-hidden
                          className="text-[0.875rem] text-marino-tenue"
                        />
                        <span className="sr-only">, se abre en otra pestaña</span>
                      </a>
                    </li>
                  );
                })}
              </ul>

              {/*
                El correo aparece SOLO cuando lo haya. Hoy `contacto.correo` es
                `null` y nadie ha confirmado ninguna dirección
                (docs/por-confirmar.md, punto 4), así que la página se calla en
                vez de inventar una. El día que se rellene en `sitio.json`, esta
                línea sale sola y no hay que tocar código.
              */}
              {contacto.correo && (
                <p className="mt-6 text-cuerpo">
                  <span className="text-marino-suave">O por correo: </span>
                  <a href={`mailto:${contacto.correo}`} className="enlace font-medium">
                    {contacto.correo}
                  </a>
                </p>
              )}

              <p className="mt-6 text-nota text-marino-tenue">
                Vive y escribe en {contacto.ciudad}.
              </p>
            </section>
          </div>
        </div>
      </Seccion>

      {/* ------------------------------- Cierre ------------------------------- */}
      <Seccion fondo="menta-clara" tamano="md">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="max-w-[20ch] text-subtitulo">¿Venías por la Reconexión?</h2>
            <p className="mt-4 max-w-[46ch] text-entradilla opacity-75">
              Ese proceso tiene su propia página, con lo que es, cómo se hace y cuánto vale.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Boton href="/reconexion">Ver la Reconexión</Boton>
            <Boton href="/libros" variante="borde">
              Ver los libros
            </Boton>
          </div>
        </div>
      </Seccion>
    </>
  );
}

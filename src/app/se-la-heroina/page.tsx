import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { ListaEpisodios } from "@/components/heroina/lista-episodios";
import { Prensa } from "@/components/heroina/prensa";
import { PortadaLibro } from "@/components/portada/marco-imagen";
import { Seccion, Titulo } from "@/components/layout/seccion";
import { Prosa } from "@/components/ui/prosa";
import { Subrayado } from "@/components/ui/subrayado";
import { getEpisodios, getHeroina, getLibro, getPrensa } from "@/lib/datos";
import type { SoporteCompra } from "@/types/libro";

/** Es la casa de este libro: el slug no cambia y por eso puede ser una constante. */
const SLUG = "se-la-heroina-de-tu-historia";

/**
 * La palabra que lleva el trazo manuscrito en el titular.
 *
 * Se parte por ella el título que viene del catálogo, en vez de reescribirlo
 * aquí: si mañana cambia el título en `libros.json`, el h1 cambia con él y no
 * se queda un texto viejo cosido en la página.
 */
const PALABRA_TRAZO = "heroína";

/**
 * TODA la página se compone sobre una sola columna centrada.
 *
 * Es una página de leer —bienvenida, sinopsis, nueve resúmenes y tres
 * entrevistas—, y con las bandas de color a sangre alrededor, una única medida
 * centrada evita que cada sección abra su propio eje. 42rem son unas 70
 * columnas de Inter a 18 px: por debajo del límite en que el ojo pierde el
 * principio del renglón siguiente.
 */
const COLUMNA = "mx-auto max-w-[42rem]";

/** El orden en que se ofrece cada soporte, con el nombre que se usa en español. */
const SOPORTES: { clave: SoporteCompra; etiqueta: string }[] = [
  { clave: "fisico", etiqueta: "En papel" },
  { clave: "digital", etiqueta: "Edición digital" },
  { clave: "audio", etiqueta: "Audiolibro" },
];

export async function generateMetadata(): Promise<Metadata> {
  const libro = await getLibro(SLUG);
  if (!libro) return {};

  const titulo = libro.subtitulo ? `${libro.titulo}. ${libro.subtitulo}` : libro.titulo;

  return {
    title: libro.titulo,
    description: libro.resumen,
    openGraph: {
      // Next SUSTITUYE el openGraph del layout en vez de fusionarlo campo a
      // campo, así que estas dos hay que repetirlas o la página se comparte sin
      // idioma ni nombre de sitio.
      locale: "es_CO",
      siteName: "Carolina Alonso C.",
      type: "book",
      url: "/se-la-heroina",
      title: titulo,
      description: libro.resumen,
      // La tarjeta la genera `npm run og` por captura; se declara desde ya para
      // que el HTML no cambie el día que el archivo exista.
      images: [{ url: "/og/se-la-heroina.jpg", width: 1200, height: 630, alt: titulo }],
    },
    // El bloque `twitter` del layout se hereda entero si una página no pone el
    // suyo, y ahí el título es el del sitio: compartir esta página enseñaría la
    // tarjeta de la portada. La imagen no hace falta repetirla — cuando falta
    // `twitter:image`, los lectores de tarjetas caen en `og:image`.
    twitter: { title: titulo, description: libro.resumen },
  };
}

/**
 * SÉ LA HEROÍNA DE TU HISTORIA
 *
 * La casa del libro de Planeta de 2021: bienvenida, sinopsis, el ciclo de nueve
 * vídeos, la prensa y dónde conseguirlo.
 *
 * El color de la cabecera y del cierre es el teal de la portada real
 * (`colorPortada`), inyectado como `--acento` sobre la sección; el rosa de en
 * medio es el `colorSeccion` del mismo libro, que resulta ser el token `rosa`.
 * Los dos salen de `libros.json`, así que si un día se remaqueta la portada, la
 * página cambia de color sola.
 */
export default async function SeLaHeroina() {
  const libro = await getLibro(SLUG);
  const heroina = await getHeroina();
  const episodios = await getEpisodios();
  const apariciones = await getPrensa();

  // El catálogo es la fuente: si este libro desapareciera de él, la página no
  // debería inventarse ni el título ni el color.
  if (!libro) notFound();

  const acento = {
    "--acento": libro.colorPortada,
    "--acento-tinta": "var(--color-papel)",
  } as CSSProperties;

  const [antesDelTrazo, despuesDelTrazo] = libro.titulo.split(PALABRA_TRAZO);
  const soportesConTienda = SOPORTES.filter(({ clave }) => libro.compra[clave].length > 0);

  return (
    <>
      {/* ---------------------------- Cabecera ---------------------------- */}
      {/* La cabecera enseña la portada: es un libro, y la portada es la mitad
          de lo que alguien reconoce de un libro. En móvil va arriba y centrada;
          desde `lg` se pone al lado del texto, algo más pequeña que él. */}
      <Seccion fondo="acento" tamano="lg" conGrano style={acento}>
        <div className="mx-auto grid max-w-[64rem] gap-8 sm:gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <div className="mx-auto w-3/5 max-w-[16rem] lg:mx-0 lg:w-full lg:max-w-none">
            <PortadaLibro libro={libro} prioridad sizes="(min-width: 1024px) 18rem, 60vw" />
          </div>

          <div>
          <p className="eyebrow opacity-70">
            El libro · {libro.editorial}, {libro.anio}
          </p>
          <h1 className="mt-6 text-titular">
            {despuesDelTrazo === undefined ? (
              // Si el título dejara de contener la palabra, se pinta entero:
              // se pierde el trazo, no el titular.
              libro.titulo
            ) : (
              <>
                {antesDelTrazo}
                <Subrayado variante="onda" color="currentColor">
                  <em>{PALABRA_TRAZO}</em>
                </Subrayado>
                {despuesDelTrazo}
              </>
            )}
          </h1>
          {libro.subtitulo && (
            <p className="mt-6 font-display text-subtitulo opacity-80">{libro.subtitulo}</p>
          )}
          <p className="mt-8 max-w-[44ch] text-entradilla opacity-85">{libro.resumen}</p>
          </div>
        </div>
      </Seccion>

      {/* --------------------- Bienvenida y sinopsis ---------------------- */}
      <Seccion fondo="papel" tamano="md">
        <div className={COLUMNA}>
          {/* La bienvenida le habla de tú a quien acaba de leer el libro, así
              que va en serif y a cuerpo grande: es una voz, no una descripción. */}
          <p className="font-display text-rotulo text-marino-tinta">{heroina.entradilla}</p>

          <div className="mt-12 sm:mt-20">
            <Titulo eyebrow="La sinopsis" titulo="De qué trata el libro" tamano="md" />
            <Prosa>
              {heroina.presentacion.map((parrafo) => (
                <p key={parrafo}>{parrafo}</p>
              ))}
            </Prosa>
          </div>

          {libro.cita && (
            <figure className="mt-10 border-t border-marino/12 pt-8 sm:mt-16 sm:pt-10">
              <blockquote className="font-display text-rotulo text-marino-tinta">
                «{libro.cita.texto}»
              </blockquote>
              <figcaption className="mt-4 text-nota text-marino-tenue">
                {libro.cita.fuente}
              </figcaption>
            </figure>
          )}
        </div>
      </Seccion>

      {/* ---------------------------- Episodios --------------------------- */}
      <Seccion fondo="rosa" tamano="md" id="episodios">
        <div className={COLUMNA}>
          <Titulo
            eyebrow="El ciclo en vídeo"
            titulo="Nueve conversaciones sobre el libro"
            entradilla="Uno de introducción y ocho más, en el canal de YouTube. Se ven fuera de aquí: esta página solo te dice cuál es cuál."
          />
          <ListaEpisodios episodios={episodios} />
        </div>
      </Seccion>

      {/* ------------------------------ Prensa ---------------------------- */}
      <Seccion fondo="papel" tamano="md" id="prensa">
        <div className={COLUMNA}>
          <Titulo
            eyebrow="En prensa"
            titulo="Lo que se dijo del libro"
            entradilla="Tres conversaciones de radio y podcast alrededor del lanzamiento."
            tamano="md"
          />
          <Prensa apariciones={apariciones} />
        </div>
      </Seccion>

      {/* ------------------------ Dónde conseguirlo ----------------------- */}
      <Seccion fondo="acento" tamano="lg" conGrano style={acento} id="comprar">
        <div className={COLUMNA}>
          <Titulo
            eyebrow="Dónde conseguirlo"
            titulo="En papel, en digital y en audio"
            entradilla={`Publicado por ${libro.editorial}. Estos son los sitios donde está a la venta hoy.`}
            tamano="md"
          />
          <div className="grid gap-7 sm:grid-cols-3 sm:gap-10">
            {soportesConTienda.map(({ clave, etiqueta }) => (
              <div key={clave}>
                <h3 className="eyebrow border-b border-current/25 pb-3 opacity-70">{etiqueta}</h3>
                <ul className="mt-4 space-y-2">
                  {libro.compra[clave].map((tienda) => (
                    <li key={`${clave}-${tienda.url}`}>
                      <a
                        href={tienda.url}
                        target="_blank"
                        rel="noreferrer"
                        className="tactil enlace inline-flex min-h-11 items-center text-cuerpo lg:min-h-0"
                      >
                        {tienda.tienda}
                        {/* Ocho enlaces con nombres de tienda repetidos entre
                            soportes: sin esto, «Amazon» sale tres veces y en un
                            lector de pantalla no se sabe cuál es el audiolibro. */}
                        <span className="sr-only"> · {etiqueta}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Seccion>
    </>
  );
}

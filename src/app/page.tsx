import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { HeroNarrativo } from "@/components/hero/hero-narrativo";
import { Boton } from "@/components/layout/boton";
import { Columna, Seccion, Titulo } from "@/components/layout/seccion";
import { PortadaLibro, Retrato, Textura } from "@/components/portada/marco-imagen";
import {
  IconoFlechaDerecha,
  IconoFlechaDiagonal,
  IconoSpotify,
  IconoYoutube,
} from "@/components/ui/iconos";
import { DatosEstructurados } from "@/components/ui/datos-estructurados";
import { Prosa } from "@/components/ui/prosa";
import { Subrayado } from "@/components/ui/subrayado";
import { contraste } from "@/lib/color";
import {
  anioLegible,
  formatearPrecio,
  getCanalesEnlazables,
  getEpisodios,
  getLibro,
  getLibroDestacado,
  getLibros,
  getPodcast,
  getQuienSoy,
  getReconexion,
  getRecomendaciones,
  getSitio,
  urlLibro,
  urlRecomendacion,
  urlServicio,
} from "@/lib/datos";
import { personaCarolina, sitioWeb } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { TipoRecomendacion } from "@/types";

/**
 * LA PORTADA
 *
 * El orden cuenta algo seguido, en vez de enumerar destinos. El hero pregunta
 * («¿Perdiste tu norte?»), el libro nuevo dice desde dónde habla hoy, la
 * biografía dice quién lo dice, las cifras dan la medida del oficio, el
 * carrusel abre el catálogo, «Sé la heroína» ofrece la casa que ya existe, el
 * podcast y la Reconexión son las dos maneras de acompañarla fuera del papel,
 * las recomendaciones enseñan su gusto, y la banda amarilla cierra con la única
 * cosa que se le pide a quien llegó hasta abajo: escribir.
 *
 * El color alterna a propósito —claro, oscuro, claro— para que ninguna banda de
 * color quede pegada a otra del mismo valor. La superficie sigue siendo papel
 * en torno a dos tercios, que es la proporción de la referencia.
 */

/** El corte de la tarjeta de compartir; lo genera `npm run og`. */
const IMAGEN_OG = "/og/portada.jpg";

export async function generateMetadata(): Promise<Metadata> {
  const { identidad } = await getSitio();
  const titulo = `${identidad.firma} · ${identidad.oficio}`;

  return {
    /*
     * `absolute` porque la plantilla de `layout.tsx` añade la firma al final de
     * cada título. Sin esto, la portada se llamaría «Carolina Alonso C. ·
     * Escritora, filósofa y coach · Carolina Alonso C.».
     */
    title: { absolute: titulo },
    description: identidad.descripciones.breve,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "es_CO",
      url: "/",
      siteName: identidad.firma,
      title: titulo,
      description: identidad.descripciones.breve,
      images: [{ url: IMAGEN_OG, width: 1200, height: 630, alt: titulo }],
    },
    twitter: { card: "summary_large_image", images: [IMAGEN_OG] },
  };
}

export default async function Inicio() {
  const [sitio, destacado, libros, quienSoy, heroina, episodios, podcast, canales, servicio, recomendaciones] =
    await Promise.all([
      getSitio(),
      getLibroDestacado(),
      getLibros(),
      getQuienSoy(),
      getLibro("se-la-heroina-de-tu-historia"),
      getEpisodios(),
      getPodcast(),
      getCanalesEnlazables(),
      getReconexion(),
      getRecomendaciones(),
    ]);

  const { identidad } = sitio;

  /*
   * El color de la primera banda se lee antes del hero porque el degradado que
   * cose las dos cosas tiene que conocerlo. La reserva es el amarillo claro de
   * la paleta, que es justo el color que trae el libro destacado.
   */
  const colorPrimeraBanda = destacado?.colorSeccion ?? "#FAF1C7";

  /* Los dos extremos del catálogo dan los años de oficio sin escribirlos. */
  const anioReciente = libros[0]?.anio ?? new Date().getFullYear();
  const anioPrimero = libros[libros.length - 1]?.anio ?? anioReciente;

  const cifras = [
    { valor: `${libros.length}`, etiqueta: "libros publicados" },
    { valor: `${anioReciente - anioPrimero}`, etiqueta: "años publicando" },
    // De su propia biografía: «Tras 18 años como docente e investigadora
    // universitaria…» (`quien-soy.json`, trayectoria). No hay dónde derivarlo.
    { valor: "18", etiqueta: "años de aula universitaria" },
    {
      valor: `${quienSoy.formacion.certificaciones.length}`,
      etiqueta: "certificaciones como coach",
    },
  ];

  /*
   * Los dos nodos que identifican el sitio para un buscador: quién es ella y
   * qué es esto. Van juntos y solo aquí —el `@id` de la persona es la misma
   * dirección en todas las páginas—, así que el `Person` de «Quién soy» y el
   * `author` de las siete fichas apuntan a esta declaración y no abren siete
   * personas distintas.
   */
  const [persona, sitioLd] = await Promise.all([personaCarolina(), sitioWeb()]);

  return (
    <>
      <DatosEstructurados nodos={[persona, sitioLd]} />

      {/* ================================================================
          1 · HERO — a sangre, por debajo de la barra

          `layout.tsx` reserva 80 px arriba para la píldora de navegación y
          expone esa misma cifra como `--alto-barra`. Deshacerla aquí, y solo
          aquí, es lo que hace que el mar empiece en el borde de la ventana y
          la barra flote encima en vez de apoyarse en él.
          ================================================================ */}
      <div className="relative -mt-[var(--alto-barra)]">
        <HeroNarrativo />
        <Costura color={colorPrimeraBanda} />
      </div>

      {/* ================================================================
          2 · EL LIBRO NUEVO
          Lo primero que se ve al salir del hero es lo que está publicando
          ahora. La banda toma el color que el propio libro trae en los datos.
          ================================================================ */}
      {destacado && (
        <Seccion
          fondo="acento"
          tamano="lg"
          conGrano
          style={
            {
              "--acento": destacado.colorSeccion,
              "--acento-tinta": contraste(destacado.colorSeccion).texto,
            } as CSSProperties
          }
        >
          <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-start lg:gap-14">
            {/* Sin `proporcion`: la foto del libro es apaisada —es una pila de
                ejemplares, no un escaneo de la cubierta— y forzarle una caja
                vertical le cortaría el título. */}
            <div className="mx-auto w-full max-w-[26rem] lg:col-span-5 lg:mx-0 lg:max-w-none">
              <PortadaLibro
                libro={destacado}
                sizes="(min-width: 1024px) 30rem, calc(100vw - 2.5rem)"
                prioridad
              />
            </div>

            <div className="lg:col-span-7">
              <p className="eyebrow opacity-60">
                Lo más reciente{destacado.editorial && ` · ${destacado.editorial}`} ·{" "}
                <span className="cifras">{anioLegible(destacado.anio, destacado.anioPorConfirmar)}</span>
              </p>

              <h2 className="mt-5 text-titulo">
                <em>{destacado.titulo}</em>
              </h2>

              <p className="mt-6 max-w-[46ch] text-entradilla opacity-75">{destacado.resumen}</p>

              {destacado.cita && (
                <figure className="mt-8 border-l-2 border-current/25 pl-6 sm:mt-10 sm:pl-8">
                  <blockquote className="max-w-[40ch] font-display text-rotulo leading-snug">
                    «{destacado.cita.texto}»
                  </blockquote>
                  <figcaption className="mt-4 text-nota opacity-60">
                    {destacado.cita.fuente}
                  </figcaption>
                </figure>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-4 sm:mt-10">
                <Boton href={urlLibro(destacado.slug)} tamano="lg">
                  Conoce el libro
                  <IconoFlechaDerecha />
                </Boton>
                {(destacado.compra.fisico.length > 0 || destacado.compra.digital.length > 0) && (
                  <p className="text-nota opacity-60">En librerías y en digital.</p>
                )}
              </div>
            </div>
          </div>
        </Seccion>
      )}

      {/* ================================================================
          3 · QUIÉN SOY — en su voz, con retrato
          Dos párrafos de su biografía tal como los escribió ella. El resto
          está en `/quien-soy`, que es de otro frente.
          ================================================================ */}
      <Seccion fondo="papel" tamano="lg">
        <div className="grid gap-9 sm:gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
          {/* Retrato propio de este bloque y no el de «Quién soy», que está a
              un clic: repetir la misma foto en las dos hace que la segunda
              parezca la primera. */}
          <div className="mx-auto w-4/5 max-w-[22rem] sm:w-3/5 lg:col-span-5 lg:mx-0 lg:w-full lg:max-w-none">
            <Retrato
              base="retrato-historia"
              color="#C2EFE3"
              firma={identidad.firma}
              alt="Carolina Alonso, sentada junto a una pared de yeso con luz de ventana, sonríe a la cámara."
              sizes="(min-width: 1024px) 26rem, 70vw"
              className="shadow-panel"
            />
          </div>

          <div className="lg:col-span-7">
            <Titulo
              eyebrow="Quién soy"
              titulo={<ConTrazo texto={quienSoy.titular} />}
              className="mb-7 sm:mb-9"
            />
            <Columna>
              <Prosa>
                {/* Los índices apuntan a `quien-soy.json`: el segundo párrafo
                    (por qué le importa nombrar) y el sexto (la hechicera que
                    deshace encantamientos), que es el que enlaza con el cierre
                    de la página. */}
                <p>{quienSoy.biografia[1]}</p>
                <p>{quienSoy.biografia[5]}</p>
              </Prosa>
              <div className="mt-9">
                <Boton href="/quien-soy" variante="borde">
                  Sigue leyendo mi historia
                  <IconoFlechaDerecha />
                </Boton>
              </div>
            </Columna>
          </div>
        </div>
      </Seccion>

      {/* ================================================================
          4 · LAS CIFRAS — la banda oscura de la referencia
          Va en `marino-tinta` y no en `marino` a propósito: el pie y la
          Reconexión ya son marino, y tres superficies casi negras idénticas
          en la misma página se leen como la misma banda repetida.
          ================================================================ */}
      <Seccion fondo="marino-tinta" tamano="md" conGrano>
        <p className="max-w-[26ch] font-display text-subtitulo">
          Escribo desde <span className="cifras">{anioPrimero}</span>. Cada libro empezó por una
          pregunta que no sabía contestar.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-x-5 gap-y-7 sm:mt-16 sm:gap-x-10 sm:gap-y-10 lg:grid-cols-4">
          {cifras.map((cifra) => (
            /* `flex-col-reverse` deja la cifra arriba y su etiqueta debajo sin
               invertir el orden del DOM, que en una lista de definiciones tiene
               que seguir siendo término → valor. */
            <div key={cifra.etiqueta} className="flex flex-col-reverse gap-2">
              <dt className="eyebrow text-papel/55">{cifra.etiqueta}</dt>
              <dd className="cifras font-display text-titulo leading-none">{cifra.valor}</dd>
            </div>
          ))}
        </dl>
      </Seccion>

      {/* ================================================================
          5 · EL CATÁLOGO — carrusel con imán, sin una línea de JavaScript
          La utilidad `carrusel` pone el scroll-snap y copia el padding del
          container para que la primera tarjeta quede alineada con el titular.
          ================================================================ */}
      <Seccion fondo="celeste" tamano="md" aSangre>
        <div className="container">
          <Titulo
            eyebrow="Libros"
            titulo="Uno por cada pregunta"
            entradilla="Relatos, una novela, un cuento ilustrado y la no ficción que hoy me ocupa."
            accion={
              <Boton href="/libros" variante="borde">
                Ver todos
              </Boton>
            }
          />
        </div>

        <ul className="carrusel pb-3">
          {libros.map((libro) => (
            <li key={libro.slug} className="w-[13.5rem] sm:w-[15rem]">
              <Link href={urlLibro(libro.slug)} className="tactil group block">
                {/* Aquí SÍ va una caja igual para todas, porque una fila de
                    tarjetas de alturas distintas se lee como una estantería mal
                    puesta. Con `contener` ninguna portada se recorta, y lo que
                    sobra a los lados lo rellena su propia miniatura difuminada:
                    cada libro queda en un halo de su color. */}
                <PortadaLibro
                  libro={libro}
                  proporcion="3 / 4"
                  ajuste="contener"
                  sizes="15rem"
                  className="transition-transform duration-500 ease-suave group-hover:-translate-y-1.5"
                />
                <p className="mt-4 font-display text-rotulo leading-tight">{libro.titulo}</p>
                <p className="mt-1.5 text-nota opacity-60">
                  <span className="cifras">
                    {anioLegible(libro.anio, libro.anioPorConfirmar)}
                  </span>{" "}
                  · {libro.genero}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Seccion>

      {/* ================================================================
          6 · SÉ LA HEROÍNA — el libro que además es una casa
          El fondo es el teal de la portada real, medido sobre la imagen. Aquí
          NO se usa <Titulo>: sus opacidades (55 % en el eyebrow, 70 % en la
          entradilla) caen por debajo de AA sobre este verde, así que el texto
          va a plena intensidad.
          ================================================================ */}
      {heroina && (
        <Seccion
          fondo="acento"
          tamano="lg"
          conGrano
          style={
            {
              "--acento": heroina.colorPortada,
              "--acento-tinta": contraste(heroina.colorPortada).texto,
            } as CSSProperties
          }
        >
          <div className="grid gap-9 sm:gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
            <div className="lg:col-span-7">
              <p className="eyebrow">Tu espacio</p>
              <h2 className="mt-5 text-titulo">
                <em>{heroina.titulo}</em>
              </h2>
              {heroina.subtitulo && (
                /* Sin `opacity`: sobre este verde, papel al 80 % se queda en
                   3,6:1 y no pasa AA. Lo que separa el subtítulo del título es
                   el tamaño, no la intensidad. */
                <p className="mt-3 font-display text-rotulo">{heroina.subtitulo}</p>
              )}

              <p className="mt-8 max-w-[34ch] font-display text-subtitulo leading-tight">
                {heroina.resumen}
              </p>

              <p className="mt-8 max-w-[48ch] text-entradilla">
                Alrededor del libro abrí un espacio para ti:{" "}
                <span className="cifras">{episodios.length}</span> videos que acompañan la lectura,
                herramientas y las conversaciones que fueron saliendo de ahí.
              </p>

              <div className="mt-8 flex flex-wrap gap-4 sm:mt-10">
                <Boton href="/se-la-heroina" variante="claro" tamano="lg">
                  Entra al espacio
                  <IconoFlechaDerecha />
                </Boton>
                <Boton href={urlLibro(heroina.slug)} variante="borde" tamano="lg">
                  Ficha del libro
                </Boton>
              </div>
            </div>

            <div className="mx-auto w-3/5 max-w-[15rem] sm:w-2/5 lg:col-span-5 lg:mx-0 lg:w-full lg:max-w-none">
              <PortadaLibro libro={heroina} sizes="(min-width: 1024px) 22rem, 60vw" />
            </div>
          </div>
        </Seccion>
      )}

      {/* ================================================================
          7 · DONDE SE LA ESCUCHA
          El podcast y el canal que hoy tienen dirección. «Love is Real»
          existe y ella lo nombra, pero nadie ha dado su URL:
          `getCanalesEnlazables()` lo deja fuera para no pintar un enlace roto.
          ================================================================ */}
      <Seccion fondo="mantequilla" tamano="md">
        <Titulo
          eyebrow="Escuchar y ver"
          titulo={podcast.programa.nombre}
          entradilla={podcast.entradilla}
          accion={
            <Boton href="/podcast" variante="borde">
              Todo el podcast
            </Boton>
          }
        />

        <ul className="grid gap-6 sm:grid-cols-2">
          <li>
            <TarjetaCanal
              href={podcast.programa.url}
              plataforma={podcast.programa.plataforma}
              nombre={podcast.programa.nombre}
              descripcion={podcast.programa.descripcion}
              icono={<IconoSpotify className="text-[1.5rem]" />}
            />
          </li>
          {canales.map(
            (canal) =>
              canal.url && (
                <li key={canal.slug}>
                  <TarjetaCanal
                    href={canal.url}
                    plataforma="YouTube"
                    nombre={canal.nombre}
                    descripcion={canal.descripcion}
                    icono={<IconoYoutube className="text-[1.5rem]" />}
                  />
                </li>
              ),
          )}
        </ul>
      </Seccion>

      {/* ================================================================
          8 · RECONEXIÓN
          El único servicio, y lo que lo hace distinto de cualquier otro
          acompañamiento: se hace una sola vez en la vida. Los cuatro rasgos
          son el resumen de `servicios.json`; el proceso entero está en
          `/reconexion`.
          ================================================================ */}
      {servicio && (
        <Seccion fondo="marino" tamano="lg" aSangre>
          {/*
            El cielo estrellado en vez de un retrato, por dos razones. La buena:
            la Reconexión es «volver a alinearte con tu sistema de navegación
            interno», que es literalmente lo que dice el segundo acto del hero
            sobre una brújula de estrellas —el mismo cielo cerrando el círculo—.
            La práctica: `retrato-reconexion` es una escena declarada en
            `scripts/2-retratos.mjs` que todavía no ha pasado por el pipeline, y
            los retratos que sí existen tienen dueño en otras páginas.

            El velo por encima está para el contraste: sin él, el texto claro
            cae sobre las estrellas más brillantes y se pierde.
          */}
          <Textura base="constelacion" opacidad={0.55} sizes="100vw" />
          <div aria-hidden className="absolute inset-0 bg-marino/35" />

          <div className="container relative">
            <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
              <div className="lg:col-span-7">
                <Titulo
                  eyebrow="Acompañamiento"
                  titulo={servicio.nombre}
                  entradilla={servicio.definicion}
                  className="mb-8 sm:mb-10"
                />
                <Boton href={urlServicio(servicio.slug)} variante="claro" tamano="lg">
                  Cómo es la Reconexión
                  <IconoFlechaDerecha />
                </Boton>
              </div>

              {/* El resumen de `servicios.json`: el proceso entero, los efectos
                  y el porqué están en `/reconexion`, que es de otro frente. */}
              <dl className="rounded-panel bg-papel/8 p-6 backdrop-blur-[2px] sm:p-8 lg:col-span-5">
                {[
                  { termino: "Cuántas veces", valor: "Una sola vez en la vida" },
                  { termino: "Dónde", valor: "Presencial, en Bogotá" },
                  { termino: "Cuánto dura", valor: "Dos sesiones en 48 horas" },
                  { termino: "Cuánto cuesta", valor: formatearPrecio(servicio.precio) },
                ].map((rasgo, indice) => (
                  /* Etiqueta encima y valor debajo, siempre. En una fila con
                     `justify-between`, dos de los cuatro valores caben al lado
                     de su etiqueta y los otros dos bajan de línea: el bloque
                     queda con dos alineaciones distintas sin haberlo decidido
                     nadie. */
                  <div
                    key={rasgo.termino}
                    className={cn("py-4", indice > 0 && "border-t border-papel/15")}
                  >
                    <dt className="text-nota text-papel/60">{rasgo.termino}</dt>
                    <dd className="cifras mt-1 font-display text-rotulo">{rasgo.valor}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Seccion>
      )}

      {/* ================================================================
          9 · RECOMENDACIONES — las notas giradas de la referencia
          Cada ficha trae su propio color desde los datos y se gira un grado y
          pico: son papeles pegados en la pared, no tarjetas de un panel.
          Los giros son mínimos a propósito, para que a 375 px ninguna esquina
          se salga del container y aparezca scroll horizontal.
          ================================================================ */}
      <Seccion fondo="papel" tamano="lg">
        <Titulo
          eyebrow="Recomendaciones"
          titulo="Lo que leo, veo y escucho"
          entradilla="Libros, películas y podcasts que me han acompañado y que suelo repartir por ahí."
          accion={
            <Boton href="/recomendaciones" variante="borde">
              Ver todas
            </Boton>
          }
        />

        {/* Tres y no cuatro, y `items-start`: con cuatro columnas la nota se
            queda en 260 px y el texto de Carolina cae a tres palabras por
            renglón. Sin estirar a la misma altura, además, cada papel mide lo
            que mide su texto, que es lo que hace que parezcan pegados en una
            pared y no celdas de una tabla. */}
        <ul className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recomendaciones.slice(0, 3).map((recomendacion, indice) => {
            const tinta = contraste(recomendacion.color);
            return (
              <li key={recomendacion.slug} className={GIROS[indice % GIROS.length]}>
                <Link
                  href={urlRecomendacion(recomendacion.slug)}
                  className="tactil flex flex-col rounded-tarjeta p-6 shadow-tarjeta hover:shadow-panel"
                  style={{ backgroundColor: recomendacion.color, color: tinta.texto }}
                >
                  <p className="eyebrow" style={{ color: tinta.suave }}>
                    {ETIQUETA_TIPO[recomendacion.tipo]}
                  </p>
                  <p className="mt-3 font-display text-rotulo leading-tight">
                    {recomendacion.titulo}
                  </p>
                  {recomendacion.autor && (
                    <p className="mt-1 text-nota" style={{ color: tinta.suave }}>
                      {recomendacion.autor}
                    </p>
                  )}
                  <p className="mt-4 text-cuerpo" style={{ color: tinta.suave }}>
                    {recomendacion.texto}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </Seccion>

      {/* ================================================================
          10 · EL CIERRE
          La banda amarilla antes del pie oscuro, con una sola salida. El
          párrafo es suyo, literal, y recoge los encantamientos de la
          biografía de más arriba.
          ================================================================ */}
      <Seccion fondo="amarillo" tamano="lg" conGrano>
        <div className="mx-auto max-w-[46rem] text-center">
          <p className="eyebrow opacity-60">Escríbeme</p>
          <h2 className="mt-5 text-titulo">
            <ConTrazo texto="Empecemos por tu historia" />
          </h2>
          <p className="mx-auto mt-7 max-w-[46ch] text-entradilla opacity-75">
            {quienSoy.biografia[7]}
          </p>
          <div className="mt-8 flex justify-center sm:mt-10">
            <Boton href="/contacto" tamano="lg">
              Escríbeme
              <IconoFlechaDerecha />
            </Boton>
          </div>
        </div>
      </Seccion>
    </>
  );
}

/* ------------------------------------------------------------------ piezas */

/**
 * LA COSTURA DEL HERO CON EL RESTO DE LA PÁGINA.
 *
 * El hero termina en un amanecer y la banda siguiente es un color plano. Sin
 * nada en medio, el borde entre los dos es una línea recta y dura justo donde
 * la página empieza a leerse.
 *
 * Esto es un degradado de siete centímetros pegado al FONDO del recorrido del
 * hero: como está dentro del mismo envoltorio y va detrás en el DOM, se pinta
 * encima de la capa pegajosa del hero y disuelve sus últimos píxeles en el
 * color de la banda que viene. Mientras se recorre el hero queda fuera de la
 * pantalla y no tapa ningún acto; solo aparece cuando el recorrido se acaba.
 *
 * El primer tope se escribe como el mismo color con alfa cero y no como
 * `transparent`: `transparent` es negro transparente, y en un degradado hacia
 * un color cálido eso mete una banda gris por el medio.
 */
function Costura({ color }: { color: string }) {
  const transparente = /^#[0-9a-f]{6}$/i.test(color) ? `${color}00` : "transparent";

  return (
    <span
      aria-hidden
      /*
       * Sin JavaScript no hay degradado. Ahí el hero se queda en el póster —el
       * mar de noche, oscuro— y la salida es el bloque de botones que el hero
       * ancla a 32 px del borde inferior: justo dentro de estos nueve
       * centímetros de degradado, que lo taparían de amarillo casi por
       * completo. Contra una imagen nocturna, además, el borde recto contra la
       * banda clara no chirría; lo que había que suavizar era el amanecer.
       */
      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-36 [@media(scripting:none)]:hidden"
      style={{ backgroundImage: `linear-gradient(to bottom, ${transparente}, ${color})` }}
    />
  );
}

/**
 * El titular con la última palabra en itálica y subrayada a mano: el gesto de
 * la marca. Se parte aquí y no en el JSON para que el dato siga siendo texto
 * plano y no tenga que saber nada de cómo se pinta.
 */
function ConTrazo({ texto }: { texto: string }) {
  const palabras = texto.trim().split(/\s+/);
  const ultima = palabras.pop() ?? texto;

  return (
    <>
      {palabras.length > 0 && `${palabras.join(" ")} `}
      {/* La puntuación, si la hubiera, entra DENTRO del subrayado: el
          envoltorio es inline-block y una coma suelta detrás se quedaría
          huérfana al principio del renglón siguiente. */}
      <Subrayado variante="onda">
        <em>{ultima}</em>
      </Subrayado>
    </>
  );
}

/** Una plataforma donde escucharla o verla. Siempre sale del sitio. */
function TarjetaCanal({
  href,
  plataforma,
  nombre,
  descripcion,
  icono,
}: {
  href: string;
  plataforma: string;
  nombre: string;
  descripcion: string;
  icono: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="tactil group flex h-full flex-col rounded-panel bg-papel p-7 shadow-tarjeta hover:shadow-panel sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="text-marino-tinta">{icono}</span>
        <span className="eyebrow text-marino-tenue">{plataforma}</span>
        {/* La diagonal dice «esto sale del sitio» sin escribirlo. */}
        <IconoFlechaDiagonal
          aria-hidden
          className="ml-auto text-marino-tenue transition-transform duration-300 ease-suave group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </div>
      <p className="mt-5 font-display text-rotulo leading-tight text-marino-tinta">{nombre}</p>
      <p className="mt-3 text-cuerpo text-marino-suave">{descripcion}</p>
      <span className="sr-only">Se abre en otra pestaña</span>
    </a>
  );
}

/**
 * Giros de las notas. Van en grados sueltos y pequeños: por encima de dos, a
 * 375 px la esquina de la tarjeta se sale del container y la página gana un
 * scroll horizontal que nadie pidió.
 */
const GIROS = ["rotate-[-1.4deg]", "rotate-[0.9deg]", "rotate-[-0.6deg]", "rotate-[1.5deg]"];

/**
 * Nombre legible de cada tipo de recomendación.
 *
 * Vive aquí y no en `lib/datos/formato.ts` porque el frente de
 * `/recomendaciones` está escribiendo ahora mismo su propia página y, con ella,
 * el sitio donde esto acabará viviendo. El día que publique su tabla, esta se
 * borra y la portada importa aquella.
 */
const ETIQUETA_TIPO: Record<TipoRecomendacion, string> = {
  novela: "Novela",
  memorias: "Memorias",
  libro: "Libro",
  "libro-y-pelicula": "Libro y película",
  audiolibro: "Audiolibro",
  pelicula: "Película",
  podcast: "Podcast",
};

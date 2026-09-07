import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Columna, Seccion, Titulo } from "@/components/layout/seccion";
import { IconoFlechaDiagonal } from "@/components/ui/iconos";
import { Prosa } from "@/components/ui/prosa";
import { Subrayado } from "@/components/ui/subrayado";
import { anioLegible, getLibros, getQuienSoy, urlLibro } from "@/lib/datos";

const DESCRIPCION =
  "Carolina Alonso C., escritora, filósofa y coach. Dejó la Ingeniería Electrónica " +
  "por el Teatro y la Literatura, se enamoró de la Filosofía y hoy acompaña a otras " +
  "mujeres a cambiar la historia que se cuentan.";

export async function generateMetadata(): Promise<Metadata> {
  const { titulo, titular } = await getQuienSoy();

  return {
    title: titulo,
    description: DESCRIPCION,
    openGraph: {
      type: "profile",
      url: "/quien-soy",
      title: `${titulo} · ${titular}`,
      description: DESCRIPCION,
      // La tarjeta la genera `npm run og` por captura de la propia página; la
      // ruta se declara desde ya para que el HTML no cambie cuando exista.
      images: [{ url: "/og/quien-soy.jpg", width: 1200, height: 630, alt: titular }],
    },
  };
}

/**
 * El párrafo de la trayectoria que enumera los libros a mano.
 *
 * La biografía se cerró en 2021 y su lista se quedó en seis títulos: no
 * menciona «Sal del laberinto de soledad» (2024), que es el lanzamiento
 * vigente. Corregir el texto de ella no nos toca, así que el párrafo sale de la
 * prosa y la lista se pinta desde `getLibros()`, que es la única fuente del
 * catálogo. Así el conteo no puede volver a quedarse atrás cuando publique.
 */
const ENUMERA_LIBROS = "He publicado los libros";

/** Donde el párrafo deja de enumerar y vuelve a contar cosas que siguen siendo ciertas. */
const CORTE_ENUMERACION = "; también, ";

/**
 * De ese párrafo sobrevive lo que va después del punto y coma —las antologías,
 * los ensayos, las reseñas—, que no depende del catálogo y sigue vigente. Si el
 * texto cambiara y el corte desapareciera, no se pierde nada visible: la lista
 * de libros se sigue pintando igual.
 */
function colaDeLaEnumeracion(parrafo: string) {
  const corte = parrafo.indexOf(CORTE_ENUMERACION);
  if (corte === -1) return null;
  const cola = parrafo.slice(corte + CORTE_ENUMERACION.length);
  // Al quedarse sin la mitad de delante, la frase empieza en minúscula.
  return cola.charAt(0).toUpperCase() + cola.slice(1);
}

/**
 * Cita sacada del propio ensayo, en serif y a cuerpo de titular.
 *
 * Rompe la columna de lectura a propósito, como las citas de Lookback: el texto
 * no es nuevo —es una frase del párrafo de al lado subida de tamaño— y su
 * trabajo es dar un respiro entre bloques largos. Va más ancha que la columna
 * (40rem) porque a 34rem un cuerpo de 40 px deja renglones de doce palabras.
 */
function CitaDestacada({ children }: { children: ReactNode }) {
  return (
    <figure className="mx-auto my-16 max-w-[40rem] sm:my-24">
      <blockquote className="font-display text-subtitulo text-marino-tinta">
        {children}
      </blockquote>
    </figure>
  );
}

/**
 * QUIÉN SOY
 *
 * Es el texto más personal del sitio y está bien escrito, así que la página se
 * limita a ponerlo cómodo: una columna de 34rem, la utilidad `prosa` y aire
 * alrededor. Nada de tarjetas ni de rejillas — esto es un ensayo, no un perfil
 * corporativo.
 *
 * El único montaje es el corte: la biografía se parte donde deja de hablar de
 * ella y empieza a hablarle a quien lee. Esos tres últimos párrafos se van a la
 * banda de cierre, que es donde de verdad rematan.
 */
export default async function QuienSoy() {
  const { titular, biografia, trayectoria, formacion } = await getQuienSoy();
  const libros = await getLibros();

  // El ensayo termina en «una hechicera que deshace encantamientos»; lo que
  // sigue ya es una invitación directa a quien lee.
  const CIERRE_DESDE = 6;
  const ensayo = biografia.slice(0, CIERRE_DESDE);
  const invitacion = biografia.slice(CIERRE_DESDE);

  // El trazo manuscrito va bajo la última palabra del titular, sea cual sea:
  // partirlo aquí evita meter etiquetas HTML dentro del JSON de contenido.
  const palabras = titular.split(" ");
  const ultimaPalabra = palabras.pop() ?? titular;
  const entradaDelTitular = palabras.join(" ");

  const parrafosTrayectoria = trayectoria.parrafos.filter(
    (parrafo) => !parrafo.startsWith(ENUMERA_LIBROS),
  );
  const parrafoEnumeracion = trayectoria.parrafos.find((parrafo) =>
    parrafo.startsWith(ENUMERA_LIBROS),
  );
  const colaLibros = parrafoEnumeracion ? colaDeLaEnumeracion(parrafoEnumeracion) : null;

  return (
    <>
      {/* ---------------------------- Cabecera ---------------------------- */}
      {/*
        Todo centrado, y no el titular a un lado con el retrato al otro: debajo
        vienen ochocientas palabras en una columna centrada de 34rem, y una
        cabecera alineada al borde izquierdo del container abriría un eje
        distinto al del ensayo. Un texto largo se lee mejor con un solo eje.
      */}
      <Seccion fondo="papel" tamano="lg" conGrano>
        <div className="mx-auto max-w-[44rem] text-center">
          <p className="eyebrow opacity-50">Quién soy</p>
          <h1 className="mx-auto mt-6 max-w-[13ch] text-titular">
            {entradaDelTitular}{" "}
            <Subrayado variante="onda">
              <em>{ultimaPalabra}</em>
            </Subrayado>
          </h1>
          {/* La entradilla es una frase suya, literal, sacada del cuerpo del
              ensayo: es la tesis del texto y hace de sumario sin inventar nada. */}
          <p className="mx-auto mt-8 max-w-[30ch] font-display text-rotulo text-marino-suave">
            «Las historias me han cambiado la vida varias veces.»
          </p>
        </div>

        {/*
          EL RETRATO. Lo escribe el pipeline de imágenes en `public/retratos/` y
          todavía no está ahí, así que va como <img> normal y no como next/image:
          `/_next/image` responde 400 cuando el archivo no existe y deja un error
          en consola en cada recarga, mientras que un <img> contra un 404 solo
          deja el hueco y la página sigue entera. Por lo mismo el `srcSet` se
          escribe a mano — no hay nada que pueda medir un archivo que aún no se
          ha generado.

          La proporción 3/4 y el fondo de menta están en el <figure>, no en la
          imagen: así el bloque ocupa exactamente el mismo sitio antes y después
          de que exista el archivo, y mientras tanto se lee como un panel de
          color y no como una imagen rota.
        */}
        <figure className="panel mx-auto mt-16 aspect-[3/4] w-full max-w-[22rem] bg-menta-niebla shadow-panel sm:mt-20">
          {/* eslint-disable-next-line @next/next/no-img-element -- next/image
              necesita que el archivo exista para servir /_next/image; aquí
              todavía no existe. Ver el comentario de arriba. */}
          <img
            src="/retratos/retrato-quien-soy.webp"
            srcSet={
              "/retratos/retrato-quien-soy-640.webp 640w, " +
              "/retratos/retrato-quien-soy-960.webp 960w, " +
              "/retratos/retrato-quien-soy-1280.webp 1280w"
            }
            sizes="(min-width: 40rem) 22rem, 100vw"
            width={1536}
            height={2048}
            alt="Carolina Alonso C., sentada, sobre una pared de papel cálido"
            className="size-full object-cover"
          />
        </figure>
      </Seccion>

      {/* ----------------------------- El ensayo ---------------------------- */}
      <Seccion fondo="papel" tamano="md">
        <Columna className="mx-auto">
          <Prosa>
            {ensayo.slice(0, 2).map((parrafo) => (
              <p key={parrafo}>{parrafo}</p>
            ))}
          </Prosa>
        </Columna>

        <CitaDestacada>
          «Crecí en medio de muchas cosas no dichas; quizás por eso me importa tanto
          nombrar, contar, escuchar.»
        </CitaDestacada>

        <Columna className="mx-auto">
          <Prosa>
            {ensayo.slice(2).map((parrafo) => (
              <p key={parrafo}>{parrafo}</p>
            ))}
          </Prosa>
        </Columna>

        <CitaDestacada>
          «Mi labor ahora es la de una{" "}
          <Subrayado variante="doble">
            <em>hechicera</em>
          </Subrayado>{" "}
          que deshace encantamientos.»
        </CitaDestacada>
      </Seccion>

      {/* -------------------- Trayectoria y bibliografía -------------------- */}
      <Seccion fondo="menta-niebla" tamano="md">
        <Columna className="mx-auto">
          <Titulo eyebrow="Trabajo y formación" titulo={trayectoria.titular} tamano="md" />
          <Prosa>
            {parrafosTrayectoria.map((parrafo) => (
              <p key={parrafo}>{parrafo}</p>
            ))}
          </Prosa>

          <div className="mt-14">
            <h3 className="eyebrow opacity-50">Los libros publicados</h3>
            <ul className="mt-6 border-t border-marino/12">
              {libros.map((libro) => (
                <li key={libro.slug} className="border-b border-marino/12">
                  <Link
                    href={urlLibro(libro.slug)}
                    className="tactil group flex items-baseline justify-between gap-6 py-4 text-marino-tinta hover:text-azul"
                  >
                    <span className="font-display text-rotulo">
                      {libro.titulo}
                      {libro.editorial && (
                        <span className="text-nota font-sans text-marino-tenue">
                          {" "}
                          · {libro.editorial}
                        </span>
                      )}
                    </span>
                    <span className="cifras shrink-0 text-nota text-marino-tenue">
                      {anioLegible(libro.anio, libro.anioPorConfirmar)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {colaLibros && (
              <p className="mt-6 max-w-[52ch] text-cuerpo text-marino-suave">{colaLibros}</p>
            )}
          </div>
        </Columna>
      </Seccion>

      {/* ----------------------------- Formación ---------------------------- */}
      <Seccion fondo="papel" tamano="md">
        <Columna className="mx-auto">
          <Titulo eyebrow="Formación" titulo={formacion.titular} tamano="md" />
          <p className="max-w-[46ch] text-entradilla text-marino-suave">
            {formacion.academica}
          </p>

          <h3 className="eyebrow mt-14 opacity-50">Certificaciones</h3>
          <ul className="mt-6 border-t border-marino/12">
            {formacion.certificaciones.map((certificacion) => {
              const contenido = (
                <>
                  <span>
                    <span className="block font-display text-rotulo">{certificacion.titulo}</span>
                    <span className="block text-nota text-marino-tenue">
                      {certificacion.institucion}
                    </span>
                  </span>
                  {certificacion.url && (
                    <IconoFlechaDiagonal
                      className="mt-1 shrink-0 text-[1.125rem] text-marino-tenue transition-[color,transform] duration-300 ease-suave group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-azul"
                      aria-hidden
                    />
                  )}
                </>
              );

              return (
                <li
                  key={`${certificacion.titulo}-${certificacion.institucion}`}
                  className="border-b border-marino/12"
                >
                  {/* Enlaces externos reales: se abren aparte porque sacan a
                      quien lee del sitio, y `noreferrer` evita mandarles de
                      dónde viene. Una certificación sin URL sigue estando: se
                      pinta igual, sin flecha y sin enlace. */}
                  {certificacion.url ? (
                    <a
                      href={certificacion.url}
                      target="_blank"
                      rel="noreferrer"
                      className="tactil group flex items-start justify-between gap-6 py-4 text-marino-tinta hover:text-azul"
                    >
                      {contenido}
                    </a>
                  ) : (
                    <div className="flex items-start justify-between gap-6 py-4 text-marino-tinta">
                      {contenido}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Columna>
      </Seccion>

      {/* ------------------------------ Cierre ------------------------------ */}
      {/* Los últimos tres párrafos de la biografía ya no cuentan su historia:
          te hablan a ti. Por eso salen de la columna del ensayo y se convierten
          en la banda amarilla de despedida, en serif y a cuerpo grande. */}
      <Seccion fondo="amarillo-claro" tamano="lg" conGrano>
        <div className="mx-auto max-w-[40rem] space-y-8">
          {invitacion.map((parrafo) => (
            <p key={parrafo} className="font-display text-subtitulo text-marino">
              {parrafo}
            </p>
          ))}
        </div>
      </Seccion>
    </>
  );
}

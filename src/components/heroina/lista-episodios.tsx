import { IconoYoutube } from "@/components/ui/iconos";
import { etiquetaEpisodio, urlVideo } from "@/lib/datos";
import type { Episodio } from "@/types/contenido";

interface ListaEpisodiosProps {
  episodios: Episodio[];
}

/**
 * El ciclo de nueve vídeos sobre el libro, SIN incrustar YouTube.
 *
 * Ni un <iframe> ni una miniatura. El iframe metería el reproductor entero de
 * YouTube —cientos de kilobytes y rastreo de terceros— en una página cuyo
 * trabajo es que se lean nueve resúmenes; y la fachada de siempre, la miniatura
 * de `i.ytimg.com`, tampoco vale: `next.config.ts` deja `remotePatterns` vacío a
 * propósito para que `/_next/image` no pueda hacer de proxy abierto, así que no
 * hay ningún host remoto autorizado.
 *
 * Lo que queda es lo que de verdad hace falta: el número, el título, el resumen
 * y un enlace claro a YouTube. Se pinta en el servidor, pesa lo que pesa el
 * texto y funciona igual con el JavaScript caído.
 *
 * El orden 0 es el de introducción y no lleva número —de ahí que la etiqueta la
 * componga `etiquetaEpisodio()`—, pero en la cifra grande sí sale como «00»
 * para que la columna de números no baile.
 */
export function ListaEpisodios({ episodios }: ListaEpisodiosProps) {
  return (
    <ol className="border-t border-marino/12">
      {episodios.map((episodio) => (
        <li key={episodio.video} className="border-b border-marino/12">
          <article className="grid gap-4 py-9 sm:grid-cols-[4.5rem_1fr] sm:gap-8 sm:py-12">
            <div className="sm:pt-1">
              <p
                aria-hidden
                className="cifras font-display text-subtitulo leading-none text-marino-tenue"
              >
                {String(episodio.orden).padStart(2, "0")}
              </p>
            </div>

            <div>
              <p className="eyebrow text-marino-tenue">{etiquetaEpisodio(episodio.orden)}</p>
              <h3 className="mt-3 max-w-[26ch] text-rotulo text-marino-tinta">
                {episodio.titulo}
              </h3>
              <p className="mt-4 max-w-[62ch] text-cuerpo text-marino-suave">
                {episodio.resumen}
              </p>

              {/* El nombre accesible del enlace lleva el título del episodio:
                  quien navega con lector de pantalla saltando de enlace en
                  enlace se encontraría, si no, nueve «Ver en YouTube» iguales. */}
              <a
                href={urlVideo(episodio.video)}
                target="_blank"
                rel="noreferrer"
                className="tactil enlace mt-5 inline-flex min-h-11 items-start gap-2 font-medium text-azul hover:text-marino-tinta lg:min-h-0"
              >
                <IconoYoutube className="mt-[0.3em] shrink-0 text-[1.25rem]" />
                Ver en YouTube
                <span className="sr-only">: {episodio.titulo}</span>
              </a>
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}

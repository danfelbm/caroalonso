import { IconoFlechaDiagonal, IconoSpotify } from "@/components/ui/iconos";
import { formatearFecha } from "@/lib/datos";
import type { AparicionPrensa, TipoPrensa } from "@/types/contenido";

interface PrensaProps {
  apariciones: AparicionPrensa[];
}

const ETIQUETA: Record<TipoPrensa, string> = {
  radio: "Radio",
  audio: "Entrevista en audio",
  podcast: "Podcast",
};

/**
 * Audios que se sirven desde el propio sitio en vez de enlazarse fuera.
 *
 * Esta entrevista solo existía como un MP3 colgado en la biblioteca de
 * WordPress, que desaparece con la migración. El archivo está rescatado en
 * `arte/originales/audio/caracol-a-la-carta.mp3` y su copia en `public/audio/`
 * la pone el pipeline de arte: hasta que corra, el reproductor de abajo apunta
 * a un 404 y el navegador lo muestra vacío, sin romper nada de la página.
 */
const AUDIOS_PROPIOS: Record<string, string> = {
  "a-la-carta-caracol-bucaramanga": "/audio/caracol-a-la-carta.mp3",
};

/**
 * Las tres apariciones en prensa del libro.
 *
 * Dos son enlaces a donde vive la grabación; la tercera se escucha aquí mismo
 * porque su única copia es nuestra. `preload="none"` no es un detalle: son diez
 * megas y nadie que llegue a esta página los ha pedido todavía.
 */
export function Prensa({ apariciones }: PrensaProps) {
  return (
    <ul className="border-t border-marino/12">
      {apariciones.map((aparicion) => {
        const audioPropio = AUDIOS_PROPIOS[aparicion.slug];
        const esSpotify = aparicion.tipo === "podcast";

        return (
          <li key={aparicion.slug} className="border-b border-marino/12 py-9 sm:py-11">
            <p className="eyebrow text-marino-tenue">
              {aparicion.medio} · {ETIQUETA[aparicion.tipo]}
            </p>
            <h3 className="mt-3 max-w-[34ch] text-rotulo text-marino-tinta">
              {aparicion.titulo}
            </h3>
            <p className="cifras mt-2 text-nota text-marino-tenue">
              <time dateTime={aparicion.fecha}>{formatearFecha(aparicion.fecha)}</time>
            </p>

            {audioPropio ? (
              <audio
                controls
                preload="none"
                src={audioPropio}
                aria-label={`Escuchar: ${aparicion.titulo}`}
                className="mt-5 w-full max-w-[30rem]"
              >
                {/* Los navegadores que no saben de <audio> se llevan el enlace
                    de descarga, que es lo único que pueden hacer con el archivo. */}
                <a href={audioPropio}>Descargar el audio de la entrevista</a>
              </audio>
            ) : (
              <a
                href={aparicion.url}
                target="_blank"
                rel="noreferrer"
                className="tactil enlace mt-5 inline-flex min-h-11 items-start gap-2 font-medium text-azul hover:text-marino-tinta lg:min-h-0"
              >
                {/* `items-start` y el desplazamiento: a 375 px «Escuchar en
                    Sanamente, Caracol Radio» ocupa dos renglones, y centrado el
                    icono quedaría flotando entre los dos. */}
                {esSpotify ? (
                  <IconoSpotify className="mt-[0.3em] shrink-0 text-[1.25rem]" />
                ) : (
                  <IconoFlechaDiagonal className="mt-[0.35em] shrink-0 text-[1.125rem]" />
                )}
                Escuchar en {aparicion.medio}
                {/* Tres enlaces seguidos que empiezan igual se distinguen mal en
                    un lector de pantalla; el título los desempata. */}
                <span className="sr-only">: {aparicion.titulo}</span>
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

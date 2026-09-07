import type { CSSProperties } from "react";

import { IconoFlechaDiagonal } from "@/components/ui/iconos";
import { contraste } from "@/lib/color";
import { formatearFecha } from "@/lib/datos";
import { cn } from "@/lib/utils";
import type { Recomendacion, TipoRecomendacion } from "@/types/contenido";

/**
 * Una ficha de la pared de recomendaciones.
 *
 * Es la nota adhesiva de Lookback —papel de color, girada un grado, sombra
 * blanda— con la imagen montada encima como en la rejilla «It's all in the
 * details»: la portada flota sobre el color con aire alrededor, nunca recortada
 * y nunca estirada. Las siete imágenes que existen son recortes muy dispares
 * (una portada vertical de 1600×2416, una tira de 244×102 con solo el título),
 * así que `object-contain` es lo único que las trata bien a todas.
 */

/** El `tipo` del JSON, en la lengua de la página. */
const ETIQUETAS: Record<TipoRecomendacion, string> = {
  novela: "Novela",
  memorias: "Memorias",
  libro: "Libro",
  "libro-y-pelicula": "Libro y película",
  audiolibro: "Audiolibro",
  pelicula: "Película",
  // Sin tilde, como en la navegación del sitio: dos grafías del mismo nombre a
  // dos clics de distancia se leen como un descuido.
  podcast: "Podcast",
};

/**
 * Los giros de las notas. Una lista corta que se recorre con el índice: cada
 * ficha cae con una inclinación distinta de sus vecinas y el conjunto no se
 * repite de forma visible. Las clases van escritas enteras porque Tailwind lee
 * el código como texto y no resolvería `-rotate-[${x}deg]`.
 */
const GIROS = [
  "-rotate-[0.7deg]",
  "rotate-[0.5deg]",
  "-rotate-[0.35deg]",
  "rotate-[0.85deg]",
  "-rotate-[0.55deg]",
];

/**
 * Etiqueta honesta para el enlace que ella dejó dentro del texto.
 *
 * De los dos que hay, uno es una lista de Spotify y el otro el blog de la
 * autora. Nombrar el destino evita el «haz clic aquí» y avisa de a dónde va.
 */
function textoEnlace(url: string) {
  const anfitrion = new URL(url).hostname.replace(/^www\./, "");
  if (anfitrion.endsWith("spotify.com")) return "Escuchar la lista en Spotify";
  return `Ir a ${anfitrion}`;
}

interface FichaProps {
  recomendacion: Recomendacion;
  /** Posición en la rejilla; solo decide el giro de la nota. */
  indice: number;
}

export function Ficha({ recomendacion, indice }: FichaProps) {
  const { slug, tipo, titulo, autor, fecha, texto, enlace, color } = recomendacion;

  /*
   * `imagen` es `string` en el tipo pero `null` en «La brújula dorada»: esa
   * imagen se perdió del servidor de WordPress y ya no existe copia (ver
   * docs/por-confirmar.md). Se normaliza aquí, en la única vista que la pinta,
   * en vez de tocar `types/contenido.ts`, que comparte medio sitio.
   */
  const imagen: string | null = recomendacion.imagen ?? null;
  const etiqueta = ETIQUETAS[tipo];

  return (
    <article
      // El ancla de `urlRecomendacion()`. El `scroll-padding-top` del <html>
      // ya deja el hueco de la barra fija, así que no hace falta nada más.
      id={slug}
      style={
        {
          "--acento": color,
          "--acento-tinta": contraste(color).texto,
        } as CSSProperties
      }
      className={cn(
        "flex h-full flex-col rounded-panel bg-acento p-5 text-acento-tinta shadow-tarjeta sm:p-6",
        "transition-transform duration-300 ease-suave hover:rotate-0",
        GIROS[indice % GIROS.length],
      )}
    >
      {/* --------------------------- La portada --------------------------- */}
      {/* En móvil el bloque es más bajo que ancho: con la nota a todo el ancho
          de la pantalla, un cuadrado deja demasiado aire alrededor de los
          recortes pequeños y alarga la página sin dar nada a cambio. */}
      <div className="flex aspect-[5/4] items-center justify-center sm:aspect-square">
        {imagen ? (
          // `next/image` exige ancho y alto, y estas siete portadas tienen
          // siete proporciones distintas (de 0.66 a 2.39). El pipeline de arte
          // ya las deja en webp del tamaño justo, así que volver a optimizarlas
          // en tiempo de petición no añadiría nada.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            /*
             * `srcSet` con un único candidato y a mano, sin `next/image`: el
             * ancho que produce `assets:optimizar` depende del original, y dos
             * de estas siete miden menos de 300 px, así que escribir aquí un
             * `-300.webp` apuntaría a archivos que para ellas no existirán. El
             * nombre limpio sí lo genera siempre.
             *
             * Y si la carpeta todavía no está convertida, no se rompe nada:
             * `alt=""` deja el hueco en blanco sobre el color y el título y el
             * autor —que están debajo, en texto— siguen contando la ficha.
             */
            src={`/recomendaciones/${imagen}.webp`}
            srcSet={`/recomendaciones/${imagen}.webp`}
            sizes="(min-width: 64rem) 21rem, (min-width: 40rem) 42vw, 84vw"
            alt=""
            loading="lazy"
            decoding="async"
            className="max-h-full w-auto max-w-full rounded-[6px] object-contain shadow-tarjeta"
          />
        ) : (
          /*
           * LA FICHA SIN IMAGEN.
           *
           * «La brújula dorada» perdió su imagen y no hay de dónde sacarla. En
           * vez de un hueco roto o de un cartel de disculpa, el color de la
           * ficha se convierte en una portadilla compuesta: filete, título en
           * itálica y filete. Se lee como una decisión, que es lo que tiene que
           * parecer, y es la misma caja cuadrada que las otras siete, así que
           * la rejilla no se entera.
           */
          <p className="flex w-full flex-col items-center gap-5 px-2 text-center">
            <span aria-hidden className="h-px w-12 bg-current/25" />
            <span className="font-display text-subtitulo italic leading-[1.1]">{titulo}</span>
            <span aria-hidden className="h-px w-12 bg-current/25" />
          </p>
        )}
      </div>

      {/* ---------------------------- El texto ---------------------------- */}
      <p className="eyebrow mt-6 opacity-50">
        {etiqueta}
        <span aria-hidden> · </span>
        <span className="cifras">{formatearFecha(fecha, { month: "long", year: "numeric" })}</span>
      </p>

      <h2 className="mt-3 font-display text-rotulo">{titulo}</h2>
      {autor && <p className="mt-1 text-nota opacity-60">{autor}</p>}

      <p className="mt-4 text-cuerpo opacity-80">{texto}</p>

      {enlace && (
        // `mt-auto` lo pega al fondo: en una fila de notas de alturas distintas
        // los enlaces quedan alineados entre sí y no flotando a media altura.
        <p className="mt-auto pt-5">
          <a
            href={enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="tactil inline-flex min-h-11 items-center gap-2 text-nota font-semibold"
          >
            <span className="enlace">{textoEnlace(enlace)}</span>
            <IconoFlechaDiagonal aria-hidden className="text-[0.875rem] opacity-55" />
            <span className="sr-only">, se abre en otra pestaña</span>
          </a>
        </p>
      )}
    </article>
  );
}

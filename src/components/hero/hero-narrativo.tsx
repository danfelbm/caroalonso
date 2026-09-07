"use client";

import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import hero from "@/data/hero.json";
import { ACTOS, INDICADOR, VELO, VELO_QUIETO } from "@/components/hero/actos";
import { Boton } from "@/components/layout/boton";
import {
  useAhorroDeDatos,
  useDespuesDelPintado,
  useMediaQuery,
} from "@/hooks/navegador";

/**
 * Rutas y datos del video, desde el manifiesto que escribe
 * `scripts/5-hero-recodificar.mjs`. Los nombres llevan una huella del
 * contenido: los archivos del hero se sirven con caché de un año e `immutable`,
 * así que sobrescribirlos no bastaría para que un navegador se enterara del
 * cambio.
 */
const DURACION = hero.duracion;

/**
 * Quien pide menos movimiento no recorre nada: ve una sola pantalla quieta.
 *
 * Se consulta con el `useMediaQuery` de la casa y no con el `useReducedMotion`
 * de motion, que por dentro es un `useState` dentro de un efecto: en el
 * servidor da `false`, así que el HTML sale con el hero animado, el cliente lo
 * cambia al quieto y React se queja de que el árbol no coincide. Con
 * `useSyncExternalStore` el valor del servidor es explícito y React sabe que
 * puede cambiar al hidratar, así que vuelve a renderizar sin protestar.
 */
const MENOS_MOVIMIENTO = "(prefers-reduced-motion: reduce)";

/**
 * Hero narrativo «Coordenadas del alma».
 *
 * El contenedor mide dos pantallas y media y el hero queda pegado arriba
 * mientras se recorren. El progreso del scroll mueve dos capas a la vez: el
 * cuadro del video y los cuatro textos.
 *
 * El video no se reproduce nunca: se le pide un cuadro concreto asignando
 * `currentTime` en cada fotograma de animación. Por eso está recodificado con
 * todos los cuadros como keyframe (ver `scripts/5-hero-recodificar.mjs`); sin
 * eso, cada salto obliga al decodificador a reconstruir desde el keyframe
 * anterior y en Safari de iOS se ve como un tirón.
 */
export function HeroNarrativo() {
  const contenedor = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: contenedor,
    offset: ["start start", "end end"],
  });

  // `null` mientras se renderiza en el servidor: ahí se asume el hero completo.
  const menosMovimiento = useMediaQuery(MENOS_MOVIMIENTO) === true;

  return (
    <section
      ref={contenedor}
      /*
       * Dos pantallas y media de recorrido para los cuatro actos. Con cuatro, la
       * narrativa avanza tan poco por vuelta de rueda que el hero se siente
       * pesado: no es el peso del video, sino cuánto hay que empujar para que
       * pase algo.
       *
       * Sin movimiento no hay actos que recorrer, así que ocupa una sola
       * pantalla: dejarlo largo obligaría a atravesar imagen fija para llegar al
       * contenido.
       */
      className={menosMovimiento ? "relative h-svh" : "relative h-[250svh]"}
      aria-label="Presentación de Carolina Alonso"
    >
      <div className="sticky top-0 h-svh overflow-hidden bg-marino">
        {menosMovimiento ? <FondoQuieto /> : <Video progreso={scrollYProgress} />}

        <Velo progreso={scrollYProgress} quieto={menosMovimiento} />

        <Actos progreso={scrollYProgress} quieto={menosMovimiento} />

        {!menosMovimiento && <Indicador progreso={scrollYProgress} />}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- velo */

/**
 * Vela el video lo justo para que el texto se lea encima. La curva y el porqué
 * de que baje hacia el final están en `actos.ts`, junto a los actos que sostiene.
 */
function Velo({
  progreso,
  quieto,
}: {
  progreso: MotionValue<number>;
  quieto: boolean;
}) {
  const intensidad = useTransform(progreso, VELO.entrada, VELO.opacidad);

  return (
    <motion.div
      className="absolute inset-0 z-0 bg-black"
      style={{ opacity: quieto ? VELO_QUIETO : intensidad }}
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------- video */

/**
 * A partir de aquí se sirve el corte de escritorio, que pesa el doble que el
 * vertical. El umbral está en 1024 y no en 768 a propósito: por debajo de eso el
 * ancho de pantalla no da para apreciarlo y el archivo sería un peaje sin
 * contrapartida.
 *
 * El mismo umbral decide el corte del póster en `<Fondo>`, unas líneas más
 * abajo. Si cambia aquí, tiene que cambiar allí.
 */
const ESCRITORIO = "(min-width: 1024px)";

function Video({ progreso }: { progreso: MotionValue<number> }) {
  const video = useRef<HTMLVideoElement>(null);
  const [listo, setListo] = useState(false);
  const objetivo = useRef(0);
  const actual = useRef(0);

  const enEscritorio = useMediaQuery(ESCRITORIO);
  const ahorrandoDatos = useAhorroDeDatos();
  const pintado = useDespuesDelPintado();

  /**
   * La fuente se decide aquí y no con `<source media>`: dentro de un `<video>`
   * ese atributo no es fiable —los navegadores lo ignoran y se quedan con el
   * primero—, así que en un móvil se acabaría bajando el corte de escritorio.
   *
   * Queda en `null` hasta que la página terminó de pintar, mientras se renderiza
   * en el servidor y cuando el navegador pide ahorrar datos. En todos esos casos
   * el hero se queda en el póster, que ya cuenta la primera escena: no se
   * descarga ni un byte de video.
   */
  const fuente =
    !pintado || enEscritorio === null || ahorrandoDatos
      ? null
      : enEscritorio
        ? hero.videoEscritorio
        : hero.videoMovil;

  /**
   * El video se muestra en cuanto hay un cuadro que enseñar.
   *
   * Esperar a tenerlo entero fue un error que costó caro en el proyecto
   * hermano: con el servidor dando unos 150 KB/s, el hero se quedaba en el
   * póster medio minuto y el scroll no movía nada —ni un error en consola, solo
   * una imagen quieta—, así que la única salida era recargar y esperar de nuevo.
   *
   * Se usa `readyState >= 2` y no `canplaythrough`: ese evento promete
   * reproducción entera sin pausas y en 4G el navegador no se compromete, así
   * que no se dispara nunca y el video queda invisible para siempre.
   *
   * Mostrarlo pronto sería peligroso mientras se le piden cuadros que aún no
   * han llegado. No lo es: la persecución de abajo no pasa nunca del final de lo
   * descargado, y el recorrido se estira solo conforme baja el resto.
   */
  const revisarListo = () => {
    const elemento = video.current;
    if (elemento && elemento.readyState >= 2) setListo(true);
  };

  /**
   * Empuja al navegador a descargar el video de verdad.
   *
   * Safari en iOS trata `preload="auto"` como `metadata` cuando la conexión es
   * de datos: se queda con la cabecera del archivo y no baja un solo cuadro
   * hasta que alguien llama a `play()`. Como el hero nunca reproduce —solo pide
   * cuadros sueltos—, ese momento no llegaría nunca y en el móvil solo se vería
   * el póster. Reproducir y pausar de inmediato desbloquea la descarga sin que
   * se vea moverse nada.
   *
   * Va sin gesto del usuario porque el elemento es `muted` y `playsInline`, que
   * es justo lo que iOS exige para permitirlo. Si aun así lo rechaza, se ignora:
   * el póster ya cuenta la primera escena.
   */
  useEffect(() => {
    const elemento = video.current;
    if (!elemento) return;

    const empujar = () => {
      const promesa = elemento.play();
      if (promesa) {
        promesa
          .then(() => elemento.pause())
          .catch(() => {
            /* El navegador no lo permite; nos quedamos con el póster. */
          });
      }
    };

    if (elemento.readyState >= 1) empujar();
    else elemento.addEventListener("loadedmetadata", empujar, { once: true });

    return () => elemento.removeEventListener("loadedmetadata", empujar);
  }, [fuente]);

  /**
   * Persigue con el video el cuadro que le toca al scroll.
   *
   * La clave está en **no pedir un salto mientras hay otro en curso**. Asignar
   * `currentTime` en cada fotograma de animación parece lo natural, pero el
   * decodificador no termina a tiempo y las peticiones se encolan: cada una
   * llega tarde, el video se queda atrás y el hero entero se siente pesado.
   * Cuanto más grande el archivo, peor.
   *
   * Aquí solo se pide un cuadro nuevo cuando el anterior ya se pintó. El video
   * avanza tan rápido como el decodificador dé, y el scroll nunca se traba
   * esperándolo.
   */
  useEffect(() => {
    if (!listo) return;

    const elemento = video.current;
    if (!elemento) return;

    let vivo = true;
    let buscando = false;

    /**
     * Hasta dónde ha llegado la descarga.
     *
     * El video se pide de principio a fin y llega en ese mismo orden, así que el
     * primer tramo del buffer es el único que cuenta. El margen que se le resta
     * evita pedir justo el borde, que todavía puede no ser decodificable.
     */
    const descargado = () =>
      elemento.buffered.length ? Math.max(elemento.buffered.end(0) - 0.1, 0) : 0;

    const pedirCuadro = () => {
      if (!vivo || buscando) return;

      // Suavizado ligero: lima los saltos del scroll sin añadir inercia visible.
      actual.current += (objetivo.current - actual.current) * 0.45;

      /*
       * Nunca más allá de lo descargado. Pedir un cuadro que no ha llegado no lo
       * trae antes: encola una búsqueda que tarda lo que tarde la red, y con
       * varias encoladas el video acaba segundos por detrás del scroll. Con el
       * tope, mientras el archivo baja el recorrido se queda corto —el video se
       * detiene donde alcanzó— y se pone al día solo, sin arrastrar nada.
       */
      const cuadro = Math.min(actual.current, descargado());
      if (Math.abs(cuadro - elemento.currentTime) < 0.008) return;

      buscando = true;
      elemento.currentTime = cuadro;
    };

    const alTerminar = () => {
      buscando = false;
      pedirCuadro();
    };

    elemento.addEventListener("seeked", alTerminar);

    // Un latido por fotograma reanuda la persecución cuando el scroll se mueve
    // sin que hubiera ningún salto pendiente.
    let animacion = requestAnimationFrame(function latido() {
      pedirCuadro();
      if (vivo) animacion = requestAnimationFrame(latido);
    });

    return () => {
      vivo = false;
      cancelAnimationFrame(animacion);
      elemento.removeEventListener("seeked", alTerminar);
    };
  }, [listo]);

  // El 0,999 evita pedir el último cuadro exacto: algunos decodificadores
  // devuelven ahí el evento `seeked` con retraso, al quedarse sin nada detrás.
  useMotionValueEvent(progreso, "change", (valor) => {
    objetivo.current = Math.min(valor, 0.999) * DURACION;
  });

  return (
    <>
      {/* El póster es el LCP: se pinta de inmediato mientras el MP4 baja. */}
      <Fondo
        movil={hero.posterMovil}
        escritorio={hero.posterEscritorio}
        alt=""
        className={listo ? "opacity-0" : "opacity-100"}
      />

      {fuente && (
        <video
          ref={video}
          src={fuente}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            listo ? "opacity-100" : "opacity-0"
          }`}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          onLoadedData={revisarListo}
          // Red de seguridad: si `loadeddata` se pierde —pasa cuando el elemento
          // se monta con datos ya en caché—, el primer `progress` lo recoge.
          onProgress={revisarListo}
        />
      )}
    </>
  );
}

function FondoQuieto() {
  return (
    <Fondo
      movil={hero.quietoMovil}
      escritorio={hero.quietoEscritorio}
      alt="El mar al amanecer, con el cielo abierto en rosa y dorado sobre el horizonte."
    />
  );
}

/**
 * Imagen de fondo a sangre, con corte distinto según el ancho. Va con `<img>` y
 * no con `next/image` a propósito: es el elemento de mayor contenido visible de
 * la página, los WebP ya salen dimensionados y optimizados de
 * `scripts/5-hero-recodificar.mjs`, y aquí interesa controlar el LCP a mano.
 */
function Fondo({
  movil,
  escritorio,
  alt,
  className = "",
}: {
  movil: string;
  escritorio: string;
  alt: string;
  className?: string;
}) {
  return (
    <picture>
      <source media={ESCRITORIO} srcSet={escritorio} />
      <img
        src={movil}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${className}`}
        fetchPriority="high"
        decoding="async"
      />
    </picture>
  );
}

/* ------------------------------------------------------------------ textos */

/**
 * Los textos de los actos, aparte de la animación que los mueve: el primero y
 * el cuarto se usan también en los caminos sin scroll —menos movimiento y sin
 * JavaScript—, y así hay una sola versión de cada frase.
 */
function Titular() {
  return (
    <>
      <p className="eyebrow text-papel/80">Carolina Alonso C.</p>
      <h1 className="mt-4 text-balance font-display text-5xl leading-[1.05] text-papel sm:text-7xl">
        ¿Perdiste tu norte?
      </h1>
    </>
  );
}

function Identidad({ compacto = false }: { compacto?: boolean }) {
  return (
    <>
      <p
        className={
          compacto
            ? "eyebrow text-papel/80"
            : "font-display text-2xl text-papel sm:text-3xl"
        }
      >
        Escritora, filósofa y coach
      </p>
      {/*
       * Los botones son los del sistema de diseño y no una versión propia: son
       * la única salida del hero y tienen que verse y comportarse como los del
       * resto del sitio. `borde` toma el color de donde cae, así que sobre la
       * placa marino hay que decirle que es claro.
       */}
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <Boton href="/quien-soy" variante="menta" tamano="lg" className="w-full sm:w-auto">
          Conóceme
          <span aria-hidden="true">→</span>
        </Boton>
        <Boton
          href="/libros"
          variante="borde"
          tamano="lg"
          className="w-full text-papel sm:w-auto"
        >
          Mis libros
        </Boton>
      </div>
    </>
  );
}

/** El fondo local que sostiene el texto cuando la imagen de detrás es clara. */
function Placa({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm bg-marino/85 px-6 py-8 backdrop-blur-[3px] sm:px-10 sm:py-11">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- actos */

function Actos({
  progreso,
  quieto,
}: {
  progreso: MotionValue<number>;
  quieto: boolean;
}) {
  /*
   * Sin movimiento no hay recorrido que valga: se muestra el último acto, que es
   * el que lleva los botones y por tanto la única salida del hero.
   *
   * Con él va el titular, que es el `<h1>` de la portada: dejarlo fuera
   * ahorraría un acto y dejaría la página sin encabezado para quien pide menos
   * movimiento, que es peor que cualquier animación de más.
   */
  if (quieto) {
    return (
      <div className="absolute inset-0 z-20 grid place-items-center px-6">
        <div className="w-full max-w-[20rem] text-center sm:max-w-xl md:max-w-2xl">
          <Placa>
            <Titular />
            <div className="mt-8">
              <Identidad compacto />
            </div>
          </Placa>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 grid place-items-center px-6">
      {/*
       * Los cuatro actos se apilan en la MISMA celda de la rejilla y se centran
       * con `place-items`, sin `translate` de por medio: si la clase de centrado
       * moviera el elemento en porcentajes, motion tendría que mezclar esos
       * porcentajes con los píxeles de `y` y el resultado salta.
       */}
      <div className="grid w-full max-w-[20rem] place-items-center text-center sm:max-w-xl md:max-w-2xl [grid-template-areas:'acto']">
        <Acto progreso={progreso} indice={0}>
          <Titular />
        </Acto>

        <Acto progreso={progreso} indice={1}>
          <p className="text-balance font-display text-3xl leading-tight text-papel sm:text-5xl">
            Tienes un sistema de navegación interno.
          </p>
        </Acto>

        <Acto progreso={progreso} indice={2}>
          <p className="text-balance font-display text-3xl leading-snug text-papel italic sm:text-5xl">
            Recupera la conexión y el gozo.
          </p>
        </Acto>

        <Acto progreso={progreso} indice={3}>
          <Identidad />
        </Acto>
      </div>

      <SinJavaScript />
    </div>
  );
}

function Acto({
  progreso,
  indice,
  children,
}: {
  progreso: MotionValue<number>;
  indice: number;
  children: React.ReactNode;
}) {
  const acto = ACTOS[indice];

  const opacidad = useTransform(progreso, acto.entrada, acto.opacidad);
  const y = useTransform(progreso, acto.entrada, acto.y);

  /*
   * `visibility` acompaña a la opacidad porque un elemento transparente sigue
   * estando ahí para todo lo que no son los ojos: sus enlaces reciben el foco al
   * tabular y un lector de pantalla lee los cuatro actos de corrido, sin que
   * nada indique que solo uno está a la vista. Se deriva de la opacidad en vez
   * de guardarse en estado para que motion lo escriba en el DOM sin volver a
   * renderizar en cada fotograma.
   */
  const visibilidad = useTransform(opacidad, (valor) =>
    valor > 0.01 ? "visible" : "hidden",
  );

  return (
    <motion.div
      className="w-full"
      style={{ opacity: opacidad, y, visibility: visibilidad, gridArea: "acto" }}
    >
      {acto.placa ? <Placa>{children}</Placa> : children}
    </motion.div>
  );
}

/**
 * La salida del hero cuando no hay JavaScript.
 *
 * Sin él, el póster y el titular se ven igual —son HTML del servidor—, pero los
 * actos se quedan donde los dejó el render: el cuarto, que es el que lleva los
 * botones, con opacidad 0. Sin esto, el hero sería una imagen bonita y un
 * callejón sin salida.
 *
 * Va con `@media (scripting: none)` y no con `<noscript>` porque el contenido de
 * un `<noscript>` se parsea como texto cuando sí hay JavaScript, y React tiene
 * que hidratarlo. Donde la consulta no exista, el bloque simplemente no aparece
 * y no rompe nada.
 */
function SinJavaScript() {
  return (
    <div className="absolute inset-x-0 bottom-8 z-30 hidden justify-center px-6 [@media(scripting:none)]:flex">
      <div className="w-full max-w-[20rem] rounded-sm bg-marino/85 px-6 py-6 text-center backdrop-blur-[3px] sm:max-w-md">
        <Identidad compacto />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- indicador */

function Indicador({ progreso }: { progreso: MotionValue<number> }) {
  const opacidad = useTransform(progreso, INDICADOR.entrada, INDICADOR.opacidad);

  return (
    <motion.div
      style={{ opacity: opacidad }}
      // Sin JavaScript no hay nada que desplazar y el sitio de abajo lo ocupa
      // el bloque de salida.
      className="absolute inset-x-0 bottom-8 z-20 flex flex-col items-center gap-2 [@media(scripting:none)]:hidden"
      aria-hidden="true"
    >
      <span className="eyebrow text-papel/75">Desplaza</span>
      <span className="h-8 w-px bg-gradient-to-b from-papel/75 to-transparent" />
    </motion.div>
  );
}

"use client";

import { useState, type ReactNode } from "react";

import { Boton } from "@/components/layout/boton";
import { IconoFlechaDiagonal } from "@/components/ui/iconos";
import { cn } from "@/lib/utils";

/**
 * FACHADA. El `<iframe>` no existe hasta que alguien lo pide.
 *
 * Un reproductor incrustado de Spotify arrastra el JavaScript de un tercero,
 * sus cookies y su medición a cada visita de la página, la escuche alguien o
 * no. Aquí, mientras nadie pulse, solo hay un bloque de color pintado por el
 * servidor: cero peticiones a open.spotify.com y cero permisos que abrirle a
 * nadie en la política de seguridad para quien nunca le dio al play.
 *
 * Y si el navegador no ejecuta JavaScript, el botón no hace nada pero el enlace
 * alterno sigue ahí y lleva al programa. La fachada nunca es un callejón.
 *
 * `"use client"` es por una sola cosa: recordar si ya se pulsó.
 */

interface EnlaceAlterno {
  url: string;
  texto: string;
}

interface IncrustacionDiferidaProps {
  /** La dirección del incrustado. No se pide hasta el clic. */
  src: string;
  /** El `title` del iframe: es su nombre accesible, no un adorno. */
  tituloIncrustado: string;
  eyebrow?: string;
  encabezado: string;
  descripcion: string;
  textoBoton: string;
  /** Por qué el bloque está apagado. Se lee antes de pulsar, no después. */
  nota?: string;
  /** La salida que funciona sin JavaScript. */
  enlaceAlterno?: EnlaceAlterno;
  /**
   * Pieza decorativa a la derecha, solo en pantalla ancha. La fachada ocupa el
   * ancho que va a ocupar el reproductor, y ese ancho con tres líneas de texto
   * dentro se ve vacío; esto lo llena sin decir nada que haya que leer.
   */
  adorno?: ReactNode;
  /** Alto del reproductor montado. 352 px es el del programa en Spotify. */
  alto?: number;
  className?: string;
}

export function IncrustacionDiferida({
  src,
  tituloIncrustado,
  eyebrow,
  encabezado,
  descripcion,
  textoBoton,
  nota,
  enlaceAlterno,
  adorno,
  alto = 352,
  className,
}: IncrustacionDiferidaProps) {
  /*
   * Un booleano que solo este componente escribe y solo este componente lee.
   * No hay nada del navegador que consultar, así que no hay suscripción ni
   * efecto: `useState` es exactamente la herramienta.
   */
  const [montado, setMontado] = useState(false);

  return (
    <div className={cn("panel bg-marino text-papel", className)}>
      {montado ? (
        <iframe
          src={src}
          title={tituloIncrustado}
          height={alto}
          // El incrustado de Spotify pide justo esto para sonar y para que el
          // botón de compartir copie el enlace.
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="block w-full border-0"
          style={{ height: alto }}
        />
      ) : (
        <div
          className="relative flex flex-col justify-center gap-6 p-7 sm:p-10"
          style={{ minHeight: alto }}
        >
          {adorno && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 items-center justify-center text-papel/8 lg:flex"
            >
              {adorno}
            </div>
          )}

          <div className="relative">
            {eyebrow && <p className="eyebrow text-papel/45">{eyebrow}</p>}
            <p className="mt-4 max-w-[18ch] font-display text-subtitulo">{encabezado}</p>
            <p className="mt-4 max-w-[52ch] text-cuerpo text-papel/70">{descripcion}</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Boton variante="menta" onClick={() => setMontado(true)}>
              {textoBoton}
            </Boton>

            {enlaceAlterno && (
              <a
                href={enlaceAlterno.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tactil inline-flex min-h-11 items-center gap-2 text-cuerpo text-papel/75 hover:text-papel"
              >
                <span className="enlace">{enlaceAlterno.texto}</span>
                <IconoFlechaDiagonal aria-hidden className="text-[0.875rem] opacity-60" />
                <span className="sr-only">, se abre en otra pestaña</span>
              </a>
            )}
          </div>

          {nota && <p className="max-w-[52ch] text-nota text-papel/45">{nota}</p>}
        </div>
      )}
    </div>
  );
}

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variante = "onda" | "recto" | "doble";

interface Trazo {
  d: string;
  /** El segundo trazo de `doble` entra un pelo después: dos pasadas de rotulador. */
  retardo?: string;
}

/**
 * Trazos dibujados a mano alzada y luego pasados a curvas. Ninguno es
 * simétrico ni acaba donde empieza: la irregularidad es todo el efecto.
 * El viewBox es 200x12 y se estira sin conservar proporción, así que la
 * anchura real de la palabra da igual.
 */
const TRAZOS: Record<Variante, Trazo[]> = {
  onda: [
    { d: "M2 8.6c16 3.4 33 3.9 50 1.5 17-2.4 34-2.8 50-1.2 16 1.6 32 2 48-.9 12-2.2 24-2.4 48-.6" },
  ],
  recto: [{ d: "M3 8.2c32-1.1 65-1.6 98-1.5 33 .1 65 .6 96 1.7" }],
  doble: [
    { d: "M4 7.4c31-1.4 63-2 96-1.8 32 .2 63 .8 94 1.9" },
    { d: "M8 11.2c30-1 61-1.4 92-1.2 30 .2 59 .7 88 1.5", retardo: "0.16s" },
  ],
};

/**
 * Grosor en unidades del viewBox, no en px. El SVG mide 0.3em de alto y el
 * viewBox 12, así que el trazo se ve a `grosor × 0.3em / 12` — es decir, crece
 * con el cuerpo de letra sin tener que tocar nada. Dos pasadas finas gastan la
 * misma tinta que una gruesa.
 */
const GROSOR: Record<Variante, number> = {
  onda: 2,
  recto: 2,
  doble: 1.5,
};

interface SubrayadoProps {
  children: ReactNode;
  variante?: Variante;
  /** Cualquier color CSS; por defecto el azul del rotulador. */
  color?: string;
  className?: string;
}

/**
 * La firma visual del sitio: la palabra en itálica del titular con un trazo
 * de rotulador debajo, como en Lookback. Cero JavaScript — el trazo se dibuja
 * con `stroke-dashoffset` y, donde el navegador lo soporta, atado al scroll
 * mediante `animation-timeline: view()` (ver `trazo-manuscrito` en
 * globals.css). `pathLength={1}` normaliza la longitud de la curva a 1, así
 * que el dasharray no depende de la geometría de cada trazo.
 *
 * Ojo al escribir el titular: el envoltorio es `inline-block`, así que cuenta
 * como una pieza indivisible al partir las líneas. Si detrás va una coma
 * suelta, puede quedarse huérfana al principio del renglón siguiente — mete
 * la puntuación DENTRO del componente (`<Subrayado>palabra,</Subrayado>`),
 * que además es como cae el trazo en Lookback.
 */
export function Subrayado({
  children,
  variante = "onda",
  color = "var(--color-azul)",
  className,
}: SubrayadoProps) {
  return (
    <span className={cn("relative inline-block whitespace-nowrap", className)}>
      {children}
      <svg
        aria-hidden
        viewBox="0 0 200 12"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 top-[calc(100%-0.09em)] h-[max(0.3em,7px)] w-full overflow-visible"
        style={{ color } as CSSProperties}
      >
        {TRAZOS[variante].map((trazo) => (
          <path
            key={trazo.d}
            d={trazo.d}
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth={GROSOR[variante]}
            /* Nada de `vector-effect: non-scaling-stroke`: al sacar el trazo del
               espacio del viewBox, el navegador calcula también el dasharray en
               píxeles de pantalla y `pathLength={1}` deja de significar "toda la
               curva" — el trazo sale punteado en vez de dibujándose. */
            className="trazo-manuscrito"
            style={{ animationDelay: trazo.retardo }}
          />
        ))}
      </svg>
    </span>
  );
}

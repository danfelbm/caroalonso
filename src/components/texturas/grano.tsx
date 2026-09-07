import { cn } from "@/lib/utils";

interface GranoProps {
  /** Entre 0.25 y 0.55; por encima el ruido deja de leerse como papel. */
  opacidad?: number;
  className?: string;
}

/**
 * Capa de grano suelta, para meterla dentro de un contenedor que ya sea
 * `relative` (una portada, un panel, una foto). Cuando lo que se quiere es
 * granular una sección entera, es más barato la clase `grano`, que pinta el
 * ruido en un ::after y no añade un nodo al DOM.
 */
export function Grano({ opacidad = 0.4, className }: GranoProps) {
  return (
    <div
      aria-hidden
      className={cn("textura-grano pointer-events-none absolute inset-0", className)}
      style={{ opacity: opacidad }}
    />
  );
}

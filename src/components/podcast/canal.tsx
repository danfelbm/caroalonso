import { IconoFlechaDiagonal, IconoYoutube } from "@/components/ui/iconos";
import type { CanalYouTube } from "@/types/contenido";

/**
 * Un canal de YouTube, como tarjeta enlazable.
 *
 * La página los pide con `getCanalesEnlazables()`, que ya deja fuera el que no
 * tiene dirección. La guarda de abajo es el cinturón: el tipo permite `null` y
 * un canal sin destino no debe llegar nunca a pintarse como si lo tuviera.
 */
export function Canal({ canal }: { canal: CanalYouTube }) {
  if (!canal.url) return null;

  return (
    <a
      href={canal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="tactil group flex h-full flex-col rounded-panel bg-papel p-7 shadow-tarjeta hover:shadow-panel sm:p-8"
    >
      <IconoYoutube aria-hidden className="text-[1.75rem] text-marino-tenue transition-colors group-hover:text-azul" />

      <p className="mt-6 font-display text-rotulo">{canal.nombre}</p>
      <p className="mt-3 text-cuerpo text-marino-suave">{canal.descripcion}</p>

      <span className="mt-auto inline-flex items-center gap-2 pt-6 text-nota font-semibold">
        <span className="enlace">Ver el canal</span>
        <IconoFlechaDiagonal aria-hidden className="text-[0.875rem] opacity-55" />
        <span className="sr-only">, se abre en otra pestaña</span>
      </span>
    </a>
  );
}

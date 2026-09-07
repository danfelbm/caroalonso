import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Une clases y deja ganar a la última cuando dos compiten por la misma
 * propiedad. Vive aquí, dentro del sistema de diseño, para que los
 * componentes de esta carpeta no dependan de nada de fuera; si `@/lib/utils`
 * termina exportando el mismo `cn`, basta con cambiar el import.
 */
export function cn(...clases: ClassValue[]) {
  return twMerge(clsx(clases));
}

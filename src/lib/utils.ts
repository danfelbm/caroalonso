import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Junta clases condicionales y deja que la última utilidad de Tailwind gane.
 *
 * Sin `twMerge`, un `className` que llega por props no puede sobrescribir el
 * estilo por defecto de un componente: las dos clases acaban en el atributo y
 * decide el orden del CSS, no el de la llamada.
 */
export function cn(...clases: ClassValue[]) {
  return twMerge(clsx(clases));
}

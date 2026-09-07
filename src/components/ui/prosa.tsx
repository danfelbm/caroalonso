import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Bloque de lectura larga: biografías, sinopsis, artículos. Todo el ritmo
 * (interlínea, márgenes en em, citas, listas, enlaces) está en la utilidad
 * `prosa` de globals.css, para que sirva igual con contenido escrito a mano
 * en JSX que con HTML que venga de fuera.
 */
export function Prosa({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("prosa", className)} {...props}>
      {children}
    </div>
  );
}

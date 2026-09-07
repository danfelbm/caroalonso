"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MenuHoja } from "@/components/layout/menu-hoja";
import { esActiva, pestanas, type Menu } from "@/components/layout/navegacion";
import { cn } from "@/lib/utils";

/**
 * LA BARRA DE PESTAÑAS. Es la pieza que convierte el sitio en una app.
 *
 * Cinco destinos con icono y etiqueta corta, más un sexto que abre la hoja del
 * menú con todo lo demás. Fija abajo, translúcida sobre lo que pasa por debajo
 * y con el hueco del notch reservado. Desaparece entera desde `lg`, donde la
 * navegación vuelve a la píldora de arriba.
 *
 * POR QUÉ ABAJO Y NO ARRIBA. En un teléfono el pulgar llega al tercio inferior
 * de la pantalla y no al superior. Una barra de navegación arriba obliga a
 * recolocar la mano en cada salto; abajo, cambiar de sección cuesta un gesto.
 * Es la razón por la que ninguna app nativa pone su navegación principal
 * arriba, y era exactamente lo que aquí faltaba.
 *
 * ES DE CLIENTE POR UNA SOLA COSA: `usePathname`, para saber qué pestaña
 * encender. El menú que abre «Más» ya lo era.
 *
 * El alto que ocupa está en `--alto-pestanas` (globals.css) y es lo que el pie
 * reserva con `pb-pestanas`. Si aquí cambia el `pt-1.5` o el `min-h-12`,
 * cambia allí también.
 */
export function BarraInferior({ menu }: { menu: Menu }) {
  const pathname = usePathname();
  const destinos = pestanas(menu.principal);

  return (
    <nav
      aria-label="Secciones"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 lg:hidden",
        // Translúcida con desenfoque, como la píldora de arriba: el contenido
        // se intuye al pasar por debajo y la barra flota en vez de tapar.
        "border-t border-marino/8 bg-papel/85 backdrop-blur-xl",
      )}
    >
      {/*
        Columnas iguales, y `grid` en vez de `flex` para que las etiquetas —de
        «Inicio» a «Reconexión»— no repartan el ancho según lo que midan y las
        pestañas bailen de página en página.

        El número de columnas va en un `style` y no en un `grid-cols-6`: los
        destinos salen de `getSitio()`, así que el día que el sitio gane o
        pierda uno la barra se reparte sola. Con la clase fija, un sexto destino
        haría saltar de fila a «Más» y una barra de dos pisos no la ve nadie
        hasta que ya está publicada. Tailwind no puede generar la clase porque
        lee el código como texto y nunca vería `grid-cols-${n}`.
      */}
      <ul
        className="grid pb-safe pt-1.5"
        style={{ gridTemplateColumns: `repeat(${destinos.length + 1}, minmax(0, 1fr))` }}
      >
        {destinos.map((destino) => {
          const activa = esActiva(destino.ruta, pathname);
          const Icono = destino.icono;
          return (
            <li key={destino.ruta}>
              <Link
                href={destino.ruta}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "tactil flex min-h-12 flex-col items-center justify-center gap-1 rounded-panel px-0.5 text-[0.6875rem] leading-none font-medium",
                  activa ? "text-marino" : "text-marino-tenue",
                )}
              >
                {/*
                  La píldora de fondo va en este span y no en el enlace entero:
                  marca el icono, que es donde el ojo aterriza, y deja la
                  etiqueta suelta debajo. Con el enlace entero pintado, seis
                  cápsulas pegadas se leerían como una fila de botones y no como
                  una barra de pestañas.
                */}
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-pildora transition-colors duration-200 ease-suave",
                    activa && "bg-menta",
                  )}
                >
                  <Icono className="text-[1.3125rem]" />
                </span>
                {/* La etiqueta corta, y la larga para quien lee la pantalla:
                    «Heroína» a secas no dice a dónde lleva. */}
                <span aria-hidden>{destino.corta}</span>
                <span className="sr-only">{destino.titulo}</span>
              </Link>
            </li>
          );
        })}

        <li>
          <MenuHoja menu={menu} variante="pestana" />
        </li>
      </ul>
    </nav>
  );
}

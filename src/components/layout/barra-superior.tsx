"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Firma } from "@/components/layout/marca";
import { MenuHoja } from "@/components/layout/menu-hoja";
import {
  RUTA_DESTACADA,
  TEXTO_DESTACADO,
  esActiva,
  type Menu,
} from "@/components/layout/navegacion";
import { useDesplazado } from "@/hooks/navegador";
import { cn } from "@/lib/utils";

/**
 * La píldora flotante de Lookback: la barra no se pega al borde de la ventana,
 * flota sobre el papel con aire alrededor y el contenido pasa por debajo.
 *
 * GEOMETRÍA — de aquí sale el hueco que `layout.tsx` le deja al contenido.
 * 16 px de aire (`p-4`) + 64 px de alto (`h-16`) = 80 px, iguales en todos los
 * anchos. Es a propósito: con una sola cifra, el `pt-20` de `<main>` y el
 * `--alto-barra` que puede leer cualquier página no se desincronizan nunca. Si
 * cambias `p-4` o `h-16`, cambia también los dos sitios de `layout.tsx`.
 *
 * ES DE CLIENTE POR DOS COSAS Y SOLO DOS: `usePathname`, para marcar el destino
 * activo, y `useDesplazado`, para pasar de una sombra de un pelo a la sombra
 * llena en cuanto la página empieza a correr por debajo.
 */
export function BarraSuperior({ menu }: { menu: Menu }) {
  const pathname = usePathname();
  const desplazado = useDesplazado(16);

  return (
    <header className="fixed inset-x-0 top-0 z-50 p-4">
      <div className="relative mx-auto flex h-16 max-w-[1200px] items-center gap-4 pl-5 pr-2 sm:pl-7 sm:pr-3">
        {/*
          El fondo de la píldora va en una capa aparte y no en el propio div.
          `backdrop-filter` convierte a su elemento en bloque contenedor de todo
          lo que lleve dentro con `position: fixed`, y dentro va la hoja del
          menú: pintada desde aquí, sus medidas se medirían contra la píldora en
          vez de contra la ventana. Sacar el desenfoque a una capa hermana del
          contenido deja la píldora como una caja normal y corriente.

          Translúcida sobre el papel a propósito: el contenido se intuye al
          pasar por debajo, y eso es lo que la hace flotar en vez de tapar.
        */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 -z-10 rounded-pildora bg-white/78 backdrop-blur-xl",
            "ring-1 ring-marino/6 transition-shadow duration-500 ease-suave",
            desplazado ? "shadow-pildora" : "shadow-[0_1px_2px_rgb(5_19_36_/_0.05)]",
          )}
        />

        <Firma className="h-5 text-marino sm:h-[1.375rem]" />

        {/* `mx-auto` reparte el hueco sobrante a los dos lados: los cinco
            destinos quedan centrados entre la firma y el botón. */}
        <nav aria-label="Navegación principal" className="mx-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {menu.principal.map((destino) => {
              const activa = esActiva(destino.ruta, pathname);
              return (
                <li key={destino.ruta}>
                  <Link
                    href={destino.ruta}
                    aria-current={activa ? "page" : undefined}
                    className={cn(
                      "tactil flex min-h-10 items-center rounded-pildora px-3.5 text-[0.9375rem]",
                      activa
                        ? "bg-marino/7 font-medium text-marino"
                        : "text-marino-suave hover:bg-marino/4 hover:text-marino",
                    )}
                  >
                    {destino.titulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* El botón menta es el «Sign up» de Lookback: el único gesto de color
            de la barra, y lleva al catálogo. */}
        <Link
          href={RUTA_DESTACADA}
          className="tactil hidden min-h-12 items-center justify-center rounded-boton bg-menta px-6 text-[0.9375rem] font-semibold text-marino hover:bg-menta-honda lg:inline-flex"
        >
          {TEXTO_DESTACADO}
        </Link>

        {/* Debajo de `lg` no caben cinco destinos: firma y botón de menú. */}
        <MenuHoja menu={menu} className="ml-auto lg:hidden" />
      </div>
    </header>
  );
}

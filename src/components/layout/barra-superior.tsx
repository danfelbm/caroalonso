"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Firma } from "@/components/layout/marca";
import {
  RUTA_DESTACADA,
  TEXTO_DESTACADO,
  esActiva,
  type Menu,
} from "@/components/layout/navegacion";
import { useDesplazado } from "@/hooks/navegador";
import { cn } from "@/lib/utils";

/**
 * DOS BARRAS EN UNA, y la diferencia no es de tamaño sino de género.
 *
 * Desde `lg` es la píldora flotante de Lookback: no se pega al borde de la
 * ventana, flota sobre el papel con aire alrededor, y el contenido pasa por
 * debajo. Ahí van la firma, los cinco destinos y el botón menta.
 *
 * Por debajo de `lg` es otra cosa: una barra de título a ras, pegada al borde,
 * translúcida y con una línea abajo — la de cualquier app. Solo lleva la firma.
 * La navegación se fue a `barra-inferior.tsx`, que es donde llega el pulgar, y
 * con ella se fue el botón de menú: encogida la píldora a 390 px quedaba una
 * cápsula de 80 px de alto con una firma a un lado, un icono al otro y un
 * desierto en medio. Eso era el sitio de escritorio encogido.
 *
 * GEOMETRÍA — de aquí sale el hueco que el contenido deja arriba, y vive en
 * `--alto-barra` (globals.css), no aquí:
 *   móvil       56 px de alto a ras                        → 3.5rem
 *   desde `lg`  16 px de aire (`p-4`) + 64 px (`h-16`)      → 5rem
 * Si cambias cualquiera de esas clases, cambia la variable.
 *
 * ES DE CLIENTE POR DOS COSAS Y SOLO DOS: `usePathname`, para marcar el destino
 * activo, y `useDesplazado`, para pasar de una sombra de un pelo a la sombra
 * llena en cuanto la página empieza a correr por debajo.
 */
export function BarraSuperior({ menu }: { menu: Menu }) {
  const pathname = usePathname();
  const desplazado = useDesplazado(16);

  return (
    <header className="fixed inset-x-0 top-0 z-50 lg:p-4">
      <div className="relative mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-5 lg:h-16 lg:pr-3 lg:pl-7">
        {/*
          El fondo va en una capa aparte y no en el propio div.
          `backdrop-filter` convierte a su elemento en bloque contenedor de todo
          lo que lleve dentro con `position: fixed`, y dentro va la hoja del
          menú: pintada desde aquí, sus medidas se medirían contra la píldora en
          vez de contra la ventana. Sacar el desenfoque a una capa hermana del
          contenido deja la píldora como una caja normal y corriente.

          Translúcida sobre el papel a propósito: el contenido se intuye al
          pasar por debajo, y eso es lo que la hace flotar en vez de tapar.

          En móvil pierde el radio y gana la línea de abajo; la sombra se la
          queda la píldora de escritorio, porque una barra a ras con sombra
          proyectada parece despegada de la pantalla.
        */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 -z-10 bg-white/78 backdrop-blur-xl",
            "border-b border-marino/8 lg:rounded-pildora lg:border-0 lg:ring-1 lg:ring-marino/6",
            "transition-shadow duration-500 ease-suave",
            desplazado ? "lg:shadow-pildora" : "lg:shadow-[0_1px_2px_rgb(5_19_36_/_0.05)]",
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
      </div>
    </header>
  );
}

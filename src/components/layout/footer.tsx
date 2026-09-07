import Link from "next/link";
import type { ReactNode } from "react";

import { Firma } from "@/components/layout/marca";
import { ICONOS_RED, type Menu } from "@/components/layout/navegacion";
import { IconoFlechaDiagonal } from "@/components/ui/iconos";
import type { Boletin, Contacto, Identidad } from "@/types/sitio";

interface PieProps {
  identidad: Identidad;
  contacto: Contacto;
  menu: Menu;
  boletin: Boletin;
  /**
   * El formulario compartido de `src/components/formularios/`, cuando exista.
   *
   * TODO: hoy el bloque del boletín es solo texto. Lo escribe otro frente; para
   * enchufarlo basta con pasarlo desde `layout.tsx`:
   *   <Pie … formulario={<FormularioBoletin boletin={boletin} />} />
   * Entra como prop y no como import para que este archivo no tenga que tocarse
   * el día que el componente aterrice, y para que ninguno de los dos frentes
   * espere al otro.
   */
  formulario?: ReactNode;
}

/**
 * El pie: marino profundo a sangre, la firma en grande y todo lo que no cabe
 * en la barra.
 *
 * Es el bloque más oscuro del sitio a propósito. Después de una página entera
 * de papel, el marino cierra —es lo que en Lookback hace la banda final— y de
 * paso da el único sitio donde la firma se lee en papel sobre tinta.
 */
export function Pie({ identidad, contacto, menu, boletin, formulario }: PieProps) {
  /*
   * El año se calcula al construir, no al visitar: estas páginas se
   * prerenderizan. Es lo correcto —un año de más en un aviso legal no engaña a
   * nadie y evita un componente de cliente entero— pero conviene saberlo: el
   * primero de enero el sitio hay que reconstruirlo.
   */
  const anio = new Date().getFullYear();

  return (
    /* `pb-pestanas` es el hueco que se traga la barra de pestañas de móvil.
       Va en el <footer>, último elemento del documento, y no en <main>: dentro
       del marino no se ve, y entre la última banda de color y el pie no aparece
       una franja de papel. En el propio <footer> y no en el container de dentro
       para no pelearse con su `py`: son dos elementos distintos y no hay orden
       de hojas de estilo que decida cuál gana. Desde `lg` la variable vale cero
       y esto no reserva nada. */
    <footer className="bg-marino pb-pestanas text-papel">
      <div className="container py-12 sm:py-20 lg:py-24">
        {/*
          Cuatro columnas en pantalla ancha —marca, cinco destinos, tres
          secundarios, redes— y no tres. Con «Navegar» y «También» apilados en
          la misma columna, esa columna caía muy por debajo de las otras dos y
          el pie quedaba con un hueco en ele. Repartidos, las tres columnas de
          enlaces terminan casi a la misma altura.
        */}
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-14 lg:grid-cols-12 lg:gap-10">
          {/* ---------------- Firma y lema ---------------- */}
          <div className="sm:col-span-2 lg:col-span-5 lg:pr-10">
            <Firma
              className="h-9 text-papel sm:h-11"
              etiqueta={`${identidad.firma}, ir al inicio`}
            />
            <p className="mt-6 max-w-[30ch] font-display text-rotulo text-papel/85 sm:mt-8">
              {identidad.lema}
            </p>
            <p className="mt-4 text-cuerpo text-papel/55 sm:mt-6">
              {identidad.oficio} · {contacto.ciudad}
            </p>
          </div>

          {/* ---------------- Los cinco destinos ---------------- */}
          <nav aria-labelledby="pie-navegar" className="lg:col-span-2">
            <p id="pie-navegar" className="eyebrow text-papel/45">
              Navegar
            </p>
            <ul className="mt-3 space-y-0.5 sm:mt-5 sm:space-y-1">
              {menu.principal.map((destino) => (
                <li key={destino.ruta}>
                  <Link
                    href={destino.ruta}
                    className="tactil flex min-h-11 items-center text-cuerpo text-papel/80 hover:text-papel lg:min-h-10"
                  >
                    {destino.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ---------------- Los tres secundarios ---------------- */}
          <nav aria-labelledby="pie-tambien" className="lg:col-span-2">
            <p id="pie-tambien" className="eyebrow text-papel/45">
              También
            </p>
            <ul className="mt-3 space-y-0.5 sm:mt-5 sm:space-y-1">
              {menu.secundaria.map((destino) => (
                <li key={destino.ruta}>
                  <Link
                    href={destino.ruta}
                    className="tactil flex min-h-11 items-center text-cuerpo text-papel/80 hover:text-papel lg:min-h-10"
                  >
                    {destino.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ---------------- Redes ---------------- */}
          <div className="lg:col-span-3">
            <p className="eyebrow text-papel/45">Dónde más está</p>
            <ul className="mt-3 space-y-0.5 sm:mt-5 sm:space-y-1">
              {menu.redes.map((red) => {
                const Icono = ICONOS_RED[red.plataforma];
                return (
                  <li key={red.plataforma}>
                    <a
                      href={red.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tactil group flex min-h-11 items-center gap-3 text-cuerpo text-papel/80 hover:text-papel lg:min-h-10"
                    >
                      <Icono className="shrink-0 text-[1.125rem] text-papel/55 transition-colors group-hover:text-menta" />
                      {red.nombre}
                      {/* La diagonal dice «esto sale del sitio» sin escribirlo. */}
                      <IconoFlechaDiagonal
                        aria-hidden
                        className="text-[0.875rem] text-papel/35 transition-colors group-hover:text-papel/70"
                      />
                      <span className="sr-only">{red.usuario}, se abre en otra pestaña</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* ---------------- Boletín ---------------- */}
        <section
          aria-labelledby="pie-boletin"
          className="mt-12 rounded-panel bg-papel/6 p-6 sm:mt-20 sm:p-10"
        >
          <p className="eyebrow text-papel/45">Boletín</p>
          <h2 id="pie-boletin" className="mt-3 max-w-[16ch] text-subtitulo sm:mt-4">
            {boletin.titular}
          </h2>
          <p className="mt-4 max-w-[52ch] text-entradilla text-papel/70 sm:mt-5">
            {boletin.entradilla}
          </p>

          {formulario && <div className="mt-6 max-w-[34rem] sm:mt-8">{formulario}</div>}
        </section>

        {/* ---------------- Legal ---------------- */}
        <div className="mt-10 flex flex-col gap-3 border-t border-papel/12 pt-7 text-nota text-papel/45 sm:mt-14 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
          {/* La firma ya termina en punto («Carolina Alonso C.»): el separador
              va con punto medio para no encadenar dos puntos seguidos. */}
          <p className="cifras">
            © {anio} {identidad.firma} · Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

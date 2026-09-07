"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { GlifoFirma } from "@/components/layout/marca";
import {
  ICONOS_RED,
  RUTA_DESTACADA,
  TEXTO_DESTACADO,
  esActiva,
  type Menu,
} from "@/components/layout/navegacion";
import { cn } from "@/lib/utils";
import { IconoCerrar, IconoFlechaDiagonal, IconoMenu } from "@/components/ui/iconos";

/**
 * El menú de móvil: botón en la barra y hoja que sube desde abajo.
 *
 * POR QUÉ UN `<dialog>` NATIVO Y NO UN DIV CON TRAMPAS DE FOCO A MANO.
 * El elemento regala, y bien hecho, todo lo que aquí habría que reescribir:
 * atrapa el foco de verdad (incluida la barra del navegador, que una trampa en
 * JavaScript no alcanza), cierra con la tecla de escape, deja inerte el resto
 * de la página para los lectores de pantalla, devuelve el foco al abrir y al
 * cerrar, y se pinta en la capa superior, así que no pelea por `z-index` con la
 * barra fija ni con el vídeo del hero. Lo único que no hace es bloquear el
 * scroll del cuerpo, y eso sí se hace a mano.
 *
 * El alto empieza en 5 rem —justo por debajo de la barra— para que quede una
 * franja de fondo que se puede tocar para cerrar. Con la hoja pegada al borde
 * superior no habría ningún «fuera» donde pulsar.
 */
export function MenuHoja({ menu, className }: { menu: Menu; className?: string }) {
  const pathname = usePathname();
  const hoja = useRef<HTMLDialogElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const idHoja = useId();
  const idTitulo = useId();

  /*
   * Abierto/cerrado es estado del componente, no del navegador: aquí `useState`
   * es lo correcto. Lo que sí sería un error es leerlo con un efecto que mire
   * `dialog.open` después de pintar; por eso el estado y el elemento se mueven
   * siempre juntos, en el mismo gesto.
   */
  const [abierto, setAbierto] = useState(false);

  function abrir() {
    hoja.current?.showModal();
    // La hoja tapa la página: mientras esté abierta, el fondo no rueda.
    document.body.style.overflow = "hidden";
    setAbierto(true);
  }

  /** Solo pide el cierre: quien apaga el estado es el evento `close`. */
  function cerrar() {
    hoja.current?.close();
  }

  /*
   * `close` es el único sitio donde se recoge, y por eso da igual quién cerró:
   * la tecla de escape, el botón, un enlace o un toque en la franja de arriba
   * pasan todos por aquí. Escribirlo en cada manejador dejaría a la tecla de
   * escape —que cierra sola, sin pasar por React— con el cuerpo bloqueado.
   */
  useEffect(() => {
    const dialogo = hoja.current;
    if (!dialogo) return;

    const alCerrar = () => {
      document.body.style.overflow = "";
      setAbierto(false);
      // El navegador ya suele devolver el foco, pero no todos y no siempre:
      // insistir es gratis y garantiza que nadie acabe con el foco en el <body>.
      boton.current?.focus();
    };

    dialogo.addEventListener("close", alCerrar);
    return () => {
      dialogo.removeEventListener("close", alCerrar);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <button
        ref={boton}
        type="button"
        onClick={abrir}
        aria-expanded={abierto}
        aria-controls={idHoja}
        aria-label="Abrir el menú"
        className={cn(
          "tactil -mr-1 flex size-11 items-center justify-center rounded-pildora text-marino-tinta hover:bg-marino/6",
          className,
        )}
      >
        <IconoMenu className="text-[1.375rem]" />
      </button>

      <dialog
        ref={hoja}
        id={idHoja}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        /*
         * Un clic sobre el fondo oscuro tiene como destino el propio <dialog>:
         * es la manera estándar —y la única— de detectar «pulsó fuera».
         */
        onClick={(evento) => {
          if (evento.target === hoja.current) cerrar();
        }}
        className={cn(
          // Deshacer la hoja de estilos del navegador, que centra el diálogo y
          // le pone borde, relleno y un máximo de alto y ancho.
          "m-0 h-auto max-h-none w-full max-w-none border-0 p-0",
          "fixed inset-x-0 bottom-0 top-20",
          /*
           * `hidden` + `open:flex`, y no `flex` a secas. El navegador esconde
           * los diálogos cerrados con `dialog:not([open]) { display: none }`,
           * pero eso vive en su hoja de estilos y CUALQUIER `display` del autor
           * le gana, por poca especificidad que tenga. Con un `flex` suelto la
           * hoja seguía en el árbol con la página cerrada: invisible por
           * `opacity: 0`, pero con sus catorce enlaces dentro del recorrido de
           * tabulación en escritorio. Medido: tras «Ver los libros» el foco se
           * metía en un menú que nadie ve.
           */
          "hidden flex-col overflow-y-auto overscroll-contain rounded-t-panel bg-papel text-marino-tinta open:flex",
          "backdrop:bg-marino/45 backdrop:backdrop-blur-[3px]",
          /*
           * Entra subiendo y sale bajando. `starting:` da el fotograma cero
           * —sin él el elemento nace ya colocado y no hay transición— y
           * `transition-discrete` mantiene la hoja pintada mientras baja, que si
           * no `display: none` la corta en seco al cerrar. Donde el navegador no
           * entienda ninguna de las dos, aparece y desaparece sin más.
           */
          "translate-y-full opacity-0 open:translate-y-0 open:opacity-100",
          "starting:open:translate-y-full starting:open:opacity-0",
          "transition-[translate,transform,opacity,display,overlay] transition-discrete duration-300 ease-suave",
          // El oscurecido entra y sale con la hoja; de lo contrario aparece de
          // golpe a plena opacidad mientras la hoja todavía está subiendo.
          "backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0",
          "backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-300",
        )}
      >
        <div className="flex min-h-16 shrink-0 items-center justify-between gap-4 px-5">
          <GlifoFirma className="h-5 text-marino" />
          <h2 id={idTitulo} className="sr-only">
            Menú de {menu.principal.length + menu.secundaria.length} destinos
          </h2>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar el menú"
            className="tactil -mr-1 flex size-11 items-center justify-center rounded-pildora text-marino-tinta hover:bg-marino/6"
          >
            <IconoCerrar className="text-[1.375rem]" />
          </button>
        </div>

        {/* `flex-1` + el `mt-auto` de las redes: la hoja ocupa todo el alto y el
            aire sobrante se va al medio, no debajo del último enlace. */}
        <nav aria-label="Menú principal" className="flex flex-1 flex-col px-5 pb-safe">
          <ul className="border-t border-marino/10">
            {menu.principal.map((destino) => {
              const activa = esActiva(destino.ruta, pathname);
              return (
                <li key={destino.ruta} className="border-b border-marino/10">
                  <Link
                    href={destino.ruta}
                    onClick={cerrar}
                    aria-current={activa ? "page" : undefined}
                    className={cn(
                      "tactil flex min-h-15 items-center gap-3 font-display text-rotulo",
                      activa ? "text-marino" : "text-marino-tinta",
                    )}
                  >
                    {/* El mismo punto con que la barra marca dónde se está. */}
                    <span
                      aria-hidden
                      className={cn(
                        "size-1.5 shrink-0 rounded-pildora transition-colors",
                        activa ? "bg-azul" : "bg-transparent",
                      )}
                    />
                    {destino.titulo}
                  </Link>
                </li>
              );
            })}
          </ul>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1">
            {menu.secundaria.map((destino) => (
              <li key={destino.ruta}>
                <Link
                  href={destino.ruta}
                  onClick={cerrar}
                  aria-current={esActiva(destino.ruta, pathname) ? "page" : undefined}
                  className="tactil flex min-h-11 items-center text-cuerpo text-marino-suave hover:text-marino"
                >
                  {destino.titulo}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href={RUTA_DESTACADA}
            onClick={cerrar}
            /* `mb-8` porque el `mt-auto` de las redes se queda en cero cuando el
               contenido no cabe: sin él, en una pantalla corta se tocarían. */
            className="tactil mb-8 mt-6 flex min-h-14 items-center justify-center rounded-boton bg-menta font-semibold text-marino hover:bg-menta-honda"
          >
            {TEXTO_DESTACADO}
          </Link>

          <ul className="mt-auto flex items-center gap-2 border-t border-marino/10 pb-1 pt-5">
            {menu.redes.map((red) => {
              const Icono = ICONOS_RED[red.plataforma];
              return (
                <li key={red.plataforma}>
                  <a
                    href={red.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${red.nombre} · ${red.usuario}`}
                    className="tactil flex size-11 items-center justify-center rounded-pildora text-marino-suave hover:bg-marino/6 hover:text-marino"
                  >
                    <Icono className="text-[1.25rem]" />
                  </a>
                </li>
              );
            })}
            <li className="ms-auto">
              <span className="flex items-center gap-1.5 text-nota text-marino-tenue">
                Abren fuera
                <IconoFlechaDiagonal aria-hidden className="text-[0.875rem]" />
              </span>
            </li>
          </ul>
        </nav>
      </dialog>
    </>
  );
}

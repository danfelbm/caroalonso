import { Boton } from "@/components/layout/boton";
import { IconoChevron, IconoFlechaDiagonal } from "@/components/ui/iconos";
import { cn } from "@/lib/utils";
import type { EnlaceCompra, Libro, SoporteCompra } from "@/types/libro";

/** El orden y los nombres del sitio viejo: DIGITAL / FÍSICO / AUDIO LIBRO. */
const SOPORTES: { clave: SoporteCompra; etiqueta: string }[] = [
  { clave: "digital", etiqueta: "Digital" },
  { clave: "fisico", etiqueta: "Físico" },
  { clave: "audio", etiqueta: "Audio libro" },
];

interface BloqueCompraProps {
  libro: Libro;
  /** El acento del libro, para el filete del panel. */
  color: string;
  className?: string;
}

/**
 * Dónde se consigue el libro.
 *
 * El acordeón es `<details name="…">` a secas. Con el mismo `name` en los tres,
 * el navegador se encarga de que solo uno quede abierto —es lo que antes hacía
 * un puñado de JavaScript en el sitio viejo— y de paso llega gratis todo lo
 * que un acordeón hecho a mano suele olvidar: foco, Enter y espacio, `aria-expanded`,
 * y el contenido cerrado fuera del orden de tabulación. Cero JavaScript y
 * accesible de origen.
 */
export function BloqueCompra({ libro, color, className }: BloqueCompraProps) {
  const grupos = SOPORTES.map((soporte) => ({
    ...soporte,
    enlaces: libro.compra[soporte.clave],
  })).filter((grupo) => grupo.enlaces.length > 0);

  // El estado manda, pero si un libro «en librería» se quedara sin enlaces,
  // mejor la invitación a escribir que un panel vacío.
  if (libro.estado !== "en-libreria" || grupos.length === 0) {
    return <SinLibreria color={color} className={className} />;
  }

  return (
    <aside
      id="comprar"
      className={cn("rounded-panel border bg-white p-6 shadow-tarjeta sm:p-7", className)}
      style={{ borderColor: `color-mix(in srgb, ${color} 22%, transparent)` }}
    >
      <h2 className="eyebrow opacity-55">Cómpralo aquí</h2>

      <div className="mt-5">
        {grupos.map((grupo, indice) => (
          <details
            key={grupo.clave}
            /* El mismo `name` en los tres: acordeón exclusivo, sin JavaScript.
               Lleva el slug porque el nombre es de documento, no de componente. */
            name={`compra-${libro.slug}`}
            open={indice === 0}
            className="group border-t border-marino/10 first:border-t-0"
          >
            <summary className="tactil flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
              {grupo.etiqueta}
              <span className="flex items-center gap-2 text-nota font-normal opacity-55">
                {grupo.enlaces.length} {grupo.enlaces.length === 1 ? "tienda" : "tiendas"}
                <IconoChevron className="text-[1.125rem] transition-transform duration-300 ease-suave group-open:rotate-180" />
              </span>
            </summary>

            <ul className="pb-3">
              {grupo.enlaces.map((enlace) => (
                <li key={enlace.url}>
                  <Tienda enlace={enlace} etiqueta={grupo.etiqueta} />
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </aside>
  );
}

function Tienda({ enlace, etiqueta }: { enlace: EnlaceCompra; etiqueta: string }) {
  return (
    <a
      href={enlace.url}
      target="_blank"
      /* `noopener` para que la tienda no herede una referencia a esta ventana. */
      rel="noopener"
      className="tactil group/tienda flex min-h-11 items-center justify-between gap-3 text-cuerpo text-marino-suave hover:text-azul"
    >
      <span>
        {enlace.tienda}
        {/* Quien no ve el icono también merece saber que se abre otra pestaña. */}
        <span className="sr-only"> · {etiqueta}, se abre en otra pestaña</span>
      </span>
      <IconoFlechaDiagonal className="shrink-0 text-[1.125rem] opacity-45 transition-[transform,opacity] duration-300 ease-suave group-hover/tienda:opacity-100" />
    </a>
  );
}

/**
 * Los cinco títulos anteriores a 2021 se vendían en la tienda del propio sitio,
 * que se cerró con la migración. Un botón «Comprar» que no lleva a ninguna
 * parte sería peor que no tener botón: aquí la salida es escribirle.
 */
function SinLibreria({ color, className }: { color: string; className?: string }) {
  return (
    <aside
      id="comprar"
      className={cn("rounded-panel border bg-white p-6 shadow-tarjeta sm:p-7", className)}
      style={{ borderColor: `color-mix(in srgb, ${color} 22%, transparent)` }}
    >
      <h2 className="eyebrow opacity-55">Cómo conseguirlo</h2>
      <p className="mt-5 text-cuerpo text-marino-suave">
        Este libro ya no está en librerías. Escríbeme y miramos cómo conseguirlo.
      </p>
      <Boton href="/contacto" className="mt-6 w-full">
        Pregúntame por este libro
      </Boton>
    </aside>
  );
}

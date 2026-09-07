import { Boton } from "@/components/layout/boton";
import { Seccion } from "@/components/layout/seccion";
import { IconoFlechaDerecha } from "@/components/ui/iconos";
import { urlLibro } from "@/lib/datos";
import type { Libro } from "@/types/libro";

import { CitaLibro } from "./cita-libro";
import { paletaLibro } from "./paleta";
import { PortadaLibro } from "./portada-libro";

/**
 * El lanzamiento vigente, a sangre y en su color. Es la única banda de color
 * del índice: lo que la hace destacar no es un marco más grande, sino ser la
 * única que ocupa el ancho entero de la ventana.
 */
export function DestacadoLibro({ libro }: { libro: Libro }) {
  const paleta = paletaLibro(libro);
  const ficha = urlLibro(libro.slug);

  return (
    <Seccion fondo="acento" tamano="lg" conGrano style={paleta.estilo}>
      <div className="grid gap-10 sm:gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-center lg:gap-20">
        <PortadaLibro
          libro={libro}
          prioridad
          sizes="(min-width: 64rem) 22rem, (min-width: 40rem) 20rem, 72vw"
          className="max-h-[20rem] sm:max-h-[24rem]"
        />

        <div>
          <p className="eyebrow opacity-55">El más reciente</p>

          <h2 className="mt-5 text-titulo">{libro.titulo}</h2>

          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 text-nota">
            <span
              className="cifras inline-flex items-center rounded-pildora px-3.5 py-1.5 font-semibold"
              style={{ backgroundColor: paleta.banda.acento, color: paleta.banda.sobreAcento }}
            >
              {libro.anio}
            </span>
            <span style={{ color: paleta.banda.suave }}>
              {[libro.editorial, libro.genero].filter(Boolean).join(" · ")}
            </span>
          </p>

          <CitaLibro libro={libro} color={paleta.banda.acento} className="mt-8 max-w-[44ch]" />

          <div className="mt-10 flex flex-wrap gap-3">
            <Boton href={`${ficha}#comprar`}>Dónde comprarlo</Boton>
            <Boton href={ficha} variante="borde">
              Sobre el libro <IconoFlechaDerecha />
            </Boton>
          </div>
        </div>
      </div>
    </Seccion>
  );
}

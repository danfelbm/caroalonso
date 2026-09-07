import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Nombres de la paleta, no colores sueltos: quien monta una página elige
 * "menta" o "marino", y la pareja fondo/texto ya viene comprobada en
 * contraste. `acento` es el caso especial — toma el color que la sección
 * reciba por `style` (ver el bloque `@theme inline` de globals.css).
 */
type Fondo =
  | "papel"
  | "blanco"
  | "marino"
  | "marino-tinta"
  | "menta-niebla"
  | "menta-clara"
  | "menta"
  | "menta-honda"
  | "amarillo-claro"
  | "amarillo"
  | "mantequilla"
  | "azul"
  | "azul-vivo"
  | "celeste"
  | "rosa"
  | "lavanda-claro"
  | "lavanda"
  | "acento";

const FONDOS: Record<Fondo, string> = {
  papel: "bg-papel text-marino-tinta",
  blanco: "bg-white text-marino-tinta",
  marino: "bg-marino text-papel",
  "marino-tinta": "bg-marino-tinta text-papel",
  "menta-niebla": "bg-menta-niebla text-marino",
  "menta-clara": "bg-menta-clara text-marino",
  menta: "bg-menta text-marino",
  "menta-honda": "bg-menta-honda text-marino",
  "amarillo-claro": "bg-amarillo-claro text-marino",
  amarillo: "bg-amarillo text-marino",
  mantequilla: "bg-mantequilla text-marino",
  azul: "bg-azul text-papel",
  // Sobre el azul vivo el texto va en marino: contra papel se queda en 3.7:1
  // y no pasa AA en cuerpo de texto.
  "azul-vivo": "bg-azul-vivo text-marino",
  celeste: "bg-celeste text-marino",
  rosa: "bg-rosa text-marino-tinta",
  "lavanda-claro": "bg-lavanda-claro text-marino-tinta",
  lavanda: "bg-lavanda text-marino",
  acento: "bg-acento text-acento-tinta",
};

type Tamano = "sm" | "md" | "lg" | "xl" | "nada";

/**
 * EL AIRE ENTRE SECCIONES, y por qué el escalón de móvil es otro.
 *
 * En escritorio una sección `lg` respira 144 px arriba y abajo: la ventana mide
 * 900 px de alto, la banda ocupa una parte y el aire es lo que separa dos
 * bloques que se ven a la vez. En un teléfono de 844 px no se ven dos bloques a
 * la vez nunca, así que ese mismo aire ya no separa nada — solo obliga a
 * arrastrar el pulgar por 160 px de fondo liso entre el final de una sección y
 * el título de la siguiente. Medido en la portada: 12 728 px de alto, quince
 * pantallas, y buena parte era eso.
 *
 * Los escalones `sm:` y `lg:` están intactos: desde 640 px el sitio respira hoy
 * exactamente lo que respiraba ayer. Lo único recalibrado es el valor base, el
 * que ve un teléfono:
 *
 *   sm   40 → 32 px      md   56 → 44 px
 *   lg   80 → 56 px      xl   96 → 64 px
 */
const TAMANOS: Record<Tamano, string> = {
  nada: "",
  sm: "py-8 sm:py-14",
  md: "py-11 sm:py-20 lg:py-24",
  lg: "py-14 sm:py-28 lg:py-36",
  xl: "py-16 sm:py-36 lg:py-44",
};

interface SeccionProps extends ComponentProps<"section"> {
  fondo?: Fondo;
  tamano?: Tamano;
  /** El contenido llega al borde de la pantalla; el container lo pone quien use la sección. */
  aSangre?: boolean;
  /** Ruido de papel sobre el color plano. Solo en las bandas grandes. */
  conGrano?: boolean;
}

/**
 * La banda horizontal a sangre de Lookback: el color ocupa todo el ancho de
 * la ventana y solo el contenido se encierra en el container. Es la pieza que
 * da el ritmo de la página, así que casi todo lo demás cuelga de aquí.
 */
export function Seccion({
  fondo = "papel",
  tamano = "md",
  aSangre,
  conGrano,
  className,
  children,
  ...props
}: SeccionProps) {
  return (
    <section
      className={cn("relative", FONDOS[fondo], TAMANOS[tamano], conGrano && "grano", className)}
      {...props}
    >
      {aSangre ? children : <div className="container">{children}</div>}
    </section>
  );
}

type TamanoTitulo = "md" | "lg" | "xl";

const TAMANOS_TITULO: Record<TamanoTitulo, string> = {
  md: "text-subtitulo",
  lg: "text-titulo",
  xl: "text-titular",
};

interface TituloProps {
  eyebrow?: ReactNode;
  titulo: ReactNode;
  entradilla?: ReactNode;
  /** Botón o enlace a la derecha del titular en pantallas anchas. */
  accion?: ReactNode;
  tamano?: TamanoTitulo;
  /** h1 solo en la cabecera de cada página; en secciones, h2. */
  nivel?: "h1" | "h2";
  alineado?: "izquierda" | "centro";
  className?: string;
}

/**
 * Eyebrow + titular + entradilla. La entradilla hereda el color del fondo con
 * `opacity` en vez de un gris fijo: así el mismo componente se lee bien sobre
 * papel y sobre marino sin una variante por color.
 */
export function Titulo({
  eyebrow,
  titulo,
  entradilla,
  accion,
  tamano = "lg",
  nivel = "h2",
  alineado = "izquierda",
  className,
}: TituloProps) {
  const centro = alineado === "centro";
  const Encabezado = nivel;

  return (
    <header
      className={cn(
        // Mismo criterio que el `py` de la sección: en móvil el aire entre el
        // titular y lo que presenta se acorta, porque a 390 px la cabecera y su
        // contenido siempre se leen en la misma pantalla y 40 px los separaban
        // como si fueran dos cosas distintas.
        "mb-7 sm:mb-14",
        centro && "text-center",
        accion && "sm:flex sm:items-end sm:justify-between sm:gap-10",
        className,
      )}
    >
      <div className={cn(centro && "mx-auto max-w-[42rem]", accion && "sm:max-w-[44rem]")}>
        {eyebrow && <p className="eyebrow mb-3 opacity-55 sm:mb-4">{eyebrow}</p>}
        <Encabezado className={cn(TAMANOS_TITULO[tamano], "max-w-[20ch]", centro && "mx-auto")}>
          {titulo}
        </Encabezado>
        {entradilla && (
          <div
            className={cn(
              "mt-4 max-w-[48ch] text-entradilla opacity-70 sm:mt-5",
              centro && "mx-auto",
            )}
          >
            {entradilla}
          </div>
        )}
      </div>
      {accion && <div className="mt-6 shrink-0 sm:mt-0">{accion}</div>}
    </header>
  );
}

/**
 * Ancho cómodo para texto seguido: 34rem son unos 70 caracteres de Inter a
 * 18 px, el punto en el que el ojo todavía encuentra el principio del
 * renglón siguiente sin buscarlo.
 */
export function Columna({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("max-w-[34rem]", className)} {...props}>
      {children}
    </div>
  );
}

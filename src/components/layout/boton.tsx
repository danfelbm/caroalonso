import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/components/ui/cn";

type Variante = "primario" | "menta" | "borde" | "claro" | "enlace";
type Tamano = "sm" | "md" | "lg";

const BASE =
  "tactil inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-boton font-sans font-medium disabled:pointer-events-none disabled:opacity-45";

const VARIANTES: Record<Variante, string> = {
  // La píldora marino sólida de "Book a demo".
  primario: "bg-marino-tinta font-semibold text-papel shadow-boton hover:bg-marino",
  // El "Sign up" de Lookback: menta plana, sin sombra, sobre papel.
  menta: "bg-menta font-semibold text-marino hover:bg-menta-honda",
  // Contorno en currentColor: sirve igual sobre papel, sobre menta y sobre marino.
  borde: "border-[1.5px] border-current/30 font-semibold hover:border-current/70 hover:bg-current/8",
  // Para cuando el botón cae sobre una banda de color oscuro.
  claro: "bg-papel font-semibold text-marino-tinta shadow-tarjeta hover:bg-white",
  // Sin caja: un enlace de texto que hereda el color de donde esté.
  enlace: "enlace rounded-none px-0 hover:text-azul",
};

const TAMANOS: Record<Tamano, string> = {
  sm: "min-h-10 px-5 text-[0.875rem]",
  md: "min-h-12 px-6 text-[0.9375rem]",
  lg: "min-h-14 px-8 text-[1.0625rem]",
};

interface BotonBase {
  variante?: Variante;
  tamano?: Tamano;
  className?: string;
  children: ReactNode;
}

type PropsEnlace = BotonBase & { href: string } & Omit<
    ComponentProps<typeof Link>,
    "href" | "className" | "children"
  >;
type PropsBoton = BotonBase & { href?: undefined } & Omit<
    ComponentProps<"button">,
    "className" | "children"
  >;

/**
 * Polimórfico: con `href` sale un <Link> de Next (prefetch y navegación de
 * cliente), sin él un <button>. Un <button> envuelto en <a> o al revés rompe
 * la navegación por teclado, así que la decisión la toma el componente y no
 * quien lo usa.
 */
export function Boton(props: PropsEnlace | PropsBoton) {
  const { variante = "primario", tamano = "md", className, children, ...resto } = props;

  const clases = cn(
    BASE,
    VARIANTES[variante],
    variante !== "enlace" && TAMANOS[tamano],
    className,
  );

  if ("href" in props && props.href) {
    const { href, ...enlace } = resto as Omit<PropsEnlace, keyof BotonBase>;
    return (
      <Link href={href} className={clases} {...enlace}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={clases} {...(resto as Omit<PropsBoton, keyof BotonBase>)}>
      {children}
    </button>
  );
}

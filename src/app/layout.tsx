import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import type { ReactNode } from "react";

import { BarraInferior } from "@/components/layout/barra-inferior";
import { BarraSuperior } from "@/components/layout/barra-superior";
import { FormularioBoletin } from "@/components/formularios/formulario";
import { Pie } from "@/components/layout/footer";
import { DefinicionFirma } from "@/components/layout/marca";
import type { Menu } from "@/components/layout/navegacion";
import { getSitio } from "@/lib/datos";

import "./globals.css";

/**
 * LAS FUENTES
 *
 * `globals.css` no carga nada: consume `--fuente-newsreader` y `--fuente-inter`,
 * y quien las pone en el <html> es este archivo. Si estas dos variables se
 * llaman de otra manera, el sitio entero se queda en la serif del sistema sin
 * un solo error en consola.
 *
 * Pesos estáticos y no variables, a propósito. En el proyecto hermano el rango
 * completo de las dos familias costaba 275 KB; estos cinco cortes, 70 KB. Un
 * sitio de lectura no necesita interpolar pesos: necesita que el primer párrafo
 * esté en pantalla.
 */

/**
 * La itálica de Newsreader no es un adorno: es el gesto de la marca —la palabra
 * subrayada del titular— y `globals.css` la da por hecha en `h1 em`. Sin el
 * corte itálico el navegador la inclina él, y una serif inclinada por software
 * se nota a la primera.
 */
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--fuente-newsreader",
});

/** 400 para el cuerpo, 500 para los enlaces activos, 600 para eyebrows y botones. */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--fuente-inter",
});

/**
 * El dominio público. Sin él, `metadataBase` no puede resolver las rutas
 * relativas de Open Graph y Next avisa en cada construcción; la reserva es el
 * dominio real para que un despliegue sin variables de entorno no se rompa.
 */
const URL_SITIO = process.env.NEXT_PUBLIC_SITIO_URL ?? "https://www.caroalonso.com";

export async function generateMetadata(): Promise<Metadata> {
  const { identidad } = await getSitio();
  const titulo = `${identidad.firma} · ${identidad.oficio}`;

  return {
    metadataBase: new URL(URL_SITIO),
    title: {
      default: titulo,
      // Cada página pone su nombre y la firma se añade sola.
      template: `%s · ${identidad.firma}`,
    },
    description: identidad.descripciones.breve,
    applicationName: identidad.firma,
    authors: [{ name: identidad.firma, url: URL_SITIO }],
    creator: identidad.firma,
    // Sin esto, iOS convierte cifras sueltas en enlaces de teléfono y les
    // cambia el color por debajo de la paleta.
    formatDetection: { telephone: false, address: false, email: false },
    openGraph: {
      type: "website",
      // Colombiano, no genérico: es lo que decide comillas, fechas y voz.
      locale: "es_CO",
      url: "/",
      siteName: identidad.firma,
      title: titulo,
      description: identidad.descripciones.breve,
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: identidad.descripciones.breve,
    },
  };
}

export const viewport: Viewport = {
  // El papel del sitio, para la barra del navegador en Android y en iOS.
  themeColor: "#FBF8F6",
  // El sitio no tiene modo oscuro: declararlo evita que el navegador invierta
  // por su cuenta los campos de formulario y los deje fuera de la paleta.
  colorScheme: "light",
  // La barra de pestañas se apoya en `env(safe-area-inset-bottom)`, y esa
  // variable vale cero mientras el documento no se extienda por debajo del
  // notch. Sin esto la barra queda flotando sobre la franja del iPhone en vez
  // de pisarla, y el hueco del gesto de inicio se cuenta dos veces.
  viewportFit: "cover",
};

/**
 * EL HUECO DE LAS DOS BARRAS vive en `globals.css`, no aquí.
 *
 * `--alto-barra` (56 px en móvil, 80 px desde `lg`) y `--alto-pestanas` (el
 * alto de la barra inferior, cero desde `lg`) son variables con media query:
 * como constante de JavaScript puesta en línea sobre el <html> no podían
 * cambiar con el ancho, y la barra de arriba adelgazó en móvil.
 *
 * De ellas cuelgan el `pt` de <main>, el `scroll-padding` de los anclajes,
 * dónde aterriza el enlace de salto, el `pb-pestanas` del pie y el `-mt` con
 * el que la portada se mete por debajo de la barra:
 *
 *     <div className="-mt-[var(--alto-barra)]">…</div>
 */

export default async function RootLayout({ children }: { children: ReactNode }) {
  const sitio = await getSitio();

  /*
   * El menú se lee UNA vez aquí y baja como props. La barra y la hoja son
   * componentes de cliente y no pueden llamar a `getSitio()` —lleva
   * `server-only`—, así que la alternativa sería duplicar las rutas en un
   * archivo del cliente y que un día dejaran de coincidir.
   */
  const menu: Menu = {
    principal: sitio.navegacion,
    secundaria: sitio.navegacionSecundaria,
    redes: sitio.redes,
  };

  return (
    <html lang="es-CO" className={`${newsreader.variable} ${inter.variable}`}>
      <body className="flex min-h-dvh flex-col">
        {/* Los trazados de la firma, una sola vez para todo el documento. */}
        <DefinicionFirma />

        {/*
          Primer elemento enfocable de la página: con un Tab desde el principio
          se llega aquí. Está siempre en el flujo pero desplazado fuera de la
          pantalla, y baja a su sitio al recibir el foco; ocultarlo con
          `display:none` lo sacaría del orden de tabulación y no serviría.

          Aterriza JUSTO DEBAJO de la barra, no encima: en la esquina superior
          izquierda taparía la firma, que es lo primero que mira quien acaba de
          llegar. El desplazamiento de reposo es «lo que baja más su propio
          alto», así que el borde inferior queda exactamente en cero por muy
          alto que se vuelva el enlace. La cota se lee de `--alto-barra` para
          que siga a la barra cuando esta adelgaza en móvil.

          La sombra solo con el foco: en reposo el borde inferior del enlace
          queda exactamente en cero, pero una `shadow-pildora` se derrama 44 px
          hacia abajo y dejaba una mancha borrosa sobre la barra en todas las
          páginas. Sin foco no hay nada que separar del fondo.
        */}
        <a
          href="#contenido"
          className="tactil fixed left-4 top-[calc(var(--alto-barra)+0.5rem)] z-60 inline-flex min-h-12 -translate-y-[calc(var(--alto-barra)+0.5rem+100%)] items-center rounded-boton bg-menta px-6 font-semibold text-marino focus:translate-y-0 focus:shadow-pildora"
        >
          Saltar al contenido
        </a>

        <BarraSuperior menu={menu} />

        {/* `tabIndex={-1}` para que el enlace de salto pueda posar el foco aquí
            de verdad y no solo desplazar la página. */}
        <main
          id="contenido"
          tabIndex={-1}
          className="flex-1 pt-[var(--alto-barra)] outline-none"
        >
          {children}
        </main>

        {/*
          El hueco de la barra de pestañas lo reserva el PIE y no <main>. La
          última sección de casi todas las páginas es una banda de color a
          sangre; un `pb` en <main> abriría entre esa banda y el pie marino una
          franja de papel de 66 px que no está en ningún diseño. Dentro del pie,
          en cambio, el hueco es marino: invisible, y la barra translúcida se
          apoya encima. Desde `lg` la variable vale cero y no reserva nada.
        */}
        <Pie
          identidad={sitio.identidad}
          contacto={sitio.contacto}
          menu={menu}
          boletin={sitio.boletin}
          formulario={<FormularioBoletin boletin={sitio.boletin} redes={sitio.redes} />}
        />

        <BarraInferior menu={menu} />
      </body>
    </html>
  );
}

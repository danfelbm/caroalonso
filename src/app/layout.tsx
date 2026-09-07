import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";

import { BarraSuperior } from "@/components/layout/barra-superior";
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
};

/**
 * EL HUECO DE LA BARRA — 80 px, iguales en todos los anchos.
 *
 * La píldora de `barra-superior.tsx` mide 16 px de aire (`p-4`) más 64 px de
 * alto (`h-16`). `<main>` lo compensa con `pt-20`, y el mismo número sale como
 * `--alto-barra` para que una portada que quiera pasar por debajo de la barra
 * lo deshaga sin adivinar la cifra:
 *
 *     <div className="-mt-[var(--alto-barra)]">…</div>
 *
 * No hay barra inferior en móvil —el menú se abre desde la de arriba— así que
 * no hace falta reservar nada abajo; lo único que respeta el notch es la hoja
 * del menú, con `pb-safe`.
 */
const ALTO_BARRA = "5rem";

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
    <html
      lang="es-CO"
      className={`${newsreader.variable} ${inter.variable}`}
      style={{ "--alto-barra": ALTO_BARRA } as CSSProperties}
    >
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
          alto que se vuelva el enlace.
        */}
        <a
          href="#contenido"
          className="tactil fixed left-4 top-[5.5rem] z-[60] inline-flex min-h-12 -translate-y-[calc(5.5rem_+_100%)] items-center rounded-boton bg-menta px-6 font-semibold text-marino shadow-pildora focus:translate-y-0"
        >
          Saltar al contenido
        </a>

        <BarraSuperior menu={menu} />

        {/* `tabIndex={-1}` para que el enlace de salto pueda posar el foco aquí
            de verdad y no solo desplazar la página. */}
        <main id="contenido" tabIndex={-1} className="flex-1 pt-20 outline-none">
          {children}
        </main>

        <Pie
          identidad={sitio.identidad}
          contacto={sitio.contacto}
          menu={menu}
          boletin={sitio.boletin}
        />
      </body>
    </html>
  );
}

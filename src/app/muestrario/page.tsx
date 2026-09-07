import type { CSSProperties } from "react";

import { Boton } from "@/components/layout/boton";
import { Columna, Seccion, Titulo } from "@/components/layout/seccion";
import { Grano } from "@/components/texturas/grano";
import {
  IconoCerrar,
  IconoChevron,
  IconoFlechaDerecha,
  IconoFlechaDiagonal,
  IconoInstagram,
  IconoMenu,
  IconoSpotify,
  IconoTiktok,
  IconoYoutube,
} from "@/components/ui/iconos";
import { Prosa } from "@/components/ui/prosa";
import { Subrayado } from "@/components/ui/subrayado";

/**
 * PÁGINA TEMPORAL DE REVISIÓN. No forma parte del sitio: se borra en cuanto
 * el sistema de diseño esté aprobado. Sirve para ver todas las piezas juntas
 * y, sobre todo, para comprobar que el acento inyectado por sección funciona.
 */
export const metadata = { title: "Muestrario", robots: { index: false } };

const PALETA = [
  { nombre: "papel", valor: "#FBF8F6", clase: "bg-papel text-marino" },
  { nombre: "marino", valor: "#051324", clase: "bg-marino text-papel" },
  { nombre: "marino-tinta", valor: "#192D41", clase: "bg-marino-tinta text-papel" },
  { nombre: "menta-niebla", valor: "#E0F7F1", clase: "bg-menta-niebla text-marino" },
  { nombre: "menta-clara", valor: "#D3F5EC", clase: "bg-menta-clara text-marino" },
  { nombre: "menta", valor: "#C2EFE3", clase: "bg-menta text-marino" },
  { nombre: "menta-honda", valor: "#B7ECDA", clase: "bg-menta-honda text-marino" },
  { nombre: "amarillo-claro", valor: "#FAF1C7", clase: "bg-amarillo-claro text-marino" },
  { nombre: "amarillo", valor: "#F6E392", clase: "bg-amarillo text-marino" },
  { nombre: "mantequilla", valor: "#F9F1DC", clase: "bg-mantequilla text-marino" },
  { nombre: "azul", valor: "#265C9F", clase: "bg-azul text-papel" },
  { nombre: "azul-vivo", valor: "#1C83EA", clase: "bg-azul-vivo text-marino" },
  { nombre: "celeste", valor: "#C3E9FE", clase: "bg-celeste text-marino" },
  { nombre: "rosa", valor: "#FDF3F1", clase: "bg-rosa text-marino" },
  { nombre: "lavanda-claro", valor: "#E2EFFF", clase: "bg-lavanda-claro text-marino" },
  { nombre: "lavanda", valor: "#A1B2EE", clase: "bg-lavanda text-marino" },
];

/** Simula lo que traerá cada libro/servicio desde los datos. */
const ACENTOS = [
  { nombre: "Libro en azul", acento: "#265C9F", tinta: "#FBF8F6" },
  { nombre: "Libro en menta", acento: "#C2EFE3", tinta: "#051324" },
  { nombre: "Libro en amarillo", acento: "#F6E392", tinta: "#051324" },
  { nombre: "Libro en lavanda", acento: "#A1B2EE", tinta: "#051324" },
];

const ICONOS = [
  { nombre: "YouTube", Icono: IconoYoutube },
  { nombre: "Instagram", Icono: IconoInstagram },
  { nombre: "TikTok", Icono: IconoTiktok },
  { nombre: "Spotify", Icono: IconoSpotify },
  { nombre: "Flecha", Icono: IconoFlechaDerecha },
  { nombre: "Diagonal", Icono: IconoFlechaDiagonal },
  { nombre: "Chevron", Icono: IconoChevron },
  { nombre: "Menú", Icono: IconoMenu },
  { nombre: "Cerrar", Icono: IconoCerrar },
];

export default function Muestrario() {
  return (
    <main>
      {/* ---------- Portada: la escala mayor y el subrayado manuscrito ---------- */}
      <Seccion fondo="papel" tamano="xl" conGrano>
        <p className="eyebrow mb-6 text-center opacity-55">Sistema de diseño</p>
        <h1 className="mx-auto max-w-[16ch] text-center text-titular">
          Escribir para pensar{" "}
          <Subrayado variante="onda">
            <em>despacio</em>,
          </Subrayado>{" "}
          no más rápido
        </h1>
        <p className="mx-auto mt-8 max-w-[46ch] text-center text-entradilla opacity-70">
          Muestrario temporal. Enseña la paleta, la escala tipográfica, los botones,
          el subrayado manuscrito, el grano y el acento por sección.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Boton href="#botones">Ver los botones</Boton>
          <Boton href="#acento" variante="menta">
            Ver el acento
          </Boton>
        </div>
      </Seccion>

      {/* ---------- Paleta completa en franjas ---------- */}
      <Seccion fondo="papel" tamano="md" id="paleta">
        <Titulo
          eyebrow="Paleta"
          titulo="Diecisiete colores y ni uno más"
          entradilla="La paleta por defecto de Tailwind está apagada: si escribes bg-red-500 no pasa nada. Es a propósito."
        />
        <div className="overflow-hidden rounded-panel shadow-panel">
          {PALETA.map((color) => (
            <div
              key={color.nombre}
              className={`${color.clase} flex items-baseline justify-between px-6 py-5`}
            >
              <span className="font-semibold">{color.nombre}</span>
              <span className="cifras text-nota opacity-70">{color.valor}</span>
            </div>
          ))}
        </div>
      </Seccion>

      {/* ---------- Escala tipográfica ---------- */}
      <Seccion fondo="mantequilla" tamano="md" id="tipografia">
        <Titulo eyebrow="Tipografía" titulo="Tres tamaños de titular" tamano="lg" />
        <div className="space-y-12">
          <div>
            <p className="eyebrow mb-3 opacity-50">tamano=&quot;xl&quot; · 40 → 76 px</p>
            <p className="max-w-[20ch] font-display text-titular">
              La <em>palabra</em> justa
            </p>
          </div>
          <div>
            <p className="eyebrow mb-3 opacity-50">tamano=&quot;lg&quot; · 32 → 56 px</p>
            <p className="max-w-[20ch] font-display text-titulo">
              La <em>palabra</em> justa
            </p>
          </div>
          <div>
            <p className="eyebrow mb-3 opacity-50">tamano=&quot;md&quot; · 26 → 40 px</p>
            <p className="max-w-[20ch] font-display text-subtitulo">
              La <em>palabra</em> justa
            </p>
          </div>
          <div>
            <p className="eyebrow mb-3 opacity-50">entradilla · 17 → 20 px</p>
            <p className="max-w-[48ch] text-entradilla">
              Inter a 18 px con interlínea 1.55. Es el tamaño de la entradilla bajo cada
              titular y el del cuerpo de la prosa.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-3 opacity-50">cuerpo · 17 → 18 px · cifras 1234567890</p>
            <p className="max-w-[60ch] text-cuerpo">
              Texto corrido normal. Los números van con <span className="cifras">tabular-nums</span>{" "}
              donde haya que alinearlos: <span className="cifras">1.234</span> /{" "}
              <span className="cifras">9.876</span>.
            </p>
          </div>
        </div>
      </Seccion>

      {/* ---------- Botones ---------- */}
      <Seccion fondo="papel" tamano="md" id="botones">
        <Titulo
          eyebrow="Botones"
          titulo="Cinco variantes, tres tamaños"
          accion={<Boton variante="enlace">Un enlace de acción</Boton>}
        />
        <div className="flex flex-wrap items-center gap-4">
          <Boton variante="primario">Primario</Boton>
          <Boton variante="menta">Menta</Boton>
          <Boton variante="borde">Borde</Boton>
          <Boton variante="enlace">Enlace</Boton>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Boton tamano="sm">Pequeño</Boton>
          <Boton tamano="md">Mediano</Boton>
          <Boton tamano="lg">
            Grande <IconoFlechaDerecha />
          </Boton>
          <Boton disabled>Desactivado</Boton>
        </div>
      </Seccion>

      {/* La variante `claro` y el `borde` sobre fondo oscuro. */}
      <Seccion fondo="marino" tamano="md">
        <Titulo
          eyebrow="Sobre marino"
          titulo="Los mismos botones, otra banda"
          entradilla="El borde usa currentColor, así que no hace falta una variante por fondo."
        />
        <div className="flex flex-wrap items-center gap-4">
          <Boton variante="claro">Claro</Boton>
          <Boton variante="menta">Menta</Boton>
          <Boton variante="borde">Borde</Boton>
          <Boton variante="enlace">Enlace</Boton>
        </div>
      </Seccion>

      {/* ---------- Subrayado manuscrito ---------- */}
      <Seccion fondo="menta-niebla" tamano="md" id="subrayado">
        <Titulo
          eyebrow="Subrayado"
          titulo="Tres gestos de rotulador"
          entradilla="Se dibujan solos al entrar en pantalla, sin una línea de JavaScript. Recarga y baja despacio."
        />
        <div className="space-y-14">
          <p className="font-display text-titulo">
            Un trazo en <Subrayado variante="onda">onda</Subrayado>
          </p>
          <p className="font-display text-titulo">
            Un trazo <Subrayado variante="recto">recto</Subrayado>
          </p>
          <p className="font-display text-titulo">
            Un trazo <Subrayado variante="doble">doble</Subrayado>
          </p>
          <p className="font-display text-titulo">
            Y en otro <Subrayado variante="onda" color="var(--color-marino)">color</Subrayado>
          </p>
        </div>
      </Seccion>

      {/* ---------- Acento inyectado: la prueba de @theme inline ---------- */}
      <div id="acento">
        {ACENTOS.map((item) => (
          <Seccion
            key={item.nombre}
            fondo="acento"
            tamano="sm"
            style={{ "--acento": item.acento, "--acento-tinta": item.tinta } as CSSProperties}
          >
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="eyebrow mb-2 opacity-60">bg-acento · text-acento-tinta</p>
                <p className="font-display text-subtitulo">{item.nombre}</p>
              </div>
              <span className="cifras rounded-tarjeta border-[1.5px] border-current/30 px-4 py-2 text-nota">
                {item.acento}
              </span>
            </div>
          </Seccion>
        ))}
      </div>

      {/* ---------- Grano, panel y sombras ---------- */}
      <Seccion fondo="papel" tamano="md" id="texturas">
        <Titulo
          eyebrow="Texturas"
          titulo="Grano, panel y sombra de portada"
          entradilla="El grano se nota sobre todo en el bloque de color plano de la derecha."
        />
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="panel relative aspect-[4/5] bg-menta shadow-panel">
            <span className="eyebrow absolute bottom-5 left-5 text-marino opacity-70">sin grano</span>
          </div>
          <div className="panel relative aspect-[4/5] bg-menta shadow-panel">
            <Grano />
            <span className="eyebrow absolute bottom-5 left-5 text-marino opacity-70">con grano</span>
          </div>
          <div className="flex items-center justify-center">
            <div className="aspect-[2/3] w-2/3 rounded-tarjeta bg-marino-tinta shadow-portada" />
          </div>
        </div>
      </Seccion>

      {/* ---------- Prosa ---------- */}
      <Seccion fondo="rosa" tamano="md" id="prosa">
        <Titulo eyebrow="Prosa" titulo="Ritmo de lectura larga" tamano="md" />
        <Columna>
          <Prosa>
            <p>
              Este bloque es el que se usa para la biografía y para las sinopsis de los
              libros. Los márgenes van en <strong>em</strong>, así que el ritmo se
              mantiene aunque cambie el tamaño del bloque entero.
            </p>
            <h2>Un titular dentro de la prosa</h2>
            <p>
              Los enlaces van en azul y <a href="#prosa">engordan el subrayado al pasar</a>{" "}
              por encima. Las cursivas se leen <em>como cursivas de verdad</em> porque la
              Newsreader trae itálica real.
            </p>
            <blockquote>
              La cita va en serif, con un filete azul a la izquierda. Es el único sitio
              donde el cuerpo del texto cambia de familia.
            </blockquote>
            <h3>Y una lista</h3>
            <ul>
              <li>Primer punto, con su marcador tenue.</li>
              <li>Segundo punto, algo más largo para ver cómo cae la segunda línea.</li>
              <li>Tercero.</li>
            </ul>
          </Prosa>
        </Columna>
      </Seccion>

      {/* ---------- Iconos y píldora ---------- */}
      <Seccion fondo="papel" tamano="md" id="iconos">
        <Titulo eyebrow="Iconos" titulo="Nueve SVG propios" tamano="md" />
        <div className="flex flex-wrap gap-4">
          {ICONOS.map(({ nombre, Icono }) => (
            <div
              key={nombre}
              className="pildora flex-col gap-2 bg-white py-5 shadow-tarjeta"
              style={{ minWidth: "7rem" }}
            >
              <Icono className="size-6" />
              <span className="text-nota opacity-60">{nombre}</span>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <p className="eyebrow mb-4 opacity-50">Píldora de navegación</p>
          <nav className="pildora w-full justify-between bg-white shadow-pildora sm:min-h-16">
            <span className="font-display text-rotulo">Carolina Alonso</span>
            <span className="hidden gap-7 text-nota sm:flex">
              <span>Libros</span>
              <span>Escritos</span>
              <span>Sobre mí</span>
            </span>
            <Boton tamano="sm" variante="menta">
              Escríbeme
            </Boton>
          </nav>
        </div>
      </Seccion>

      {/* ---------- Carrusel sin JavaScript ---------- */}
      <Seccion fondo="celeste" tamano="md" aSangre id="carrusel">
        <div className="container">
          <Titulo eyebrow="Carrusel" titulo="Con imán y sin JavaScript" tamano="md" />
        </div>
        <div className="carrusel">
          {ACENTOS.concat(ACENTOS).map((item, indice) => (
            <article
              key={`${item.nombre}-${indice}`}
              className="w-[15rem] rounded-tarjeta bg-papel p-6 shadow-tarjeta"
            >
              <div
                className="mb-4 aspect-[2/3] rounded-tarjeta shadow-portada"
                style={{ backgroundColor: item.acento }}
              />
              <p className="font-display text-rotulo">{item.nombre}</p>
              <p className="text-nota opacity-60">Arrastra de lado</p>
            </article>
          ))}
        </div>
      </Seccion>

      <Seccion fondo="marino" tamano="sm">
        <p className="text-nota opacity-60">
          Página temporal de revisión del sistema de diseño. Bórrala antes de publicar.
        </p>
      </Seccion>
    </main>
  );
}

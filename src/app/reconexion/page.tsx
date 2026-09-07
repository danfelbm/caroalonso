import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Boton } from "@/components/layout/boton";
import { Columna, Seccion, Titulo } from "@/components/layout/seccion";
import { Subrayado } from "@/components/ui/subrayado";
import { formatearPrecio, getServicio } from "@/lib/datos";

/** Hoy solo hay un servicio y esta es su página; el slug puede ser constante. */
const SLUG = "reconexion";

/**
 * El énfasis en mayúsculas venía del sitio en WordPress, donde no había otra
 * forma de subrayar. Aquí se parte la frase por esa marca para pasarle el
 * énfasis al trazo manuscrito, que es el gesto del sitio.
 */
const MARCA_UNICA = "UNA SOLA VEZ";

export async function generateMetadata(): Promise<Metadata> {
  const servicio = await getServicio(SLUG);
  if (!servicio) return {};

  return {
    title: servicio.nombre,
    description: servicio.definicion,
    openGraph: {
      type: "website",
      url: "/reconexion",
      title: `${servicio.nombre} · Un proceso que se hace una sola vez`,
      description: servicio.definicion,
      // La tarjeta la genera `npm run og` por captura; se declara desde ya para
      // que el HTML no cambie el día que el archivo exista.
      images: [{ url: "/og/reconexion.jpg", width: 1200, height: 630, alt: servicio.nombre }],
    },
  };
}

/**
 * RECONEXIÓN
 *
 * El servicio presencial: dos sesiones de una hora en máximo 48 horas, en
 * Bogotá, por 333 dólares. Lo raro —y lo que ordena toda la página— es que se
 * hace una sola vez: no hay paquete, ni segunda sesión, ni suscripción. Por eso
 * ese dato no es un punto más de la lista de pasos, sino una banda entera para
 * él solo entre la definición y el resto del proceso.
 *
 * El marino de la cabecera es el mismo #192D41 del hero, que es lo que ata esta
 * página con la portada del sitio.
 */
export default async function Reconexion() {
  const servicio = await getServicio(SLUG);
  if (!servicio) notFound();

  const { nombre, entradilla, definicion, efectos, proceso, precio, formulario } = servicio;

  // El primer paso no es logística: dice qué clase de cosa es esto. Sube a su
  // propia banda y la lista de abajo se queda con los tres pasos prácticos.
  const [primerPaso, ...pasosPracticos] = proceso.pasos;
  const [antesDeLaMarca, despuesDeLaMarca] = primerPaso.split(MARCA_UNICA);
  const seEncontroLaMarca = despuesDeLaMarca !== undefined;

  return (
    <>
      {/* ---------------------------- Cabecera ---------------------------- */}
      <Seccion fondo="marino-tinta" tamano="lg" conGrano>
        <p className="eyebrow opacity-60">Acompañamiento presencial · Bogotá</p>
        <h1 className="mt-6 max-w-[10ch] text-titular">
          <Subrayado variante="onda" color="var(--color-menta)">
            <em>{nombre}</em>
          </Subrayado>
        </h1>
        <p className="mt-8 max-w-[52ch] text-entradilla opacity-75">{entradilla}</p>
        <div className="mt-10">
          <Boton href="#solicitar" variante="menta" tamano="lg">
            Quiero reconectarme
          </Boton>
        </div>
      </Seccion>

      {/* ------------------------------ Qué es ---------------------------- */}
      <Seccion fondo="papel" tamano="md">
        <div className="max-w-[42rem]">
          <p className="eyebrow text-marino-tenue">Qué es</p>
          <p className="mt-6 font-display text-titulo text-marino-tinta">{definicion}</p>
        </div>
      </Seccion>

      {/* ------------------------ Se hace una sola vez --------------------- */}
      {/* La particularidad del servicio, con la banda entera para ella. */}
      <Seccion fondo="amarillo-claro" tamano="lg" conGrano>
        <div className="max-w-[42rem]">
          <p className="eyebrow text-marino/55">Una sola vez</p>
          <p className="mt-6 font-display text-titulo text-marino">
            {seEncontroLaMarca ? (
              <>
                {antesDeLaMarca}
                <Subrayado variante="doble">{MARCA_UNICA}</Subrayado>
                {despuesDeLaMarca}
              </>
            ) : (
              // Si el texto cambiara y la marca dejara de estar, la frase se
              // pinta entera igual: se pierde el trazo, no el contenido.
              primerPaso
            )}
          </p>
        </div>
      </Seccion>

      {/* ----------------------------- Efectos ---------------------------- */}
      <Seccion fondo="menta-niebla" tamano="md">
        <Titulo
          eyebrow="Qué cambia"
          titulo="Tres efectos que se repiten"
          entradilla={efectos.entradilla}
          tamano="md"
        />
        <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {efectos.lista.map((efecto, indice) => (
            <li key={efecto} className="border-t border-marino/15 pt-6">
              <p aria-hidden className="cifras font-display text-subtitulo text-marino/35">
                {String(indice + 1).padStart(2, "0")}
              </p>
              <p className="mt-4 text-cuerpo text-marino/80">{efecto}</p>
            </li>
          ))}
        </ol>
      </Seccion>

      {/* ----------------------------- El proceso -------------------------- */}
      <Seccion fondo="papel" tamano="md">
        <Columna>
          <Titulo eyebrow="Cómo funciona" titulo={proceso.titular} tamano="md" />
          <ol className="border-t border-marino/12">
            {pasosPracticos.map((paso, indice) => (
              <li
                key={paso}
                className="flex gap-5 border-b border-marino/12 py-6 sm:gap-7 sm:py-7"
              >
                <span
                  aria-hidden
                  className="cifras shrink-0 font-display text-rotulo text-marino-tenue"
                >
                  {String(indice + 1).padStart(2, "0")}
                </span>
                <p className="text-cuerpo text-marino-suave">{paso}</p>
              </li>
            ))}
          </ol>
        </Columna>
      </Seccion>

      {/* ------------------------------ El precio -------------------------- */}
      <Seccion fondo="marino" tamano="lg" conGrano>
        <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-baseline lg:gap-20">
          <div>
            <p className="eyebrow opacity-60">El precio</p>
            <p className="cifras mt-5 font-display text-titular">
              {formatearPrecio(precio)}
            </p>
          </div>
          <p className="max-w-[46ch] text-entradilla opacity-70">{precio.nota}</p>
        </div>
      </Seccion>

      {/* ---------------------------- El formulario ------------------------ */}
      <Seccion fondo="papel" tamano="md" id="solicitar">
        <Columna>
          <Titulo eyebrow="Escríbeme" titulo={formulario.invitacion} tamano="md" />

          {/*
            TODO · AQUÍ VA EL FORMULARIO COMPARTIDO.

            Lo escribe otro frente en `src/components/formularios/` y se inserta
            justo en este hueco, con `nombre="reconexion"` (el valor está en
            `servicio.formulario.nombre`, no lo repitas a mano).

            Campos, en este orden:
              · nombre       — texto, obligatorio
              · correo       — email, obligatorio
              · celular      — tel, opcional
              · comentarios  — textarea

            No se maquetan aquí campos propios: saldrían dos formularios
            distintos para el mismo sitio. Y recuerda que son maquetas: el
            <form> va sin `action` —la política de seguridad lleva
            `form-action 'none'`— y al enviar se anuncia un aviso a lectores de
            pantalla en vez de mandar nada a ningún sitio.
          */}
        </Columna>
      </Seccion>
    </>
  );
}

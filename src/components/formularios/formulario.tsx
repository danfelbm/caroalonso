"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";

import { Boton } from "@/components/layout/boton";
import { ICONOS_RED } from "@/components/layout/navegacion";
import { IconoFlechaDiagonal } from "@/components/ui/iconos";
import { cn } from "@/lib/utils";
import type { Boletin, Red } from "@/types/sitio";

import { FORMULARIO_BOLETIN, type Campo, type Maqueta } from "./campos";

/**
 * EL ÚNICO FORMULARIO DEL SITIO. Lo usan el boletín del pie, la página de
 * contacto y la de reconexión, y los tres son MAQUETAS: no envían nada.
 *
 * Tres decisiones que no se pueden deshacer sin romper la promesa:
 *
 * 1. El `<form>` va SIN `action`. Además, las cabeceras del sitio llevan
 *    `form-action 'none'`, así que si alguien le pusiera uno por descuido el
 *    navegador bloquearía el envío antes de que saliera un solo dato de nadie.
 * 2. `noValidate`. La validación nativa abortaría el envío con un campo vacío y
 *    el aviso —que es toda la respuesta que este formulario sabe dar— no
 *    llegaría nunca. Los `required` se quedan igualmente en los campos: son
 *    ciertos para el lector de pantalla, y quien los lee sabe qué hace falta.
 * 3. Al enviar no se limpian los campos. Lo escrito es de quien lo escribió, y
 *    vaciarlo daría justo la señal contraria a la que da el aviso.
 *
 * `"use client"` está aquí y en ningún otro archivo de esta carpeta: lo único
 * que necesita el navegador es saber si ya se pulsó el botón.
 */

/** El `type` y el teclado de móvil que le toca a cada clase de campo. */
const ENTRADAS: Record<Campo["tipo"], { type: string; inputMode?: "email" | "tel" }> = {
  texto: { type: "text" },
  correo: { type: "email", inputMode: "email" },
  telefono: { type: "tel", inputMode: "tel" },
  // El párrafo no usa <input>; queda declarado para que el registro sea total.
  parrafo: { type: "text" },
};

/**
 * Campos y botón heredan el color de donde caigan (`currentColor` al 5-25 %),
 * así el mismo formulario se lee sobre el papel de `/contacto` y sobre el
 * marino del pie sin una variante por fondo. `min-h-12` son 48 px: por encima
 * de los 44 px mínimos de un objetivo táctil.
 */
const CAMPO =
  "mt-2 block min-h-12 w-full rounded-tarjeta border border-current/25 bg-current/5 px-4 py-3 text-cuerpo " +
  "placeholder:text-current/40 transition-colors hover:border-current/40 focus:border-current/70";

interface FormularioProps {
  maqueta: Maqueta;
  /**
   * Por dónde SÍ se le puede escribir hoy. Sin esto el aviso solo puede
   * mandar a `/contacto`, que es peor: otra página con otra maqueta.
   */
  redes?: Red[];
  /** Sustituye al `aviso` de la maqueta cuando el texto vive en `sitio.json`. */
  aviso?: string;
  /** El bloque de alrededor ya puso el titular (el pie, por ejemplo). */
  conTitulo?: boolean;
  /** El formulario cae sobre una banda oscura: el botón pasa a menta. */
  fondoOscuro?: boolean;
  className?: string;
}

export function Formulario({
  maqueta,
  redes,
  aviso,
  conTitulo = true,
  fondoOscuro = false,
  className,
}: FormularioProps) {
  /*
   * `useState` a secas y sin ningún `useEffect` detrás: esto no lee nada del
   * navegador —no hay medida, ni almacenamiento, ni suscripción— sino que
   * recuerda un gesto que acaba de ocurrir dentro de este mismo componente.
   * Es el caso para el que useState existe.
   */
  const [enviado, setEnviado] = useState(false);

  // Dos formularios en la misma página (contacto y boletín del pie) tendrían
  // los mismos `id` y las etiquetas apuntarían al campo equivocado.
  const prefijo = useId();
  const idAviso = `${prefijo}-aviso`;

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    // Sin esto el navegador recargaría la página con los datos en la URL.
    evento.preventDefault();
    setEnviado(true);
  }

  const textoAviso = aviso ?? maqueta.aviso;

  return (
    <div className={className}>
      {conTitulo && (
        <>
          <h2 className="text-subtitulo">{maqueta.titulo}</h2>
          <p className="mt-4 max-w-[46ch] text-entradilla opacity-70">{maqueta.entradilla}</p>
        </>
      )}

      {/*
        La advertencia va ARRIBA, antes del primer campo. Puesta solo después
        del botón llegaría tarde: quien ya escribió su historia entera en el
        cuadro de texto merecía saberlo en la primera línea.
      */}
      {maqueta.nota && (
        <p className={cn("text-nota opacity-60", conTitulo ? "mt-5" : "mb-5")}>{maqueta.nota}</p>
      )}

      <form noValidate onSubmit={alEnviar} className={cn(conTitulo && "mt-7")}>
        <div className="space-y-5">
          {maqueta.campos.map((campo) => {
            const id = `${prefijo}-${campo.nombre}`;
            const entrada = ENTRADAS[campo.tipo];

            return (
              <div key={campo.nombre}>
                {/* Etiqueta de verdad, atada por `htmlFor`. El marcador de
                    posición, cuando lo hay, es un ejemplo del formato. */}
                <label htmlFor={id} className="block text-nota font-semibold opacity-80">
                  {campo.etiqueta}
                </label>

                {campo.tipo === "parrafo" ? (
                  <textarea
                    id={id}
                    name={campo.nombre}
                    rows={5}
                    required={campo.obligatorio}
                    autoComplete={campo.autocompletado}
                    placeholder={campo.ejemplo}
                    className={cn(CAMPO, "min-h-32 resize-y")}
                  />
                ) : (
                  <input
                    id={id}
                    name={campo.nombre}
                    type={entrada.type}
                    inputMode={entrada.inputMode}
                    required={campo.obligatorio}
                    autoComplete={campo.autocompletado}
                    placeholder={campo.ejemplo}
                    className={CAMPO}
                  />
                )}
              </div>
            );
          })}
        </div>

        <Boton
          type="submit"
          variante={fondoOscuro ? "menta" : "primario"}
          tamano="md"
          // `aria-describedby` ata el botón con la región del aviso: quien
          // navega con teclado vuelve al botón y oye por qué no pasó nada.
          aria-describedby={enviado ? idAviso : undefined}
          className="mt-7 w-full sm:w-auto"
        >
          {maqueta.textoBoton}
        </Boton>
      </form>

      {/*
        La región viva se pinta SIEMPRE, vacía hasta que haga falta. Un
        contenedor con `aria-live` que aparece a la vez que su contenido no se
        anuncia: el lector de pantalla tiene que haberlo registrado antes de
        que cambie.
      */}
      <div id={idAviso} role="status" aria-live="polite" className="mt-6 empty:mt-0">
        {enviado && (
          <div className="rounded-panel border border-current/20 bg-current/6 p-5 sm:p-6">
            <p className="font-display text-rotulo">{maqueta.confirmacion}</p>
            <p className="mt-3 text-cuerpo opacity-75">{textoAviso}</p>

            {redes && redes.length > 0 ? (
              <>
                <p className="mt-5 text-cuerpo opacity-75">
                  Mientras tanto, también me encuentras aquí:
                </p>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                  {redes.map((red) => {
                    const Icono = ICONOS_RED[red.plataforma];
                    return (
                      <li key={red.plataforma}>
                        <a
                          href={red.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tactil inline-flex min-h-11 items-center gap-2 font-medium"
                        >
                          <Icono aria-hidden className="text-[1.125rem] opacity-60" />
                          <span className="enlace">{red.nombre}</span>
                          <IconoFlechaDiagonal aria-hidden className="text-[0.875rem] opacity-45" />
                          <span className="sr-only">
                            {red.usuario}, se abre en otra pestaña
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p className="mt-5 text-cuerpo opacity-75">
                En{" "}
                <Link href="/contacto" className="enlace font-medium">
                  contacto
                </Link>{" "}
                están sus redes, que sí funcionan.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

interface FormularioBoletinProps {
  boletin: Boletin;
  /** Ver `redes` en `<Formulario>`. Conviene pasarlas desde `layout.tsx`. */
  redes?: Red[];
}

/**
 * El boletín del pie.
 *
 * Existe para que `layout.tsx` pueda escribir exactamente lo que promete el
 * TODO de `footer.tsx` —`formulario={<FormularioBoletin boletin={boletin} />}`—
 * sin saber nada de maquetas ni de campos.
 *
 * `boletin.etiquetaCampo` y `boletin.textoBoton` mandan sobre los de
 * `campos.ts`: son textos de pantalla que Carolina tiene que poder cambiar sin
 * abrir un `.tsx`, y ahí es donde están declarados para ella.
 */
export function FormularioBoletin({ boletin, redes }: FormularioBoletinProps) {
  const maqueta: Maqueta = {
    ...FORMULARIO_BOLETIN,
    textoBoton: boletin.textoBoton,
    campos: FORMULARIO_BOLETIN.campos.map((campo) =>
      campo.tipo === "correo" ? { ...campo, etiqueta: boletin.etiquetaCampo } : campo,
    ),
  };

  return (
    <Formulario
      maqueta={maqueta}
      redes={redes}
      /*
       * Sin `aviso`: aquí manda el de `campos.ts`. `boletin.aviso` sí se pinta,
       * pero lo pinta el pie por su cuenta y de forma permanente, justo debajo
       * de este formulario. Pasárselo también al aviso de envío pondría la
       * misma frase dos veces con cuatro líneas de por medio.
       */
      // El pie pone el titular y la entradilla del bloque: repetirlos aquí
      // dejaría dos encabezados seguidos diciendo lo mismo.
      conTitulo={false}
      fondoOscuro
    />
  );
}

"use client";

import { useSyncExternalStore } from "react";

/**
 * Suscripciones a estado del navegador.
 *
 * Van con `useSyncExternalStore` y no con `useState` + `useEffect`: el scroll y
 * las media queries son estado externo, y leerlos con un efecto que llama a
 * `setState` provoca renders en cascada. Además, así el valor del servidor es
 * explícito y no hay desajuste de hidratación.
 */

const sinSuscripcion = () => () => {};

/** `true` cuando la página está desplazada más allá del umbral. */
export function useDesplazado(umbral = 24): boolean {
  return useSyncExternalStore(
    (avisar) => {
      window.addEventListener("scroll", avisar, { passive: true });
      return () => window.removeEventListener("scroll", avisar);
    },
    () => window.scrollY > umbral,
    () => false,
  );
}

const consultas = new Map<string, MediaQueryList>();

function listaDe(consulta: string): MediaQueryList {
  let lista = consultas.get(consulta);
  if (!lista) {
    lista = window.matchMedia(consulta);
    consultas.set(consulta, lista);
  }
  return lista;
}

/** `null` durante el renderizado en el servidor; el booleano en el cliente. */
export function useMediaQuery(consulta: string): boolean | null {
  return useSyncExternalStore(
    (avisar) => {
      const lista = listaDe(consulta);
      lista.addEventListener("change", avisar);
      return () => lista.removeEventListener("change", avisar);
    },
    () => listaDe(consulta).matches,
    () => null,
  );
}

/** `true` si el navegador pide ahorrar datos. En el servidor, `false`. */
export function useAhorroDeDatos(): boolean {
  return useSyncExternalStore(
    sinSuscripcion,
    () =>
      Boolean(
        (navigator as Navigator & { connection?: { saveData?: boolean } })
          .connection?.saveData,
      ),
    () => false,
  );
}

/**
 * Se pone en `true` cuando la página ya cargó y el hilo principal está libre.
 *
 * Sirve para retrasar descargas grandes —el video del hero pesa más de un
 * mega— hasta después del primer pintado. Si se piden de entrada, compiten con
 * el HTML, las fuentes y el póster, y se llevan por delante el LCP.
 *
 * Es un store a nivel de módulo y no un `useState` dentro de un efecto: así el
 * disparo ocurre una sola vez por carga aunque lo consulten varios componentes,
 * y no provoca renders en cascada.
 */
let ocioso = false;
const enEspera = new Set<() => void>();

function avisarOcioso() {
  if (ocioso) return;
  ocioso = true;
  for (const avisar of enEspera) avisar();
}

function programarOcioso() {
  /*
   * Dos fotogramas y un respiro: para cuando llega el segundo, el navegador ya
   * pintó el póster y el video puede empezar a pedirse.
   *
   * Esperar a `load` sería lo obvio y es un error medido: `load` no llega hasta
   * que terminan las fuentes, todo el JavaScript y hasta la última imagen de la
   * página, y en el proyecto hermano eso retrasaba la primera petición del
   * video hasta los tres segundos. El póster no sufre por adelantarlo, porque
   * va con `fetchPriority="high"` y ya está pedido cuando esto se dispara.
   */
  if (document.readyState === "complete") {
    avisarOcioso();
    return;
  }

  requestAnimationFrame(() =>
    requestAnimationFrame(() => setTimeout(avisarOcioso, 60)),
  );
}

export function useDespuesDelPintado(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      if (!ocioso) {
        enEspera.add(avisar);
        programarOcioso();
      }
      return () => {
        enEspera.delete(avisar);
      };
    },
    () => ocioso,
    () => false,
  );
}

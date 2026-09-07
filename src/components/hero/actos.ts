/**
 * Los cuatro actos del hero, como datos puros: sin JSX, para que las curvas se
 * puedan leer, comparar y comprobar de un vistazo.
 *
 * ## La regla que ya rompió el sitio hermano dos veces
 *
 * Cada array de rangos —`entrada`, y los de las capas de abajo— **empieza en 0,
 * termina en 1, y todos sus valores van dentro de [0, 1] en orden creciente**.
 *
 * 1. Motion pasa estos números tal cual como *offsets* a la Web Animations API,
 *    que solo los admite dentro de ese intervalo: un `1.05` o un `-0.05` no
 *    rompen su animación, rompen el montaje del hero entero con «Offsets must be
 *    monotonically non-decreasing».
 * 2. Fuera de su rango la opacidad no se queda clavada en el último valor como
 *    cabría esperar: vuelve a subir. Si el rango no llega hasta 1, el primer
 *    acto reaparece por encima del cuarto justo cuando aparecen los botones.
 *    Declarando los extremos —repitiendo el valor que debe mantenerse— el
 *    resultado deja de depender de ese comportamiento.
 *
 * `comprobarRangos()` la verifica en desarrollo, abajo, y avisa **antes** de que
 * el navegador tire su «Failed to execute 'animate' on 'Element'», que no dice
 * qué rango lo causó.
 *
 * De paso, un aviso para cuando toque depurar esto: motion entrega estas curvas
 * al navegador como una animación de la Web Animations API atada a la posición
 * del scroll, no las escribe fotograma a fotograma en el atributo `style`. Leer
 * `elemento.style.opacity` desde la consola devuelve el valor del servidor y
 * parece que nada se mueve; el bueno es el de `getComputedStyle`.
 *
 * ## Cómo se reparten los quince segundos de video
 *
 * El progreso del scroll es también el tiempo del video, así que estos números
 * son la sincronía entre texto e imagen. Los cuatro tramos del video ocupan un
 * cuarto cada uno, y cada acto está del todo visible dentro del suyo:
 *
 * | progreso  | video                        | acto visible |
 * |-----------|------------------------------|--------------|
 * | 0 – 0,25  | mar nocturno                 | 1 (0 – 0,16) |
 * | 0,25 – 0,5| la brújula de estrellas      | 2 (0,29 – 0,44) |
 * | 0,5 – 0,75| la figura que camina         | 3 (0,58 – 0,71) |
 * | 0,75 – 1  | el amanecer                  | 4 (0,85 – 1) |
 *
 * El primero arranca visible —es lo que se ve al abrir la página, antes de
 * tocar nada— y el último se queda hasta el final, para que los botones sigan
 * ahí cuando se deja de bajar.
 */

export interface Acto {
  /** Offsets del recorrido. Ver la regla de arriba antes de tocarlos. */
  entrada: number[];
  opacidad: number[];
  /** Desplazamiento vertical en píxeles: entra desde abajo, sale hacia arriba. */
  y: number[];
  /**
   * Placa local detrás del texto. Solo del tercer acto en adelante: ahí el cielo
   * abre al amanecer y el texto claro se pierde sobre rosa y dorado. La placa
   * resuelve el contraste donde hace falta, sin apagar con un velo más denso
   * justo lo que hay que ver.
   */
  placa?: boolean;
}

export const ACTOS: Acto[] = [
  // «¿Perdiste tu norte?» sobre el mar nocturno. Sale hacia arriba en cuanto
  // empieza a dibujarse la brújula.
  {
    entrada: [0, 0.16, 0.23, 1],
    opacidad: [1, 1, 0, 0],
    y: [0, 0, -24, -24],
  },
  // La brújula estelar ya completa.
  {
    entrada: [0, 0.21, 0.29, 0.44, 0.52, 1],
    opacidad: [0, 0, 1, 1, 0, 0],
    y: [24, 24, 0, 0, -24, -24],
  },
  // La figura caminando hacia el horizonte, con el cielo ya abriendo.
  {
    entrada: [0, 0.5, 0.58, 0.71, 0.79, 1],
    opacidad: [0, 0, 1, 1, 0, 0],
    y: [24, 24, 0, 0, -24, -24],
    placa: true,
  },
  // El amanecer y la salida del hero.
  {
    entrada: [0, 0.77, 0.85, 1],
    opacidad: [0, 0, 1, 1],
    y: [24, 24, 0, 0],
    placa: true,
  },
];

/**
 * El velo negro sobre el video, con su propia curva.
 *
 * Se mantiene suave a propósito y **baja** hacia el final: los dos primeros
 * actos caen sobre mar nocturno y les basta con esto, y a partir del tercero un
 * velo lo bastante denso para sostener texto claro sobre el amanecer apagaría
 * el amanecer, que es lo que hay que ver. Ahí toma el relevo la placa.
 */
export const VELO = {
  entrada: [0, 0.45, 0.8, 1],
  opacidad: [0.24, 0.3, 0.18, 0.12],
};

/** Sin movimiento no hay recorrido, así que el velo es un valor fijo. */
export const VELO_QUIETO = 0.4;

/** «Desplaza»: se va en cuanto se empieza a bajar y no vuelve. */
export const INDICADOR = {
  entrada: [0, 0.08, 1],
  opacidad: [1, 0, 0],
};

/**
 * Comprueba la regla de arriba y avisa por consola en desarrollo.
 *
 * Va aquí y no en un test porque el fallo que previene no se ve en el hero: se
 * lleva por delante el montaje del árbol entero, y el mensaje de motion no dice
 * qué rango lo causó. Este sí.
 */
function comprobarRangos(nombre: string, entrada: number[], ...paralelos: number[][]) {
  const problemas: string[] = [];

  if (entrada[0] !== 0) problemas.push(`no empieza en 0 (empieza en ${entrada[0]})`);
  if (entrada[entrada.length - 1] !== 1)
    problemas.push(`no termina en 1 (termina en ${entrada[entrada.length - 1]})`);

  for (const [i, valor] of entrada.entries()) {
    if (valor < 0 || valor > 1) problemas.push(`el valor ${valor} (posición ${i}) se sale de [0, 1]`);
    if (i > 0 && valor < entrada[i - 1])
      problemas.push(`${valor} va detrás de ${entrada[i - 1]}: el orden tiene que ser creciente`);
  }

  for (const paralelo of paralelos) {
    if (paralelo.length !== entrada.length)
      problemas.push(`hay ${entrada.length} offsets y ${paralelo.length} valores`);
  }

  if (problemas.length > 0) {
    console.error(`Hero, rangos de ${nombre}: ${problemas.join("; ")}.`);
  }
}

if (process.env.NODE_ENV !== "production") {
  ACTOS.forEach((acto, i) =>
    comprobarRangos(`acto ${i + 1}`, acto.entrada, acto.opacidad, acto.y),
  );
  comprobarRangos("velo", VELO.entrada, VELO.opacidad);
  comprobarRangos("indicador", INDICADOR.entrada, INDICADOR.opacidad);
}

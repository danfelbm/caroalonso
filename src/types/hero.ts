/**
 * El manifiesto del vídeo de portada.
 *
 * `src/data/hero.json` no se escribe a mano: lo genera
 * `scripts/5-hero-recodificar.mjs` cada vez que recodifica los cortes, y por eso
 * las rutas llevan huella del contenido en el nombre. Este tipo existe para que
 * quien pinta el hero lea ese archivo con garantías y no a ciegas.
 */

/** Medidas reales de un corte, tomadas del archivo ya codificado. */
export interface CorteHero {
  fps: number;
  /** Peso en bytes. El script falla si se pasa del presupuesto. */
  peso: number;
  /** El hero reparte el scroll por cuadros, así que necesita saber cuántos hay. */
  cuadros: number;
}

export interface Hero {
  videoMovil: string;
  videoEscritorio: string;
  /** El primer cuadro: lo que se ve mientras el vídeo carga. */
  posterMovil: string;
  posterEscritorio: string;
  /** El último cuadro: con lo que se queda la página cuando el scroll termina. */
  quietoMovil: string;
  quietoEscritorio: string;
  /** Segundos. */
  duracion: number;
  movil: CorteHero;
  escritorio: CorteHero;
  /**
   * Los cortes salen de un relleno generado, no del vídeo de verdad. Sirve para
   * no dar por bueno un despliegue con el hero de mentira.
   */
  provisional: boolean;
}

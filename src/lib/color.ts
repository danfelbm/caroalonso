/**
 * Utilidades de color para las secciones teñidas y las portadas.
 *
 * La paleta Lookback mezcla fondos muy claros con la tinta marina, así que
 * ningún componente decide a ojo si el texto va claro u oscuro: lo pregunta
 * aquí y así todas las secciones se comportan igual.
 */

/** Los dos extremos de la paleta: sobre uno u otro acaba cayendo todo el texto. */
export const TINTA = "#051324";
export const PAPEL = "#FBF8F6";

export function esOscuro(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Luminancia relativa aproximada.
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.55;
}

/** Texto y trazo legibles sobre un fondo dado. */
export function contraste(hex: string) {
  const oscuro = esOscuro(hex);
  return {
    texto: oscuro ? PAPEL : TINTA,
    suave: oscuro ? "rgba(251,248,246,0.72)" : "rgba(5,19,36,0.65)",
    trazo: oscuro ? "rgba(251,248,246,0.55)" : "rgba(5,19,36,0.35)",
    oscuro,
  };
}

function luminancia(hex: string) {
  const h = hex.replace("#", "");
  const canal = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(0) + 0.7152 * canal(2) + 0.0722 * canal(4);
}

function ratioContraste(a: string, b: string) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function mezclarConTinta(hex: string, factor: number) {
  const h = hex.replace("#", "");
  const tinta = [0x05, 0x13, 0x24];
  return (
    "#" +
    [0, 2, 4]
      .map((i, k) => Math.round(parseInt(h.slice(i, i + 2), 16) * (1 - factor) + tinta[k] * factor).toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Versión del color legible como texto pequeño sobre un fondo claro (≥ 4.5:1).
 *
 * Los colores de portada son colores de tinta de imprenta, no de pantalla: el
 * amarillo de «Reinventa el amor» sobre papel es ilegible. Esto los oscurece
 * lo justo para poder usarlos en un titular o en un dato.
 */
export function colorTexto(hex: string, fondo = PAPEL) {
  let color = hex;
  for (let i = 0; i < 12 && ratioContraste(color, fondo) < 4.5; i++) color = mezclarConTinta(color, 0.12);
  return color;
}

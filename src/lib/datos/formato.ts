/**
 * Utilidades puras: rutas y formato de texto y fecha.
 *
 * Es el único archivo de `lib/datos` sin `server-only`, y por tanto el único
 * que puede importar un componente de cliente. Aquí no se lee ningún dato: el
 * día que el contenido se mude a Supabase, este archivo no cambia.
 */

import type { Precio } from "@/types/contenido";

/* --------------------------------- Rutas --------------------------------- */

export function urlLibro(slug: string) {
  return `/libros/${slug}`;
}

/** Las ocho fichas viven en una sola página; cada una es un ancla. */
export function urlRecomendacion(slug: string) {
  return `/recomendaciones#${slug}`;
}

export function urlServicio(slug: string) {
  return `/${slug}`;
}

/**
 * Ruta de una portada dentro de `public/libros/`.
 *
 * El JSON guarda solo el nombre base porque de cada portada hay varios
 * formatos y tamaños, y quien pinta decide cuál pide.
 */
export function rutaPortada(base: string, extension = "webp") {
  return `/libros/${base}.${extension}`;
}

/* --------------------------------- Vídeo --------------------------------- */

export function urlVideo(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** Dominio sin cookies: los episodios se incrustan sin rastrear a nadie. */
export function urlIncrustadoVideo(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

export function urlIncrustadoSpotify(showId: string) {
  return `https://open.spotify.com/embed/show/${showId}`;
}

/* --------------------------------- Texto --------------------------------- */

export function entrecomillar(texto: string) {
  return `«${texto}»`;
}

/** El primero del ciclo no lleva número, así que la etiqueta se compone aquí. */
export function etiquetaEpisodio(orden: number) {
  return orden === 0 ? "Episodio de introducción" : `Episodio ${orden}`;
}

/**
 * El año con su reserva cuando las fuentes no coinciden.
 * Esta es la única frase «(por confirmar)» del sitio; ver docs/por-confirmar.md.
 */
export function anioLegible(anio: number, porConfirmar = false) {
  return porConfirmar ? `${anio} (por confirmar)` : `${anio}`;
}

export function formatearPrecio({ cantidad, moneda }: Pick<Precio, "cantidad" | "moneda">) {
  return `${moneda} $${cantidad}`;
}

export function formatearFecha(
  fecha: string,
  opciones: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
) {
  // La fecha llega como YYYY-MM-DD; se fija mediodía para evitar saltos de zona horaria.
  return new Intl.DateTimeFormat("es-CO", opciones).format(new Date(`${fecha}T12:00:00`));
}

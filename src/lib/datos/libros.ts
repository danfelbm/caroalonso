import "server-only";

import { cache } from "react";

import librosJson from "@/data/libros.json";
import type { Libro, LibrosAdyacentes } from "@/types/libro";

/**
 * Los siete libros, del más reciente al más antiguo.
 *
 * Es la única lectura del catálogo: todo lo demás de este archivo deriva en
 * memoria de lo que devuelve esta función, que `cache()` resuelve una sola vez
 * por petición. El día que llegue Supabase, cambia solo este cuerpo.
 */
export const getLibros = cache(async (): Promise<Libro[]> => {
  return (librosJson as Libro[]).slice().sort((a, b) => b.anio - a.anio);
});

export async function getLibro(slug: string): Promise<Libro | null> {
  const libros = await getLibros();
  return libros.find((libro) => libro.slug === slug) ?? null;
}

/** El lanzamiento vigente, el que abre la página de libros. */
export async function getLibroDestacado(): Promise<Libro | null> {
  const libros = await getLibros();
  return libros.find((libro) => libro.destacado) ?? libros[0] ?? null;
}

export async function getLibrosPorEstado(estado: Libro["estado"]): Promise<Libro[]> {
  return (await getLibros()).filter((libro) => libro.estado === estado);
}

/**
 * Anterior y siguiente en el catálogo, en círculo.
 *
 * Circular a propósito: son siete fichas y ninguna debe quedarse sin salida.
 */
export async function getLibrosAdyacentes(slug: string): Promise<LibrosAdyacentes> {
  const libros = await getLibros();
  const i = libros.findIndex((libro) => libro.slug === slug);
  if (i === -1 || libros.length < 2) return { anterior: null, siguiente: null };
  return {
    anterior: libros[(i - 1 + libros.length) % libros.length],
    siguiente: libros[(i + 1) % libros.length],
  };
}

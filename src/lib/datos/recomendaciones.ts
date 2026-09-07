import "server-only";

import { cache } from "react";

import recomendacionesJson from "@/data/recomendaciones.json";
import type { Recomendacion, TipoRecomendacion } from "@/types/contenido";

/** Las ocho fichas, de la más reciente a la más antigua. */
export const getRecomendaciones = cache(async (): Promise<Recomendacion[]> => {
  return (recomendacionesJson as Recomendacion[])
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
});

export async function getRecomendacion(slug: string): Promise<Recomendacion | null> {
  const recomendaciones = await getRecomendaciones();
  return recomendaciones.find((r) => r.slug === slug) ?? null;
}

export async function getRecomendacionesPorTipo(tipo: TipoRecomendacion): Promise<Recomendacion[]> {
  return (await getRecomendaciones()).filter((r) => r.tipo === tipo);
}

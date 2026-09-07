import "server-only";

import { cache } from "react";

import serviciosJson from "@/data/servicios.json";
import type { Servicio } from "@/types/contenido";

/** Hoy solo hay uno, la Reconexión, pero la forma admite más. */
export const getServicios = cache(async (): Promise<Servicio[]> => {
  return serviciosJson as Servicio[];
});

export async function getServicio(slug: string): Promise<Servicio | null> {
  const servicios = await getServicios();
  return servicios.find((servicio) => servicio.slug === slug) ?? null;
}

export async function getReconexion(): Promise<Servicio | null> {
  return getServicio("reconexion");
}

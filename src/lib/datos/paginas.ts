import "server-only";

import { cache } from "react";

import heroinaJson from "@/data/heroina.json";
import quienSoyJson from "@/data/quien-soy.json";
import type { AparicionPrensa, Episodio, Heroina, QuienSoy } from "@/types/contenido";

/** Páginas de un solo contenido: su texto vive en un JSON propio. */

export const getQuienSoy = cache(async (): Promise<QuienSoy> => {
  return quienSoyJson as QuienSoy;
});

export const getHeroina = cache(async (): Promise<Heroina> => {
  return heroinaJson as Heroina;
});

export async function getEpisodios(): Promise<Episodio[]> {
  return (await getHeroina()).episodios.slice().sort((a, b) => a.orden - b.orden);
}

export async function getEpisodio(orden: number): Promise<Episodio | null> {
  return (await getEpisodios()).find((episodio) => episodio.orden === orden) ?? null;
}

export async function getPrensa(): Promise<AparicionPrensa[]> {
  return (await getHeroina()).prensa;
}

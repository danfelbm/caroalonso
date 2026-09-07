import "server-only";

import { cache } from "react";

import podcastJson from "@/data/podcast.json";
import type { CanalYouTube, Podcast, ProgramaPodcast } from "@/types/contenido";

/** El programa en Spotify y los dos canales de YouTube. */
export const getPodcast = cache(async (): Promise<Podcast> => {
  return podcastJson as Podcast;
});

export async function getPrograma(): Promise<ProgramaPodcast> {
  return (await getPodcast()).programa;
}

/**
 * Los canales que hoy se pueden enlazar.
 *
 * «Love is Real» existe y ella lo nombra en su biografía, pero nadie ha dado
 * todavía su dirección: se guarda con `url: null` para no inventarla y se
 * excluye de aquí para no pintar un enlace roto.
 */
export async function getCanalesEnlazables(): Promise<CanalYouTube[]> {
  return (await getPodcast()).canales.filter((canal) => canal.url !== null);
}

import "server-only";

import { cache } from "react";

import heroJson from "@/data/hero.json";
import sitioJson from "@/data/sitio.json";
import type { Hero } from "@/types/hero";
import type { Boletin, Destino, Red, Sitio } from "@/types/sitio";

/** Identidad, redes y navegación: lo que necesita cada plantilla. */
export const getSitio = cache(async (): Promise<Sitio> => {
  return sitioJson as Sitio;
});

export async function getNavegacion(): Promise<Destino[]> {
  return (await getSitio()).navegacion;
}

export async function getNavegacionSecundaria(): Promise<Destino[]> {
  return (await getSitio()).navegacionSecundaria;
}

export async function getRedes(): Promise<Red[]> {
  return (await getSitio()).redes;
}

export async function getBoletin(): Promise<Boletin> {
  return (await getSitio()).boletin;
}

/**
 * El manifiesto del vídeo de portada.
 *
 * Lo escribe `scripts/5-hero-recodificar.mjs`, no una persona. Se sirve desde
 * aquí para que el hero no importe un JSON suelto y para que `provisional`
 * pase por un solo sitio.
 */
export const getHero = cache(async (): Promise<Hero> => {
  return heroJson as Hero;
});

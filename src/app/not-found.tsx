import Link from "next/link";

import { Seccion } from "@/components/layout/seccion";
import { IconoFlechaDerecha } from "@/components/ui/iconos";
import { Subrayado } from "@/components/ui/subrayado";
import { getSitio } from "@/lib/datos";

export const metadata = {
  title: "Página no encontrada",
  // Una página de error no tiene nada que indexar, y si se indexa compite en
  // los resultados con las páginas que sí existen.
  robots: { index: false, follow: true },
};

/**
 * El 404.
 *
 * Sin ilustración ni cifra gigante: el sitio no tiene ese lenguaje, y una
 * imagen inventada para un error sería la única pieza del sitio que no viene de
 * ella. Lo que sí hereda es su vocabulario —perder el norte, el camino de
 * regreso—, que es de dónde salió «Sé la heroína de tu historia».
 *
 * La lista de destinos se lee de `getSitio()`: si mañana cambia la navegación,
 * esta página cambia con ella y nadie tiene que acordarse.
 */
export default async function NoEncontrada() {
  const { navegacion, navegacionSecundaria } = await getSitio();

  return (
    <Seccion fondo="papel" tamano="xl" conGrano>
      <div className="mx-auto max-w-[34rem] text-center">
        <p className="eyebrow opacity-50">Error 404</p>
        <h1 className="mt-6 text-titular">
          Aquí se perdió el{" "}
          <Subrayado variante="onda">
            <em>norte</em>
          </Subrayado>
        </h1>
        <p className="mx-auto mt-8 max-w-[44ch] text-entradilla opacity-70">
          La dirección que buscas no existe o cambió de lugar. No pasa nada; aquí abajo está
          el camino de regreso.
        </p>
      </div>

      <nav aria-labelledby="404-destinos" className="mx-auto mt-14 max-w-[34rem]">
        <h2 id="404-destinos" className="sr-only">
          Destinos del sitio
        </h2>
        <ul className="border-t border-marino/12">
          {navegacion.map((destino) => (
            <li key={destino.ruta} className="border-b border-marino/12">
              <Link
                href={destino.ruta}
                className="tactil group flex min-h-16 items-center justify-between gap-4 font-display text-rotulo text-marino hover:text-azul"
              >
                {destino.titulo}
                <IconoFlechaDerecha className="shrink-0 text-[1.125rem] text-marino-tenue transition-[color,transform] duration-300 ease-suave group-hover:translate-x-1 group-hover:text-azul" />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-1 text-cuerpo opacity-65">
          <span className="text-nota">También:</span>
          {navegacionSecundaria.map((destino) => (
            <Link key={destino.ruta} href={destino.ruta} className="tactil enlace hover:text-azul">
              {destino.titulo}
            </Link>
          ))}
        </p>
      </nav>
    </Seccion>
  );
}

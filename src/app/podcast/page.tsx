import type { Metadata } from "next";

import { Boton } from "@/components/layout/boton";
import { Seccion, Titulo } from "@/components/layout/seccion";
import { Canal } from "@/components/podcast/canal";
import { IncrustacionDiferida } from "@/components/podcast/incrustacion-diferida";
import { IconoSpotify } from "@/components/ui/iconos";
import { Subrayado } from "@/components/ui/subrayado";
import { getCanalesEnlazables, getPodcast, getSitio, urlIncrustadoSpotify } from "@/lib/datos";
import { cn } from "@/lib/utils";

const DESCRIPCION =
  "«Coordenadas del alma», el podcast que Carolina Alonso hace con dos amigas coaches, y su canal de YouTube.";

export async function generateMetadata(): Promise<Metadata> {
  const { identidad } = await getSitio();
  const titulo = "Podcast";

  return {
    title: titulo,
    description: DESCRIPCION,
    alternates: { canonical: "/podcast" },
    openGraph: {
      type: "website",
      url: "/podcast",
      title: `${titulo} · ${identidad.firma}`,
      description: DESCRIPCION,
      // La genera `npm run og` por captura; se declara aunque aún no exista.
      images: [{ url: "/og/podcast.jpg", width: 1200, height: 630, alt: titulo }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${titulo} · ${identidad.firma}`,
      description: DESCRIPCION,
      images: ["/og/podcast.jpg"],
    },
  };
}

export default async function PaginaPodcast() {
  const { entradilla, programa } = await getPodcast();
  /*
   * `getCanalesEnlazables()` deja fuera «Love is Real», que existe pero cuyo
   * enlace nadie ha dado todavía (docs/por-confirmar.md, punto 3). No se
   * nombra en esta página a propósito: quien entra a un sitio llamado
   * «Podcast» viene a darle al play, y un canal escrito sin destino solo manda
   * a buscarlo por su cuenta. Cuando llegue la dirección, aparece solo.
   */
  const canales = await getCanalesEnlazables();

  return (
    <>
      {/* ------------------------------ Cabecera ------------------------------ */}
      <Seccion fondo="lavanda-claro" tamano="lg" conGrano>
        <Titulo
          nivel="h1"
          tamano="xl"
          eyebrow="Podcast y canales"
          titulo={
            <>
              Historias para{" "}
              <Subrayado variante="onda">
                <em>escuchar</em>
              </Subrayado>{" "}
              despacio
            </>
          }
          entradilla={entradilla}
          className="mb-0"
        />
      </Seccion>

      {/* ------------------------------ El programa --------------------------- */}
      <Seccion fondo="papel" tamano="lg" conGrano>
        <Titulo
          eyebrow={`El programa · ${programa.plataforma}`}
          titulo={programa.nombre}
          entradilla={programa.descripcion}
        />

        <IncrustacionDiferida
          src={urlIncrustadoSpotify(programa.showId)}
          tituloIncrustado={`Reproductor de ${programa.nombre} en ${programa.plataforma}`}
          eyebrow="Reproductor"
          encabezado="Escúchalo aquí mismo"
          descripcion="Todos los episodios, sin salir de esta página."
          textoBoton="Cargar el reproductor"
          nota="Hasta que pulses, esta página no le pide nada a Spotify ni le cuenta a nadie que pasaste por aquí."
          enlaceAlterno={{ url: programa.url, texto: `Abrir en ${programa.plataforma}` }}
          adorno={<IconoSpotify className="text-[13rem]" />}
        />
      </Seccion>

      {/* ------------------------------ Los canales --------------------------- */}
      {canales.length > 0 && (
        <Seccion fondo="menta-niebla" tamano="lg" conGrano>
          <Titulo
            eyebrow="En video"
            titulo="También publica en YouTube"
            entradilla="Reflexiones y herramientas, subidas con regularidad."
          />

          {/* Con un solo canal, dos columnas dejan medio ancho vacío al lado;
              con dos, la rejilla es la forma correcta. Lo decide el dato. */}
          <ul
            className={cn(
              "grid list-none gap-6",
              canales.length > 1 ? "sm:grid-cols-2" : "max-w-[40rem]",
            )}
          >
            {canales.map((canal) => (
              <li key={canal.slug} className="flex">
                <Canal canal={canal} />
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {/* ------------------------------- Cierre ------------------------------- */}
      <Seccion fondo="amarillo-claro" tamano="md">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="max-w-[20ch] text-subtitulo">Hay más para escuchar</h2>
            <p className="mt-4 max-w-[46ch] text-entradilla opacity-75">
              El ciclo de episodios sobre «Sé la heroína de tu historia» va capítulo por
              capítulo del libro.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Boton href="/se-la-heroina">Ver el ciclo</Boton>
            <Boton href="/contacto" variante="borde">
              Escribirle
            </Boton>
          </div>
        </div>
      </Seccion>
    </>
  );
}

import { entrecomillar } from "@/lib/datos";
import { cn } from "@/lib/utils";
import type { Libro } from "@/types/libro";

interface CitaLibroProps {
  libro: Pick<Libro, "titulo" | "cita">;
  /** El acento del libro, ya calculado contra el fondo donde cae el filete. */
  color: string;
  tamano?: "md" | "lg";
  className?: string;
}

/**
 * La frase que el libro se dice a sí mismo, en serif y con un filete del color
 * de su portada. Es el único sitio de la ficha donde el acento se ve como una
 * línea y no como una etiqueta.
 *
 * Devuelve `null` cuando el libro no tiene cita —cinco de los siete no la
 * tienen— para que quien la use no tenga que preguntar antes.
 */
export function CitaLibro({ libro, color, tamano = "md", className }: CitaLibroProps) {
  if (!libro.cita) return null;

  // En la ficha, la fuente es el propio libro cuyo título se acaba de leer dos
  // centímetros más arriba. Repetirlo no informa de nada.
  const fuente = libro.cita.fuente === libro.titulo ? null : libro.cita.fuente;

  return (
    <figure className={cn("border-l-[3px] pl-5 sm:pl-7", className)} style={{ borderColor: color }}>
      <blockquote
        className={cn("font-display", tamano === "lg" ? "text-rotulo" : "text-entradilla")}
      >
        {entrecomillar(libro.cita.texto)}
      </blockquote>
      {fuente && <figcaption className="mt-4 text-nota opacity-55">{fuente}</figcaption>}
    </figure>
  );
}

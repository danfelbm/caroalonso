import type { NodoJsonLd } from "@/lib/seo";

/**
 * DATOS ESTRUCTURADOS
 *
 * Este componente existe por una sola línea: el `replaceAll("<", "\\u003c")`.
 *
 * Dentro de un `<script>`, el HTML no interpreta entidades: el analizador solo
 * busca la secuencia literal `</script` para saber dónde termina el bloque. Si
 * un texto del catálogo llevara `</script>` —o cualquier `<`, que basta para
 * abrir una etiqueta en cuanto alguien escriba una— el JSON cerraría el script
 * antes de tiempo y lo que viniera detrás se pintaría como marcado de la
 * página. Escrito como la fuga `\u003c` —la que el propio JSON define para ese
 * carácter— `JSON.parse` recupera exactamente el mismo signo y el analizador de
 * HTML no ve nada que le interese.
 *
 * Se escapa en la fuente y no en cada dato porque el peligro está en la
 * serialización, no en el contenido: un `<` puede entrar por la sinopsis de un
 * libro, por el nombre de una tienda o por un campo que todavía no existe.
 *
 * `dangerouslySetInnerHTML` es la única forma de escribir un `<script>` desde
 * React: como hijo normal, React escaparía el `&` y las comillas y el JSON
 * dejaría de ser válido. Aquí no hay peligro porque lo que entra es siempre el
 * resultado de `JSON.stringify`, nunca marcado.
 */

interface Props {
  /** Uno o varios nodos. Varios salen en un solo `<script>` como array. */
  nodos: NodoJsonLd | NodoJsonLd[];
}

export function DatosEstructurados({ nodos }: Props) {
  const json = JSON.stringify(Array.isArray(nodos) && nodos.length === 1 ? nodos[0] : nodos);

  return (
    <script
      type="application/ld+json"
      // El `<` es el único carácter que puede sacar al analizador del script.
      // Los `&` y las comillas son inofensivos aquí y escaparlos rompería el JSON.
      dangerouslySetInnerHTML={{ __html: json.replaceAll("<", "\\u003c") }}
    />
  );
}

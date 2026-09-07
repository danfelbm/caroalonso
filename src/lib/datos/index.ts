/**
 * Puerta única a los datos del sitio.
 *
 * Un componente de servidor importa todo de `@/lib/datos` y no necesita saber
 * en qué archivo vive cada consulta. Los componentes de cliente, en cambio,
 * importan de `@/lib/datos/formato`: es el único módulo sin `server-only`.
 */

export * from "./formato";
export * from "./sitio";
export * from "./libros";
export * from "./recomendaciones";
export * from "./podcast";
export * from "./servicios";
export * from "./paginas";

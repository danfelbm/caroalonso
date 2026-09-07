import type { NextConfig } from "next";

const UN_ANIO = "public, max-age=31536000, immutable";
const UNA_SEMANA = "public, max-age=604800, must-revalidate";

/**
 * Política de seguridad de contenido.
 *
 * Estaba dada por hecha en CLAUDE.md y en el comentario de los formularios,
 * pero no existía: las maquetas de contacto, reconexión y boletín confiaban en
 * un `form-action 'none'` que nadie emitía. Ahora sí.
 *
 * Dos permisos que parecen flojos y no lo son:
 *
 * - `'unsafe-inline'` en script-src es inevitable con App Router: React manda
 *   su carga inicial en un script en línea. La alternativa, un middleware que
 *   ponga un nonce por petición, obligaría a renderizar cada página en el
 *   servidor y tirar por tierra las dieciocho rutas prerenderizadas.
 * - `frame-src` deja pasar solo a Spotify, y solo por la fachada del pódcast,
 *   que no monta el iframe hasta que alguien pulsa. Sin esta línea, ese clic no
 *   haría nada.
 *
 * En desarrollo hacen falta `'unsafe-eval'` y el websocket de recarga en
 * caliente; en producción no, así que no se conceden.
 */
const enDesarrollo = process.env.NODE_ENV === "development";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${enDesarrollo ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // `data:` por los marcadores de posición difuminados que escribe el pipeline.
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self'",
  "frame-src https://open.spotify.com",
  `connect-src 'self'${enDesarrollo ? " ws: wss:" : ""}`,
  "form-action 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

/**
 * Cabeceras de seguridad para todas las respuestas.
 *
 * `form-action 'none'` está a propósito: los formularios del sitio son maquetas
 * sin destino. Si alguno adquiriera un `action` por accidente, el navegador lo
 * bloquearía antes de enviar nada de nadie.
 */
const CABECERAS_SEGURIDAD = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Todo el arte es local: no hay ningún host remoto autorizado, así que
    // /_next/image no puede servir de proxy abierto para nadie.
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: CABECERAS_SEGURIDAD },
      {
        // Solo el hero lleva huella del contenido en el nombre, así que es el
        // único que puede cachearse un año sin miedo: si cambia, cambia la ruta.
        source: "/hero/:archivo*",
        headers: [{ key: "Cache-Control", value: UN_ANIO }],
      },
      {
        // El resto usa nombres estables y predecibles a propósito, para poder
        // escribirlos a mano en un componente. Con `immutable` una portada
        // corregida se quedaría atascada un año en el navegador de quien ya la
        // vio, así que una semana con revalidación es el trato correcto.
        source: "/:carpeta(marca|libros|retratos|recomendaciones|texturas|og|audio)/:archivo*",
        headers: [{ key: "Cache-Control", value: UNA_SEMANA }],
      },
    ];
  },
};

export default nextConfig;

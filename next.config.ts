import type { NextConfig } from "next";

const UN_ANIO = "public, max-age=31536000, immutable";

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
        // Estos archivos llevan huella del contenido en el nombre, así que
        // pueden cachearse un año sin miedo: si cambian, cambia la ruta.
        source: "/:carpeta(hero|marca|libros|retratos|texturas|og)/:archivo*",
        headers: [{ key: "Cache-Control", value: UN_ANIO }],
      },
    ];
  },
};

export default nextConfig;

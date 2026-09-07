/**
 * pm2. Ojo con la secuencia: `output: "standalone"` NO copia `public/` ni
 * `.next/static`, así que el sitio arranca, el HTML sale y todas las imágenes
 * y el video dan 404. Por eso se despliega con `npm run empaquetar`, que hace
 * el build y luego copia las dos carpetas dentro de standalone.
 */
module.exports = {
  apps: [
    {
      name: "caroalonso",
      cwd: __dirname,
      script: ".next/standalone/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        // Solo escucha en local: quien atiende Internet es nginx.
        HOSTNAME: "127.0.0.1",
      },
      max_memory_restart: "512M",
      autorestart: true,
    },
  ],
};

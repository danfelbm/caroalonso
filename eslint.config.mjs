import next from "eslint-config-next";

/**
 * Configuración plana nativa. `eslint-config-next` ya la exporta en Next 16, así
 * que el puente `FlatCompat` sobra: con él, cargar la configuración revienta con
 * un «Converting circular structure to JSON».
 */
const configuracion = [
  ...next,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "arte/**",
      "public/**",
      ".playwright-mcp/**",
    ],
  },
];

export default configuracion;

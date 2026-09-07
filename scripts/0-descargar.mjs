/**
 * Comprueba que estén los originales (6 fotos de Carolina + 7 portadas) y baja
 * los que falten desde la biblioteca de medios de WordPress.
 *
 *   node scripts/0-descargar.mjs
 *
 * Idempotente: lo que ya está en disco no se vuelve a bajar.
 * Si la URL directa fallara (WordPress renombra al reescalar), busca el archivo
 * en https://www.caroalonso.com/wp-json/wp/v2/media por nombre.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { RAIZ } from "./lib/env.mjs";

const MEDIOS = "https://www.caroalonso.com/wp-json/wp/v2/media";
const SUBIDAS = "https://www.caroalonso.com/wp-content/uploads";

/** archivo local -> nombre del archivo en la biblioteca de WordPress */
const ORIGINALES = [
  // --- Fotos de Carolina (arte/originales/carolina/) ---
  ["carolina", "carolina_alonso_c.png", "2023/12/carolina_alonso_c.png"],
  ["carolina", "P1013588-1.png", "2020/04/P1013588-1.png"],
  ["carolina", "P1013993.png", "2020/04/P1013993.png"],
  ["carolina", "aboutme.jpg", "2020/04/aboutme.jpg"],
  ["carolina", "carolina.jpg", "2024/03/carolina.jpg"],
  ["carolina", "carolia_alonso_c_libro.jpg", "2024/07/carolia_alonso_c_libro.jpg"],
  // --- Portadas de los libros (arte/originales/portadas/) ---
  ["portadas", "grietas.jpg", "2024/04/libro_carolina_alonso_a_traves_de_las_grietas-e1713925704889.jpg"],
  ["portadas", "muertes-posibles.jpg", "2024/04/libro_carolina_alonso_las_muertes_posibles.jpg"],
  ["portadas", "mundo-medida.jpg", "2024/04/libro_carolina_alonso_mundo_a_tu_medida-e1713927558473.jpg"],
  ["portadas", "navegaciones.jpg", "2024/04/libro_carolina_alonso_navegaciones_naufragios-e1713926379205.jpg"],
  ["portadas", "reinventa-amor.jpg", "2024/04/libro_carolina_alonso_reinventa_el_amor-e1713927756387.jpg"],
  ["portadas", "sal-laberinto.png", "2024/07/sal_del_laberinto_de_soledad_carolina_alonso_libro.png"],
  ["portadas", "se-la-heroina.jpg", "2021/07/336693_portada_se-la-heroina-de-tu-historia_carolina-del-pilar-alonso-caldas_202105080034-1-1-scaled.jpg"],
];

/** Recorre la biblioteca de medios y devuelve { nombreDeArchivo: url }. */
function catalogoDeMedios() {
  const catalogo = {};
  for (let pagina = 1; pagina <= 10; pagina++) {
    let crudo = "";
    try {
      crudo = execFileSync("curl", ["-fsSL", `${MEDIOS}?per_page=100&page=${pagina}&_fields=source_url`], {
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
      });
    } catch {
      break; // WordPress responde 400 al pasarse de páginas
    }
    let lote = [];
    try {
      lote = JSON.parse(crudo);
    } catch {
      break;
    }
    if (!Array.isArray(lote) || lote.length === 0) break;
    for (const medio of lote) {
      if (medio?.source_url) catalogo[medio.source_url.split("/").pop()] = medio.source_url;
    }
    if (lote.length < 100) break;
  }
  return catalogo;
}

let catalogo = null;

function bajar(url, destino) {
  execFileSync("curl", ["-fsSL", "--retry", "3", "--retry-delay", "2", "-o", destino, url], {
    stdio: ["ignore", "ignore", "inherit"],
  });
}

let faltantes = 0;
let bajados = 0;

for (const [carpeta, archivo, ruta] of ORIGINALES) {
  const destino = join(RAIZ, "arte", "originales", carpeta, archivo);
  if (existsSync(destino) && statSync(destino).size > 0) {
    console.log(`· ${carpeta}/${archivo} ya está`);
    continue;
  }
  faltantes++;
  mkdirSync(join(RAIZ, "arte", "originales", carpeta), { recursive: true });
  console.log(`→ falta ${carpeta}/${archivo}, bajando…`);
  try {
    bajar(`${SUBIDAS}/${ruta}`, destino);
    bajados++;
    console.log(`  ✓ ${archivo}`);
    continue;
  } catch {
    console.log("  la URL directa falló, buscando en la biblioteca de medios…");
  }
  // Plan B: buscar por nombre de archivo en el catálogo de WordPress.
  catalogo ??= catalogoDeMedios();
  const url = catalogo[ruta.split("/").pop()];
  if (!url) {
    console.error(`  ✗ no se encontró ${archivo} en la biblioteca de medios`);
    continue;
  }
  try {
    bajar(url, destino);
    bajados++;
    console.log(`  ✓ ${archivo} (vía biblioteca)`);
  } catch (e) {
    console.error(`  ✗ no se pudo bajar ${archivo}: ${`${e.message ?? e}`.slice(0, 200)}`);
  }
}

const logo = join(RAIZ, "arte", "originales", "logovector.svg");
console.log(existsSync(logo) ? "· logovector.svg ya está" : "⚠ falta arte/originales/logovector.svg (no está en la biblioteca de medios)");

console.log(`\nOriginales: ${ORIGINALES.length} esperados, ${faltantes} faltaban, ${bajados} bajados.`);

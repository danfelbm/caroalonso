/**
 * Barrido de calidad: recorre todas las rutas a escritorio y a móvil y falla si
 * algo va mal.
 *
 * Corre contra el SERVIDOR DE PRODUCCIÓN, no contra `next dev`: los problemas
 * que más caros salen —estáticos que no se copian al paquete, cabeceras que no
 * se emiten, rutas que dejan de ser estáticas— solo aparecen ahí.
 *
 *   npm run empaquetar
 *   (cd .next/standalone && PORT=3020 node server.js &)
 *   npm run qa:movil
 *
 * Dos cosas que se aprendieron peleando con falsos positivos:
 *
 * 1. El desborde horizontal se mide intentando desplazar la ventana de verdad,
 *    no leyendo `scrollWidth`: los carruseles desbordan por dentro a propósito
 *    y con `scrollWidth` salían siempre en rojo.
 * 2. Las imágenes se esperan con `decode()`, no con un temporizador: con carga
 *    diferida y una portada larga, dos segundos no bastaban y aparecían
 *    «imágenes rotas» que estaban perfectamente.
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3020";
const RUTAS = ["/", "/quien-soy", "/se-la-heroina", "/libros", "/libros/sal-del-laberinto-de-soledad",
  "/libros/navegaciones-y-naufragios", "/reconexion", "/recomendaciones", "/podcast", "/contacto", "/no-existe"];

const navegador = await chromium.launch();
let fallos = 0;
for (const ancho of [1440, 390]) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: ancho === 390 ? 844 : 900 } });
  console.log(`\n=== ${ancho} px ===`);
  for (const ruta of RUTAS) {
    const p = await ctx.newPage();
    const errores = [];
    p.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 80)));
    p.on("requestfailed", (r) => errores.push("falló " + r.url().split("/").pop()));
    const r = await p.goto(BASE + ruta, { waitUntil: "load", timeout: 45000 });
    await p.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 350) {
        window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 35));
      }
      window.scrollTo(0, 0);
    });
    // Esperar a que las imágenes DECODIFIQUEN, no solo a que pase el tiempo:
    // con carga diferida y una portada larga, dos segundos no bastan y salían
    // falsos positivos de «imagen rota».
    await p.evaluate(async () => {
      document.querySelectorAll("img").forEach((i) => { i.loading = "eager"; });
      await Promise.all([...document.querySelectorAll("img")].map((i) => i.decode().catch(() => {})));
    });
    await p.waitForTimeout(400);
    const d = await p.evaluate(() => {
      const imgs = [...document.querySelectorAll("img")];
      // Desborde REAL: ¿la página se puede desplazar de lado? Medir
      // scrollWidth del documento da falsos positivos con los carruseles, que
      // sí desbordan por dentro y es justo lo que deben hacer.
      const antes = window.scrollX;
      window.scrollTo(9999, window.scrollY);
      const desborde = window.scrollX;
      window.scrollTo(antes, window.scrollY);
      // Y quién asoma por el borde derecho sin estar dentro de un contenedor
      // con scroll propio.
      const culpables = [...document.querySelectorAll("body *")].filter((e) => {
        const c = e.getBoundingClientRect();
        if (c.right <= innerWidth + 1 || c.width === 0) return false;
        for (let a = e.parentElement; a; a = a.parentElement) {
          const ov = getComputedStyle(a).overflowX;
          if (ov === "auto" || ov === "scroll" || ov === "hidden" || ov === "clip") return false;
        }
        return true;
      }).slice(0, 3).map((e) => e.tagName + "." + String(e.className).slice(0, 40));
      return {
        h1: !!document.querySelector("h1"),
        desborde,
        culpables,
        imgs: imgs.length,
        roto: imgs.filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => (i.currentSrc || i.src).split("/").pop()),
      };
    });
    const mal = d.desborde > 0 || d.roto.length || errores.length || !d.h1;
    if (mal) fallos++;
    console.log(`  ${mal ? "✗" : "ok"} ${String(r.status()).padEnd(4)} ${ruta.padEnd(38)} img:${d.imgs - d.roto.length}/${d.imgs}` +
      (!d.h1 ? " SIN-H1" : "") +
      (d.desborde > 0 ? ` DESPLAZA ${d.desborde}px → ${d.culpables.join(" ")}` : "") +
      (d.roto.length ? ` ROTAS: ${d.roto.slice(0, 2).join(", ")}` : "") +
      (errores.length ? ` CONSOLA: ${errores[0]}` : ""));
    await p.close();
  }
  await ctx.close();
}
await navegador.close();
console.log(`\n${fallos === 0 ? "TODO EN VERDE" : fallos + " rutas con problemas"}`);
process.exit(fallos > 1 ? 1 : 0); // la ruta inexistente cuenta su propio 404

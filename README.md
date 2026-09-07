# caroalonso.com

Sitio de Carolina Alonso C., escritora, filósofa y coach. Next 16 con App
Router, React 19, Tailwind 4 y motion. Contenido estático en JSON; la capa de
datos ya está preparada para mudarse a Supabase sin tocar las vistas.

## Arrancar

```bash
npm install
cp .env.example .env.local   # y rellena OPENROUTER_API_KEY
npm run dev
```

## Desplegar en un servidor propio con pm2

`output: "standalone"` **no copia** `public/` ni `.next/static`. Si se despliega
solo el build, el sitio arranca, el HTML sale y todas las imágenes y el video
dan 404. Por eso el empaquetado es un paso propio:

```bash
npm run empaquetar          # build + copia public y .next/static dentro de standalone
pm2 start ecosystem.config.cjs   # la primera vez
pm2 reload caroalonso            # las siguientes
```

Delante va nginx, con el bloque de `despliegue/nginx.conf.ejemplo`.

### Comprobación obligatoria después de desplegar

El hero recorre el video cuadro a cuadro con el scroll, así que el servidor
tiene que responder **206** a las peticiones por rango:

```bash
V=$(node -p "require('./src/data/hero.json').videoMovil")
curl -sI -H "Range: bytes=0-1023" https://www.caroalonso.com$V | head -1
```

Si sale `200` en vez de `206`, el hero se queda congelado y **no aparece ningún
error en consola**. Las causas habituales son gzip aplicado a `video/mp4` o un
`proxy_buffering` que se come la cabecera.

### Si se pone Cloudflare delante

En el plan gratuito los `.mp4` salen como `BYPASS` y cada visita baja el video
del servidor de origen. Hay que crear una **Cache Rule** sobre `URI Path starts
with /hero/`, marcarla como *Eligible for cache* y darle un *Edge TTL* de un
año. Los archivos llevan huella del contenido en el nombre, así que cachearlos
para siempre es seguro.

Esto pesa más que cualquier ajuste de compresión: en el proyecto hermano fue la
diferencia entre 170 KB/s y 1,9 MB/s.

```bash
curl -sI https://www.caroalonso.com/hero/<archivo>.mp4 | grep -i cf-cache-status
```

## Pipeline de arte

Los scripts están numerados por orden de ejecución y todos son reanudables:
saltan lo que ya existe en disco.

```
0-descargar        fotos y portadas desde la API de WordPress
1-soul             entrena el Soul de Higgsfield con las fotos reales
2-retratos         genera con los dos motores y arma un comparador HTML
3-texturas         papel, constelación, lavanda, olas
4-hero-video       fotogramas clave y borrador del video
5-hero-recodificar ffmpeg -g 1, pósteres, huella de contenido
6-optimizar        webp y avif por anchos
7-og               tarjetas de compartir por captura
```

## Respaldo

Mientras no haya repositorio remoto, al cerrar cada sesión:

```bash
git bundle create ~/respaldos/caroalonso-$(date +%F).bundle --all
```

Y guarda una copia de `arte/video/` fuera del proyecto: regenerar esos masters
cuesta créditos y minutos.

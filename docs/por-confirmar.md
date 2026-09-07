# Por confirmar con Carolina

Lo que el sitio en WordPress no dice, dice a medias o dice de dos maneras. Todo
lo que aparece aquí está en los JSON de `src/data/` como `null`, con una bandera
`porConfirmar`, o con el dato que se consideró más fiable y una nota abajo.

Ninguno de estos huecos se rellenó inventando.

---

## 1. Los años de tres libros no coinciden

La biografía de «Quién soy» y la tienda del sitio dan años distintos para los
mismos títulos:

| Libro | Biografía | Tienda | En `libros.json` |
|---|---|---|---|
| A través de las grietas | 2012 | 2009 | **2012**, `anioPorConfirmar: true` |
| Un mundo a tu medida | 2009 | 2019 | **2009**, `anioPorConfirmar: true` |
| Las muertes posibles | 2007 | 2008 | **2007**, `anioPorConfirmar: true` |

Manda la biografía porque la escribió ella y porque los años de la tienda
parecen fechas de reedición o de carga del producto (2019 para «Un mundo a tu
medida» es difícil de sostener: el mismo texto lo sitúa antes de 2012).

Enredo añadido: la biografía cuenta que «A través de las grietas» fue finalista
del Concurso Nacional de Cuento del Ministerio de Cultura **en 2009**, tres años
antes de la fecha que ella misma le da al libro.

**Pregunta:** ¿cuál es el año de primera edición de cada uno?

Mientras tanto, `anioLegible()` los muestra como «2012 (por confirmar)». Cuando
lleguen los años buenos, basta con corregir `anio` y poner `anioPorConfirmar`
en `false`.

## 2. Cinco libros se quedan sin dónde comprarse

Solo «Sal del laberinto de soledad» y «Sé la heroína de tu historia» tienen
enlaces de compra reales, los de sus editoriales y librerías. Los otros cinco
—Reinventa el amor, A través de las grietas, Un mundo a tu medida, Las muertes
posibles, Navegaciones y naufragios— se vendían por la tienda WooCommerce del
propio sitio, que desaparece con la migración.

Quedan como `estado: "solo-consulta"`, con las tres listas de compra vacías. La
ficha se ve entera, pero no ofrece ningún botón de compra.

**Preguntas:**

- ¿Hay ejemplares? ¿Dónde se consiguen hoy?
- ¿Se quiere una tienda propia otra vez, o basta con enlazar a librerías?
- De «Reinventa el amor», la página dice «disponible en físico en tiendas
  especializadas», sin decir cuáles. ¿Cuáles?

Dos enlaces de «Sé la heroína» apuntan a la portada de la librería, no al libro:
Librería Lerner (`librerialerner.com.co`) y Librería Nacional
(`librerianacional.com`). Convendría cambiarlos por la ficha del libro o
quitarlos.

### Cinco enlaces que ya no llevan a ninguna parte

Se comprobaron los 29 enlaces de compra del sitio viejo (7 de septiembre de
2026). Cinco devuelven 404: la tienda retiró el producto o cambió la dirección.
**Se sacaron de `libros.json`** para no ofrecer un botón roto, y se guardan aquí
para poder restaurarlos si vuelven a existir:

| Libro | Tienda | Enlace muerto |
|---|---|---|
| Sal del laberinto de soledad | Indigo | `https://www.indigo.ca/en-ca/sal-del-laberinto-de-soledad/2dc34808-6994-365a-993b-9e914be8aaac.html` |
| Sal del laberinto de soledad | Librería Lerner | `https://www.librerialerner.com.co/sal-del-laberinto-de-soledad-9786287707191-3350/p?idsku=605370` |
| Sal del laberinto de soledad | Tango Discos | `https://tangodiscos.co/libros/sal-del-laberinto-de-soledad` |
| Sé la heroína de tu historia | Panamericana | `https://www.panamericana.com.co/se-la-heroina-de-tu-historia-y-desencadena-tu-poder-interior-622767/p` |
| Sé la heroína de tu historia | Planeta de Libros (audiolibro) | `https://www.planetadelibros.com.co/libro-se-la-heroina-de-tu-historia/330557#soporte/374966` |

No se buscaron sustitutos por cuenta propia: hacen falta las direcciones
nuevas, si es que el libro sigue en esas tiendas.

Otros dos responden 403 a un `curl` —PocketBook y bol.com— pero es la
protección antirrobots de esas tiendas, no un enlace muerto. Se dejaron.

## 3. El canal «Love is Real» no tiene dirección

Ella lo nombra dos veces —«comparto el mensaje del Curso y mis reflexiones sobre
él en mi canal de YouTube Love is Real»— pero en ninguna página lo enlaza.

En `podcast.json` está con `url: null` y `porConfirmar: true`, y
`getCanalesEnlazables()` lo deja fuera para no pintar un enlace roto.

**Pregunta:** ¿cuál es la URL del canal?

## 4. No hay correo de contacto

La página `/contacto` del sitio está vacía: solo tiene el título. En ninguna otra
página aparece una dirección de correo, ni un teléfono, ni un WhatsApp. El único
modo de escribirle es el formulario de Reconexión.

En `sitio.json`, `contacto.correo` es `null`.

**Preguntas:** ¿qué correo se publica? ¿Se quiere publicar alguno, o se prefiere
que todo entre por formulario?

## 5. El boletín no está conectado a nada

El sitio viejo no tenía boletín. El nuevo reserva el bloque, pero no hay
proveedor de correo detrás: el formulario no envía ni guarda nada.

En `sitio.json`, `boletin.activo` es `false` y el texto de `boletin.aviso` lo
dice en voz alta para que nadie crea haberse suscrito. Los textos del bloque
(`titular`, `entradilla`, `textoBoton`) son de la casa, no salen del sitio
viejo: **hay que aprobarlos o cambiarlos**.

**Preguntas:** ¿se quiere boletín? ¿Con qué proveedor? ¿Cada cuánto?

## 6. Las ocho imágenes de las recomendaciones siguen en WordPress

El campo `imagen` de `recomendaciones.json` apunta todavía a
`caroalonso.com/wp-content/uploads/...`. Son las únicas copias que existen de
esas portadas y `next.config.ts` no autoriza ningún host remoto
(`remotePatterns: []`), así que **hoy no se pueden mostrar**.

Hay que decidir: descargarlas a `public/`, o dejar las fichas sin imagen y que
el color de cada una haga el trabajo.

Lo mismo pasa con el audio de la entrevista de Caracol Radio Bucaramanga
(`heroina.json` → `prensa`), que es un MP3 alojado en el WordPress:
`.../uploads/2021/07/A-la-Carta-entrevista-Carolina-Alonso.mp3`. Si el sitio
viejo se apaga, ese audio se pierde. Conviene guardarlo.

## 7. Datos de catálogo que faltan

- **ISBN.** Solo se conocen los de los dos libros recientes: 9786287707191
  («Sal del laberinto de soledad», papel; el ebook es 9786287707207) y
  9789584294968 («Sé la heroína de tu historia»). Los otros cinco van con
  `isbn: null`.
- **Editorial.** Solo consta Planeta, para esos mismos dos libros. Los otros
  cinco van con `editorial: null`.
- **Género.** El sitio nunca lo dice con esas palabras; se dedujo de cómo ella
  describe cada libro: «Relatos» para A través de las grietas y Navegaciones y
  naufragios («un conjunto de relatos», «mi libro de relatos»), «Novela» para
  Las muertes posibles («en esta novela»), «Cuento ilustrado» para Un mundo a tu
  medida («en este cuento ilustrado») y «No ficción» para los tres de
  acompañamiento. **Conviene que ella lo confirme.**
- **Subtítulo.** Solo «Sé la heroína de tu historia» tiene uno declarado («Y
  desencadena tu poder creador»). El resto va con `subtitulo: null`.

## 8. La biografía se quedó en 2021

«Quién soy» enumera seis libros y termina en «Sé la heroína de tu historia
(Planeta, 2021)». Falta «Sal del laberinto de soledad» (2024), que es el
lanzamiento que abre la página de libros. El párrafo se copió tal cual.

**Pregunta:** ¿se actualiza el párrafo para incluirlo?

También hay dos versiones del mismo dato académico: «Máster en Filosofía
Contemporánea» en «Quién soy» y «Magistra en Filosofía Contemporánea» en la
solapa de «Sal del laberinto». Se usó la primera.

## 9. Correcciones que se hicieron al copiar los textos

Los textos salen literales de la API REST de WordPress y del volcado del sitio.
Lo único que se tocó fue esto, y conviene que ella lo vea:

- **Comillas.** Las tipográficas inglesas (`“ ”`) pasaron a angulares (`« »`),
  que es lo que ella usa en la mayoría del sitio.
- **Signos de apertura.** «Las mujeres que creen y crean juntas tienen infinito
  poder!!» → «¡Las mujeres que creen y crean juntas tienen infinito poder!».
  Igual en «Ella es una Guardiana!!!» → «¡Ella es una Guardiana!».
- **Erratas evidentes.** «perdemos nuestronorte» → «nuestro norte»;
  «déjela reclamar» → «déjala reclamar»; «acerca de que significa» → «de qué
  significa»; «comprender quienes somos» → «quiénes somos»; «es remplazado» →
  «es reemplazado»; «con la artista está en mí» → «con la artista que está en
  mí»; «Para James Rodhes» → «Rhodes» (el título de la misma ficha ya lo
  escribe bien).
- **Ordinales.** «Este es el 4to episodio» → «el 4.º episodio».
- **Títulos.** La página de libros titula el sexto libro «Navegaciones y
  naugrafios». En todas las demás menciones —y en la biografía— es
  «Navegaciones y naufragios», que es lo que se usó.
- **Mayúsculas.** Los titulares que en Divi iban en versalitas se pasaron a
  caja normal: «LA SOLEDAD ES UN TEMA INCÓMODO…» → «La soledad es un tema
  incómodo…». La decisión de pintarlos en mayúsculas es del diseño, no del dato.
- **Sin tocar:** «Reconnection & Reconective Healing Practitioner», el nombre de
  la certificación tal como aparece en «Quién soy». La marca real es
  *Reconnective*, pero es un nombre en inglés y no se corrigió por cuenta
  propia. **¿Se arregla?**

## 10. Decisiones de forma que conviene revisar

- **Los cuatro pasos de la Reconexión.** La página tiene tres columnas bajo
  «Cómo es el proceso» (presencial en Bogotá / dos sesiones en 48 horas / la
  camilla) y, encima, una frase suelta: «La decisión de ser reconectados debe
  ser consciente; se trata de un proceso que se hace UNA SOLA VEZ». Se guardó
  como el primero de los cuatro pasos, porque describe el proceso igual que las
  otras tres.
- **La descripción del sitio** (`identidad.descripciones.breve`, la que se ve al
  compartir un enlace) se compuso juntando su oficio y sus dos libros recientes.
  No es una frase suya. **Hay que aprobarla.**
- **Las etiquetas de las tiendas** se normalizaron: «bol.» → «bol.com»,
  «!ndigo» → «Indigo», «Exito.com» → «Éxito», «BuscaLibre.com» → «Buscalibre»,
  «Librería LERNER» → «Librería Lerner».

## Imagen perdida en el sitio actual

La ficha **«Un libro/película: La brújula dorada»** apunta a
`2020/05/La-brújula-dorada.jpg`, y ese archivo ya no existe en el servidor: la
API de medios lo sigue anunciando pero las once variantes devuelven 404, con
tilde, sin tilde y con la tilde descompuesta. Es decir, hoy esa recomendación ya
se ve rota en caroalonso.com.

Queda con `imagen: null`. Hay que pedirle a Carolina la portada, o dejar la
ficha sin imagen.

## Assets rescatados de WordPress

Bajados a `arte/originales/` antes de que el sitio viejo desaparezca:

- 7 de las 8 imágenes de recomendaciones.
- El MP3 de la entrevista en Caracol Radio Bucaramanga, 10 MB, que solo vivía
  allí y no se puede regenerar.

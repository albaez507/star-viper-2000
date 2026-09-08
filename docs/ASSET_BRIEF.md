# Asset Brief — Star Viper 2000

Documento para pasar a otro modelo/artista que va a generar los sprites.
El código y la integración los hago yo (Claude Code); este documento es el
contrato de qué archivos necesito, en qué tamaño, con qué convención y por
qué. **Yo valido cada asset** contra este brief antes de integrarlo — así que
cuanto más se ciña el otro modelo a esto, menos ida y vuelta habrá.

Todo lo que hoy es geometría generada por código (naves como triángulos,
balas como rectángulos) se sustituye por estos PNG sin tocar la lógica del
juego — el motor ya está desacoplado del render.

---

## 1. Por qué naves y no personajes

El juego es de naves espaciales, no de personajes con piernas. Eso es
deliberado y es una ventaja para el pipeline de arte con IA: **no hace falta
ciclo de caminata, ni de correr, ni poses articuladas**. Cada nave/criatura es
**un solo sprite estático** (más, como mucho, 1-2 frames de variación simple
tipo "flash de impacto" — y eso el motor ya lo resuelve por código, pintando
el sprite en blanco 2-3 frames, así que ni eso hace falta dibujarlo aparte).

Lo único remotamente parecido a animación que pediría más adelante es un
sprite sheet de 2-3 frames para el jefe en su fase de muerte (opcional, ver
§7) — todo lo demás es un frame fijo por entidad.

---

## 2. Restricciones técnicas (no negociables)

| Restricción | Detalle |
|---|---|
| Formato | PNG con canal alfa (fondo transparente) |
| Estilo | Pixel art / retro, silueta legible a tamaño pequeño |
| Render | `image-rendering: pixelated` — los píxeles deben ser nítidos, no anti-aliased ni con gradientes suaves |
| Paleta | Limitada, ver §3. No usar colores fuera de la paleta salvo negro/blanco puro para contorno/flash |
| Orientación | Ver §4 — es crítico, si se dibuja al revés hay que rehacerlo |
| Fondo | Transparente, sin bordes ni sombra paja fuera de la silueta |
| Frames | 1 solo frame por sprite salvo que se indique lo contrario |
| Márgenes | Sin padding extra alrededor del sprite — el bounding box del PNG debe ajustarse a la silueta (recortar transparencia sobrante) |

---

## 3. Paleta de color

Viene de `src/styles/tokens.css`, es la que ya usa el HUD y los placeholders.
No es obligatorio usar cada color en cada sprite, pero todo debe salir de aquí
o de negro/blanco:

| Nombre | Hex | Uso actual |
|---|---|---|
| Fondo espacio | `#0a0e17` | Fondo del canvas |
| Tinta / texto | `#eaf6ff` | HUD, estrellas |
| Acento (jugador) | `#3ee6c4` | Nave del jugador, escudo |
| Acento 2 (Options) | `#7a5cff` | Orbes Option |
| Peligro | `#ff5470` | Enemigo `scout`, balas enemigas, jefe |
| Advertencia / oro | `#ffd23f` | Enemigo `sine`, balas del jugador, Power Core |
| — | `#ff8c3e` | Enemigo `diver`, misil |
| — | `#c792ff` | Enemigo `formation` |

Estos colores son el **color de identidad** de cada entidad — el jugador
reconoce a un enemigo por su silueta + color desde lejos. Si el nuevo sprite
cambia el tono, que sea una variación cercana del mismo hue, no un color
distinto (ej: el `scout` puede pasar de `#ff5470` a un rojo/magenta cercano,
pero no a azul).

---

## 4. Convención de orientación (crítico)

El mundo se desplaza de derecha a izquierda. Esto determina hacia dónde mira
cada sprite:

| Entidad | Mira hacia | Por qué |
|---|---|---|
| Nave del jugador | **Derecha** (→) | Avanza hacia los enemigos que vienen de la derecha |
| Options (orbes) | Sin dirección fija | Son orbes/geometría simple, no necesitan "cara" |
| Enemigos (`scout`, `sine`, `diver`, `formation`) | **Izquierda** (←) | Entran por la derecha y avanzan hacia la izquierda, hacia el jugador |
| Jefe | **Izquierda** (←) | Igual que los enemigos, pero se ancla en vez de cruzar toda la pantalla |
| Balas del jugador | N/A (rectángulo/proyectil simple) | — |
| Balas enemigas / del jefe | N/A | — |
| Misil | **Derecha** (→), con estela detrás | Lo dispara el jugador hacia la derecha |
| Power Core | Sin dirección (orbe/gema) | — |

Cada sprite se entrega **ya orientado**. El código no rota ni voltea el
sprite del enemigo — si llega mirando a la derecha por error, no sirve.

---

## 5. Tamaños exactos

Los tamaños están atados a las hitboxes reales del motor (en
`src/game/*.ts`), así que no son estéticos — hay que respetarlos para que la
colisión visual coincida con la colisión real. La convención es: el PNG mide
**el doble del hitbox** (padding visual de "aura" de la nave más allá de su
caja de colisión, como en cualquier shmup — el jugador siente que esquivó
aunque el sprite roce).

| Entidad | Hitbox (half-width × half-height) | Tamaño de sprite recomendado |
|---|---|---|
| Jugador | 15 × 10 px | **44 × 32 px** |
| Enemigo `scout` / `sine` / `diver` / `formation` | 13 × 12 px | **36 × 32 px** cada uno |
| Jefe "Sentinel" (fase 1) | 128 × 112 px | **260 × 230 px** — deliberadamente gigante y de silueta **blocky/octogonal**, no una nave estilizada (se lee como fortaleza). Crece de verdad en fases 2 y 3 (ver §6.4) |
| Option (orbe de apoyo) | — | **12 × 12 px** |
| Power Core | — | **20 × 20 px** |
| Bala del jugador (single/double) | — | **12 × 6 px** |
| Bala del jugador (láser) | — | **32 × 6 px** — mucho más alargada, con estela detrás; es el arma más fuerte y debe leerse como un rayo, no como una bala más |
| Bala enemiga (normal) | — | **10 × 6 px** |
| Bala del jefe | — | **32 × 32 px** — un orbe con halo, notablemente más grande que una bala normal; el jefe es gigante, su disparo debe sentirse igual de amenazante |
| Misil | — | **20 × 10 px** |

Actualizado tras subir el tamaño del jugador y los enemigos regulares a
petición del usuario — se sentían demasiado pequeños en pantalla. El jefe
queda igual de grande en términos absolutos, pero la diferencia de escala
frente a los enemigos se redujo un poco (de ~7-8× a ~5×), lo cual sigue
leyéndose como "gigante" sin dejar de distinguir bien a los enemigos
normales.

Todos los tamaños son múltiplos de 4 a propósito, para que escalen limpio en
pixel art (2x, 4x) sin sub-píxeles raros.

Si el otro modelo trabaja mejor a mayor resolución (ej. 128×128) y luego se
reduce, está bien — lo importante es que el archivo final entregado ya venga
al tamaño de la tabla, recortado a la silueta.

---

## 6. Lista de sprites a generar

### 6.1 Jugador

- `player-ship.png` — 32×24 px, mirando a la derecha. Estilo "viper" ágil,
  silueta triangular/afilada reconocible al instante.

### 6.2 Options (apoyo)

- `option-orb.png` — 12×12 px. Un orbe o gema pequeña, mismo lenguaje visual
  que la nave del jugador pero claramente "satélite", no una nave completa.

### 6.3 Enemigos (fase 1)

Cuatro sprites, cada uno **claramente distinto en silueta**, no solo en
color, porque el jugador debe poder identificar el patrón de movimiento por
la forma sin leer el color:

- `enemy-scout.png` — 24×24 px. El más simple/genérico, "carne de cañón".
  Silueta afilada y agresiva.
- `enemy-sine.png` — 24×24 px. Sugerir movimiento ondulante en el diseño
  (alas curvas, forma más redondeada).
- `enemy-diver.png` — 24×24 px. Forma de "punta de flecha" o pico, que
  comunique "esto se va a lanzar en picado".
- `enemy-formation.png` — 24×24 px. El que viaja en grupos de 6. Debe leerse
  como "parte de un escuadrón" — más geométrico/uniforme, tipo dron.

### 6.4 Jefe

- `boss-sentinel.png` — 260×230 px, mirando a la izquierda. Silueta **blocky/
  octogonal** — piensa "fortaleza acorazada", no "nave elegante". Con un
  "núcleo" o punto débil visible (actualmente se pinta un círculo oscuro en
  el centro-derecha del jefe — mantener un punto focal ahí para que quede
  coherente con los disparos que salen de esa zona).
- **Confirmado, no opcional (a diferencia de la versión anterior de este
  brief):** `boss-sentinel-phase2.png` y `-phase3.png`, ligeramente más
  grandes que el sprite base (×1.08 y ×1.18 — el motor ya redimensiona la
  hitbox real en esas fases, así que el arte debe acompañar) y con más daño
  visible: grietas, partes rotas, color más intenso/oscuro. El motor ya
  genera esto por código (grietas procedurales + cambio de color) como
  placeholder, así que no bloquea nada — pero si el otro modelo los genera,
  se integran directamente. Ver `LOGIC.md` §8 para el detalle exacto de color
  por fase (`#ff5470` → `#d43a5c` → `#9c1f3c`).

### 6.5 Proyectiles y pickups

- `bullet-player.png` — 12×6 px, dorado/amarillo (`#ffd23f`).
- `bullet-enemy.png` — 10×6 px, rojo (`#ff5470`).
- `missile.png` — 20×10 px, naranja (`#ff8c3e`), con pequeña estela.
- `power-core.png` — 20×20 px, gema/núcleo pulsante en dorado. Debe leerse
  como "objeto valioso a recoger", distinto de una bala.

### 6.6 Iconos del medidor de poder (opcional, nice-to-have)

Hoy el medidor de poder (`SPD · MSL · DBL · LSR · OPT · SHD`) se dibuja como
texto. Si sobra tiempo, 6 iconos pequeños cuadrados de **16×16 px**, uno por
mejora, mismo lenguaje visual que el resto:

- `icon-speed.png`, `icon-missile.png`, `icon-double.png`, `icon-laser.png`,
  `icon-option.png`, `icon-shield.png`

### 6.7 Lo que NO hace falta generar

- Fondo / estrellas — se generan por código (parallax de rectángulos).
- Partículas de explosión — se generan por código.
- Cualquier ciclo de animación (caminar, correr, parpadeo de ojos, etc.) — no
  aplica, son naves.

---

## 7. Sobre el sistema de "evolución por fases" (confirmado, solo para el jefe)

El jefe cambia de forma visual y de tamaño real según su vida (100% → 60% →
30%), no solo de patrón de ataque: crece (×1.08, ×1.18), se oscurece y se
agrieta más con cada fase (ver `LOGIC.md` §8 para el detalle exacto). Ya
implementado por código como placeholder; los sprites `boss-sentinel-phase2.png`
y `-phase3.png` de §6.4 lo sustituyen con arte real cuando estén listos.

**Se decidió explícitamente NO extender esto a los enemigos regulares** —
mueren en 1-2 golpes, no da tiempo a que se note la transformación, y
multiplicaría el trabajo de arte por cada tipo. No generar variantes de fase
para `enemy-scout`/`enemy-sine`/`enemy-diver`/`enemy-formation`.

---

## 8. Entrega

- Un PNG por archivo, nombrado exactamente como en §6 (minúsculas, guiones).
- Carpeta de entrega: todo junto, sin subcarpetas.
- Si el modelo genera variantes/opciones, marcarlas claramente
  (`player-ship-v1.png`, `player-ship-v2.png`) y yo elijo/valido cuál se
  integra.
- Cuando lleguen, los reviso contra las hitboxes reales, los integro en
  `src/render/sprites.ts` (hoy dibuja geometría; pasa a `drawImage`), y aviso
  si alguno no lee bien a tamaño de juego real (esto pasa mucho con pixel art
  generado a resoluciones grandes y luego reducido — hay que probarlo en el
  canvas, no solo mirarlo en grande).

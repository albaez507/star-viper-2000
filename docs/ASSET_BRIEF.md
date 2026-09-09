# Asset Brief — Star Viper 2000

> **Documento de entrega para el modelo/artista que genera los sprites.**
> Es autocontenido: no hace falta conocer el proyecto ni el código.
> Auditado contra el código real el 2026-09-09 — todos los tamaños de aquí
> salen de las hitboxes que el juego usa hoy, no son estimaciones.

Estos assets son **provisionales**. Sustituyen a la geometría que el juego
dibuja hoy por código (triángulos, rectángulos). Más adelante se reemplazarán
por trabajo de artistas humanos, así que el objetivo aquí es **desbloquear el
desarrollo**, no producir el arte definitivo.

**Prioridad de esta tanda: la nave del jugador y los enemigos.** Todo lo demás
(proyectiles, UI, entornos) está más abajo y puede esperar.

---

## 0. Estilo visual — LEER ESTO PRIMERO

> **Esta sección cambió el 2026-09-09 y contradice a propósito lo que decía
> antes.** El brief pedía acabado NES estilo Contra Force: plano, tres tonos,
> duro. Se generó arte en otra dirección — pixel art detallado, luz cálida,
> nubes con volumen — el usuario lo jugó y esa es la que eligió. Manda lo que
> funcionó en pantalla, no lo que estaba escrito.

**La referencia ya no es un juego ajeno: es el sector "Jardines del Céfiro"
que ya está en este repositorio.** Míralo (`public/assets/sky/`) y trabaja en
esa línea.

### Lo que define el estilo

- **Pixel art detallado, no minimalista.** Varios tonos por pieza, sombra
  propia, materiales que se distinguen (metal, cristal, quitina, roca).
- **Luz cálida entrando desde arriba.** Consistente en todo: si un sprite
  tiene la luz desde otro lado, canta.
- **Los fondos van desaturados; lo que mata va saturado.** Esa es la regla que
  mantiene el juego legible. Las nubes y las islas son pastel; los enemigos
  son colores plenos. Si un fondo compite en saturación, los enemigos
  desaparecen dentro de él.
- **Contorno oscuro en naves y enemigos.** Sobre un cielo claro, sin contorno
  la silueta se deshace.
- **Criaturas mecánicas.** Los enemigos actuales son mitad insecto mitad
  máquina, y funciona: se leen como vivos y hostiles a la vez. Mantener esa
  familia.
- **Silueta primero.** Sigue mandando: si en negro plano dos enemigos se
  confunden, el detalle no lo arregla.

### Lo que NO

- **No volver al plano de tres tonos.** Esa dirección se probó y se descartó.
- Nada foto-realista ni con degradados suaves de render 3D.
- Fondos saturados o con mucho contraste en la franja central, que es donde se
  juega.
- Nada de neón ni cromados.

### ⚠️ Lo que más está costando: el tamaño al que dibujas

Los sprites entregados vienen a **~313 px** y el juego los muestra a **~34
px**. Se pierde el 99% de los píxeles. El motor ya reduce lo mejor que puede,
pero **el detalle que no cabe no se ve: solo ensucia el resultado.**

**Dibuja al DOBLE del tamaño de las tablas de abajo.** Ese es el punto dulce,
y conviene entender por qué no es ni el tamaño exacto ni 300 px:

Un mismo enemigo ocupa **42 px** en una ventana normal y **~90 px** a pantalla
completa en un monitor grande. Son los dos extremos que hay que servir:

| Tamaño del arte | En ventana (42 px) | A pantalla completa (90 px) |
|---|---|---|
| 314 px (lo entregado) | reduce 7.5× — se ensucia | reduce 3.4× — mejor, aún lossy |
| 40 px (tamaño exacto) | 1:1, perfecto | **estira 2.3× — sale a bloques** |
| **~72 px (el doble)** | reduce 1.7× — limpio | estira 1.25× — aceptable |

Por eso: **enemigos a 72×64, nave a 96×64, jefe a 512×448.** El doble de lo
que dicen las tablas. Si prefieres trabajar más grande, usa un **múltiplo
entero** de eso (×2 o ×4) y reduce tú antes de entregar — nunca un tamaño
arbitrario como 314.

Esto es lo primero que hay que corregir en el próximo lote.


## 1. El juego en una frase

Shoot-'em-up horizontal de arcade: tu nave va por la izquierda, los enemigos
entran por la derecha, el fondo es espacio oscuro. Estética retro/pixel, pocos
colores, siluetas muy legibles a tamaño pequeño.

**Ventaja del género para este pipeline:** son naves, no personajes. **No hace
falta ningún ciclo de animación** — ni caminar, ni correr, ni poses. Cada
entidad es un sprite fijo (más un par de variantes de estado, ver §5).

---

## 2. Restricciones técnicas (no negociables)

| Restricción | Detalle |
|---|---|
| Formato | PNG con canal alfa (fondo transparente) |
| Estilo | Pixel art retro, silueta legible a tamaño pequeño |
| Render | Píxeles nítidos, **sin** anti-aliasing suave ni degradados difusos |
| **Resolución del arte** | **Dibuja los sprites cerca del tamaño al que se ven** (las tablas de abajo). Un sprite de 300 px reducido a 34 px pierde el 99% de sus píxeles y se ve sucio por mucho que el original sea precioso — el detalle que no cabe no se ve, solo ensucia |
| Paleta | La de §3. Todo debe salir de ahí, salvo blanco/negro puro para contorno |
| Orientación | Ver §4. Es crítico: si se dibuja al revés hay que rehacerlo |
| Recorte | Sin margen transparente sobrante: el bounding box del PNG ajustado a la silueta |
| Frames | Un solo frame por sprite. Las variantes de estado son archivos separados |

Si trabajas a mayor resolución y luego reduces, perfecto — pero **entrega al
tamaño de las tablas**, ya recortado.

---

## 3. Paleta

Es la que ya usa el juego. Cada entidad tiene un color de identidad: el jugador
la reconoce por **silueta + color** desde lejos.

| Uso | Hex |
|---|---|
| Fondo (espacio) | `#0a0e17` |
| Tinta / HUD / estrellas | `#eaf6ff` |
| **Jugador** | `#3ee6c4` (turquesa) |
| Options (orbes de apoyo) | `#7a5cff` (violeta) |
| Enemigo `scout` | `#ff5470` (rojo) |
| Enemigo `sine` | `#ffd23f` (amarillo) |
| Enemigo `diver` | `#ff8c3e` (naranja) |
| Enemigo `formation` | `#c792ff` (lila) |
| Enemigo `swarm` | `#5ee6ff` (cian) |
| Enemigo `harasser` | `#9dff5e` (verde lima) |
| Enemigo `rival` | `#ff4fd8` (magenta) |
| Jefe fase 1 / 2 / 3 | `#ff5470` / `#d43a5c` / `#9c1f3c` |
| Item de hangar | `#9dff5e` |

Puedes variar el tono dentro del mismo color (sombras, brillos), pero **no
cambies el hue**: un `scout` azul rompe la lectura del juego.

---

## 4. Orientación (crítico)

El mundo se desplaza de derecha a izquierda. El código **no rota ni voltea**
los sprites: llegan ya orientados o no sirven.

| Entidad | Mira hacia |
|---|---|
| Nave del jugador | **Derecha →** |
| Todos los enemigos y el jefe | **Izquierda ←** |
| Misil del jugador | **Derecha →**, con estela detrás |
| Options, Power Core, Item | Sin dirección (son orbes/gemas) |

---

## 5. PRIORIDAD 1 — Nave del jugador

### 5.1 Importante: entrégala **por piezas**, no como una sola imagen

El juego va a tener mejoras que **cambian el aspecto de la nave** (más adelante
el jugador compra piezas y quiere verlas puestas). Si la nave llega como un
único PNG cerrado, cada mejora obliga a redibujar la nave entera.

Por eso: **dibuja la nave en 4 capas separadas**, todas del mismo tamaño de
lienzo y alineadas entre sí, para que el juego pueda apilarlas:

| Capa | Archivo | Qué es |
|---|---|---|
| Casco | `ship-hull.png` | El cuerpo central. Es la única capa obligatoria |
| Alas | `ship-wings.png` | Superior e inferior, en el mismo archivo |
| Motor | `ship-engine.png` | La parte trasera / propulsión |
| Cañón | `ship-cannon.png` | El morro / arma frontal |

- **Lienzo: 48 × 32 px** para las cuatro capas (mismo lienzo, contenido
  distinto). Apiladas en orden casco → alas → motor → cañón deben formar una
  nave coherente.
- La **hitbox real es 30 × 20 px** centrada. El sprite es más grande a
  propósito: en un shmup la nave se ve algo mayor de lo que colisiona, así el
  jugador siente que esquivó.
- El morro puede sobresalir un poco por la derecha del área de colisión.

Si esto te complica demasiado, entrega al menos `ship-hull.png` completo
(48×32, la nave entera) y lo demás después — pero las piezas separadas ahorran
muchísimo trabajo futuro.

### 5.2 Variantes de pieza (opcional, para después)

Cuando existan las mejoras, harán falta 2-3 variantes de cada capa (por ejemplo
`ship-cannon-b.png`, `ship-engine-b.png`) — misma silueta base, aspecto más
pesado/afilado/agresivo. **No las hagas todavía**, pero tenlo en cuenta al
diseñar: que la capa base admita variantes sin rehacer el resto.

### 5.3 Options

- `option-orb.png` — **16 × 16 px**. Orbe/gema pequeña violeta que flota junto
  a la nave. Mismo lenguaje visual que el jugador, pero claramente "satélite",
  no una nave completa.

---

## 6. PRIORIDAD 1 — Enemigos

**Todos miran a la izquierda.** Cada uno debe distinguirse por **silueta**, no
solo por color: el jugador tiene que reconocer el patrón de movimiento por la
forma, incluso en blanco y negro.

| Archivo | Tamaño | Color | Qué comunica la forma |
|---|---|---|---|
| `enemy-scout.png` | 40 × 36 | `#ff5470` | El más simple y genérico. Carne de cañón: afilado, agresivo, olvidable a propósito |
| `enemy-sine.png` | 40 × 36 | `#ffd23f` | Se mueve ondulando: alas curvas, formas redondeadas |
| `enemy-diver.png` | 40 × 36 | `#ff8c3e` | Se lanza en picado: punta de flecha, pico, algo que "apunta" |
| `enemy-formation.png` | 40 × 36 | `#c792ff` | Viaja en escuadrones de 6: geométrico, uniforme, tipo dron |
| `enemy-swarm.png` | 40 × 36 | `#5ee6ff` | Enjambre que aguanta rejilla y se lanza: insectoide, ligero |
| `enemy-harasser.png` | 44 × 40 | `#9dff5e` | **No intenta matarte, te molesta y huye.** Debe leerse como "valioso, atrápalo antes de que escape": más adornado, casi como un contrabandista |
| `enemy-rival.png` | 72 × 60 | `#ff4fd8` | Mini-jefe: **otra nave de combate**, no una estructura. Que se lea como un rival a tu altura, con cañones visibles |

Hitboxes reales (por si ayuda a centrar): los cinco primeros 26×24, el
`harasser` 30×28, el `rival` 52×44.

### 6.1 Estado dañado

Cada enemigo que sobrevive a más de un impacto necesita **una segunda versión
dañada**, misma silueta con daño visible (grietas, un ala rota, chispas,
oscurecido). Nombre: `enemy-<tipo>-dmg.png`.

**Hazlo solo para estos**, que son los que hoy aguantan más de un disparo:

- `enemy-formation-dmg.png` (aguanta 2 impactos)
- `enemy-diver-dmg.png` (2)
- `enemy-harasser-dmg.png` (4)
- `enemy-rival-dmg.png` (22 — este es el que más se va a ver dañado)

> **Nota para el equipo del juego, no para el artista:** `scout`, `sine` y
> `swarm` mueren de un solo disparo, así que un estado dañado nunca se vería.
> Si se quiere que todos lo tengan, primero hay que subirles la vida a 2 —
> es una decisión de dificultad, no de arte.

El **destello blanco** al recibir un impacto y las **partículas de explosión**
ya los genera el juego por código: no hay que dibujarlos.

---

## 7. PRIORIDAD 1 — Jefe "Sentinel"

Nave **gigante** (ocupa casi la mitad de alto de la pantalla), silueta
**blocky/acorazada** — se lee como fortaleza, no como una nave grande. Tiene un
**núcleo/punto débil visible** en el centro-derecha, de donde salen sus
disparos.

| Archivo | Tamaño | Color | Estado |
|---|---|---|---|
| `boss-sentinel-1.png` | 320 × 280 | `#ff5470` | Intacto |
| `boss-sentinel-2.png` | 346 × 302 | `#d43a5c` | Dañado: grietas, placas sueltas |
| `boss-sentinel-3.png` | 378 × 330 | `#9c1f3c` | Crítico: muy roto, oscuro, casi negro |

El jefe **crece de verdad** entre fases (×1.08 y ×1.18) — por eso los tres
tamaños distintos. Hitbox real: 256×224 en fase 1.

---

## 8. PRIORIDAD 2 — Proyectiles y recogibles

Pueden esperar a la siguiente tanda.

| Archivo | Tamaño | Color | Nota |
|---|---|---|---|
| `bullet-player.png` | 16 × 8 | `#ffd23f` | Disparo normal del jugador |
| `bullet-laser.png` | 40 × 8 | `#3ee6c4` | Arma fuerte: **rayo alargado con estela**, tiene que leerse como rayo, no como otra bala |
| `bullet-enemy.png` | 12 × 8 | `#ff5470` | Disparo enemigo normal |
| `bullet-boss.png` | 32 × 32 | `#ff5470` | Orbe con halo. Mucho más grande que una bala normal: el jefe es gigante y su disparo debe sentirse igual |
| `missile.png` | 28 × 14 | `#ff8c3e` | Misil del jugador, mirando a la derecha, con estela |
| `power-core.png` | 24 × 24 | `#ffd23f` | Gema/núcleo que se recoge durante la partida. "Valioso", distinto de una bala |
| `item.png` | 24 × 24 | `#9dff5e` | Item de hangar. Debe leerse como **botín permanente**, más "objeto" que "energía" — distinto del Power Core a simple vista |

---

## 9. Lo que NO hay que dibujar

Todo esto lo genera el juego por código. No pierdas tiempo:

- Fondo y estrellas (parallax de 3 capas)
- Partículas de explosión y chispas
- Destello blanco de impacto
- Grietas del jefe (ya son procedurales; los sprites de §7 las sustituirían)
- Barras de vida, HUD, texto, botones táctiles
- Cualquier ciclo de animación

---

## 9B. PRIORIDAD 1 (nueva) — Fondos y entornos

> Esta sección se añadió después de ver los primeros sprites en el juego. Los
> sprites estaban bien, pero **flotaban sobre un vacío negro**: hoy el fondo
> son literalmente 165 puntos blancos sobre color plano. Por muy bueno que sea
> un sprite, sin mundo detrás el juego se ve pobre. Esto es ahora lo que más
> impacto tiene.

### Cómo funciona el fondo en este juego

El mundo se desplaza **de derecha a izquierda**, sin fin. El fondo se compone
de **3 capas con parallax**: cuanto más lejos, más despacio se mueve. Eso crea
la profundidad.

| Capa | Velocidad | Qué va aquí |
|---|---|---|
| Lejana | Muy lenta | Nebulosas, planetas, siluetas gigantes. Muy oscuro, poco contraste |
| Media | Media | Estructuras, formaciones, escombros. Contraste medio |
| Cercana | Rápida | Elementos que pasan **por delante** de la acción. Ver aviso abajo |

### Requisitos técnicos

- **Cada capa: 960 × 540 px.**
- **Debe repetir sin costura en horizontal**: el borde derecho tiene que
  encajar con el izquierdo, porque la capa se repite en bucle. Si no encaja,
  se ve un corte cada pocos segundos y no sirve.
- **Capas media y cercana: con transparencia** (PNG con alfa), porque se
  dibujan encima de la lejana.
- La capa lejana puede ser opaca (es el fondo del todo).

### ⚠️ La capa cercana necesita ARTE PROPIO

Se intentó hacerla recortando la parte de abajo del mismo fondo y pintándola
otra vez con opacidad baja. **No funciona y se quitó del juego**: se ve
exactamente como lo que es — la misma imagen encima de sí misma. Un parallax
necesita que cada capa tenga contenido distinto, no la misma imagen a medio
gas. Si no hay arte propio para la capa cercana, es mejor no tener capa
cercana.

### ⚠️ Aviso sobre la capa cercana

Todo lo que pase por delante **tapa al jugador y a las balas**. En un juego
donde te matan por un píxel, eso es peligroso. Por eso:

- Muy oscuro (casi silueta), para que se lea como "esto está delante" y no
  compita con la acción.
- Poco denso: elementos sueltos, no una masa continua.
- Nunca en la banda vertical central, que es donde se juega.

### Qué pedir primero

**Solo el entorno espacial (el del stage 1).** Hasta que no veamos una capa
real dentro del juego no sabemos si el tamaño, el contraste y la costura
funcionan. Cuando eso esté validado, se piden los demás con la misma receta.

| Archivo | Capa | Nota |
|---|---|---|
| `bg-space-far.png` | Lejana | Nebulosa muy tenue, alguna estrella grande. Casi negro |
| `bg-space-mid.png` | Media | Planeta lejano, cinturón de asteroides, estación rota. Con alfa |
| `bg-space-near.png` | Cercana | Pocos asteroides oscuros en silueta. Con alfa, muy poco denso |

### Los otros entornos (todavía NO, pero para que los tengas en la cabeza)

Cada uno debe reconocerse **de un vistazo**, por color y por forma:

| Entorno | Identidad visual | Idea de obstáculo (futuro) |
|---|---|---|
| **Cueva** | Roca, estalactitas, tonos tierra y ocre, espacios cerrados | Techos y suelos que estrechan el paso |
| **Océano** | Azules y verdes, luz filtrada desde arriba, burbujas, siluetas de criaturas | Corrientes que empujan la nave |
| **Volcán** | Rojos y negros, ceniza, lava brillando desde abajo | Géiseres de lava con ritmo |
| **Hielo** | Blancos y cianes, cristales, niebla | Bloques a la deriva |

**Nota importante para quien dibuje esto:** el color de identidad del entorno
no puede chocar con los colores de los enemigos (§3). El entorno de hielo es
cian y el enemigo `swarm` también — si el fondo es cian brillante, el enjambre
desaparece. Los fondos van siempre **desaturados y oscuros**; el color
saturado se reserva para lo que mata.

---

## 10. Futuro (NO hacer todavía)

Anotado para que lo tengas en cuenta al diseñar, no para producirlo ahora:

- **Variantes de pieza de la nave** (§5.2).
- **Tilesets de obstáculos** para cada entorno (§9B) — cuando el motor tenga
  colisión contra terreno, que hoy no tiene.

---

## 11. Entrega

- Un PNG por archivo, con los nombres exactos de las tablas (minúsculas,
  guiones).
- Todo junto, sin subcarpetas.
- Si generas alternativas, márcalas (`enemy-scout-v1.png`, `-v2.png`) y se
  elige después.
- Se validan integrándolos y mirándolos **a tamaño real dentro del juego**.
  Es habitual que un pixel art generado en grande se vuelva ilegible al
  reducirlo: si pasa, se pide una versión con menos detalle y silueta más
  fuerte.

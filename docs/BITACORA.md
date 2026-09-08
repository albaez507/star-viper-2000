# Bitácora — Star Viper 2000

## 2026-09-08 — Fase 0: carpeta y documentación

Concepto refinado en ChatGPT y traído aquí: shoot-'em-up horizontal de arcade
para navegador, con identidad visual propia (no clon de nada), pensado primero
para pantalla de iPhone.

**Stack decidido** (excepción consciente al estándar Vanilla JS del
`DEV_WORKFLOW.md`, porque el juego necesita tipos y un build real):

- TypeScript + Vite
- HTML5 Canvas 2D
- Web Audio API (todo sintetizado, sin ficheros de audio)
- Pointer Events para el control táctil
- Sin motor de juego
- Sin dependencias de runtime
- Deploy: **Cloudflare Pages** (razonamiento en `LOGIC.md` § 13 — Firebase
  descartado por el multijugador futuro con WebSockets)

**Creado en este paso:**

- Carpeta `star-viper-2000/`
- `README.md` — stack, cómo correrlo, controles, medidor de poder, patrones
- `docs/STRUCTURE.md` — árbol de ficheros propuesto y reglas de importación
- `docs/LOGIC.md` — arquitectura completa: bucle, InputFrame, Options por
  historial de posiciones, formaciones/Power Cores, medidor, comportamientos,
  jefe, game feel, starfield, colisiones, preparación multijugador, deploy
- `docs/BITACORA.md` — este fichero

**Reglas de diseño que quedan fijadas y no se negocian después:**

1. El Power Core **solo** cae si se destruye la formación de 6 completa sin que
   ninguno escape. Nunca "cada X kills".
2. Los Options siguen un **historial de posiciones** del jugador, no offsets
   fijos.
3. `src/game/` no toca DOM, ni Canvas, ni Audio, ni `Math.random()`.
4. Screen shake solo para impactos con peso (daño al jugador, muerte del jefe,
   misil), nunca al disparar.
5. Nada de red en la fase 1, pero `state.players[]` y RNG con semilla desde el
   primer commit.

## 2026-09-08 (tarde) — Milestone 1 jugable + repo en GitHub

Estructura aprobada. Andamiaje completo con Vite + TypeScript + `tsc -b`
estricto (`strict`, `noUnusedLocals`, `noUnusedParameters`).

**Implementado, siguiendo `STRUCTURE.md` al pie de la letra:**

- `core/`: bucle de tick fijo (60 Hz) con acumulador, pool genérico, RNG con
  semilla (xorshift32), bus de eventos, tipos compartidos.
- `game/`: `world.ts` con `step(state, input, dt)` puro — nada de DOM, Canvas
  ni Audio. Jugador, historial circular de 120 posiciones, Options (delay de
  18/36 ticks), balas, misiles, 4 patrones de enemigo (`scout`, `sine`,
  `diver`, `formation`) registrados por nombre, formaciones con recompensa
  todo-o-nada, medidor de poder de 6 casillas con cursor + contador de
  "filled" (para no poder activar PWR sin haber recogido ningún core), jefe
  "Sentinel" con 3 fases por vida y guion de oleadas en `stage1.ts`.
- `input/`: teclado (flechas/WASD, espacio, M, shift) + táctil por Pointer
  Events con D-pad de 4 zonas + PWR central por distancia al centro, FIRE y
  MISSILE apilados en vertical tal y como pide el spec.
- `render/`: starfield de 3 capas, sprites generados por código (sin
  ficheros), HUD con medidor de poder y barra de vida del jefe, pantallas de
  título/game over/victoria dibujadas en canvas.
- `fx/`: partículas por pool circular, screen shake con curva de decaimiento.
- `audio/`: todo sintetizado con osciladores y ruido filtrado de Web Audio,
  desbloqueado en el primer `pointerdown`/`keydown`.
- `net/README.md`: contrato reservado, carpeta vacía a propósito.

**Verificado en el navegador (Vite dev server, puerto 5175):**

- Pantalla de título, arranque con Enter/tap, HUD (score, vidas, medidor).
- Movimiento del jugador con clamp a los bordes, disparo, oleadas de scouts
  entrando y siendo destruidos con partículas y sonido.
- **Formación de 6 → Power Core → recogida → PWR activa SPEED → medidor se
  resetea a 0.** Probado end-to-end mutando el estado del juego vía consola
  para forzar impactos precisos (`e.hp`, `player.x/y`) y confirmando que pasa
  por el código real de colisión/recompensa, no un atajo simulado.
- Formación con un escape → `failed = true`, `rewarded` nunca se activa: sin
  core, confirmado con una formación sintética.
- Layout táctil en viewport estrecho: D-pad + PWR circular a la izquierda,
  FIRE encima de MSL a la derecha, tal como pide el spec.

**Detalle técnico del entorno de prueba:** el navegador de previsualización
de esta sesión no dispara `requestAnimationFrame` de forma continua (0 ticks
tras 1s en reposo). Se verificó invocando el `tick()` del loop manualmente
desde consola para simular fotogramas — el motor y el render son correctos;
es una particularidad del entorno de automatización, no del juego. En un
navegador real (Chrome/Safari en escritorio o iPhone) `requestAnimationFrame`
corre de forma nativa sin este rodeo.

**Pendiente conocido:**

- El `aspect-ratio: 16/9` del canvas no se adapta perfectamente a pantallas
  muy verticales (deja franjas vacías arriba/abajo en portrait extremo) —
  revisar con dispositivo real antes de dar el layout móvil por cerrado.
- El jefe no ha sido probado en partida real (sí revisado el código de fases
  y patrón de disparo).
- Sonido no verificado de oído (Web Audio no se puede escuchar desde este
  entorno) — revisar balance de volumen en dispositivo real.

**Repo:**

- `git init` + commit inicial + `.gitignore` (`node_modules/`, `dist/`,
  `*.tsbuildinfo`, `.env`).
- Creado `github.com/albaez507/star-viper-2000` (privado) con `gh repo
  create --source=. --remote=origin` y pusheado a `main`.
- Lanzador de dev server añadido a `DEVELOPMENT EMANUEL/.claude/launch.json`
  (puerto 5175, junto a tab-organizer/trazo/leef-connect).

**Pendiente / siguiente paso:**

- Conectar Cloudflare Pages al repo (paso manual de dashboard, ver
  `DEV_WORKFLOW.md` § 6) — build command `npm run build`, output `dist/`.
- Probar en un iPhone real: layout táctil, audio, rendimiento.
- Registrar en Notion (Projects Registry) y en `PROJECTS_SUMMARY.md`.
- Iterar sobre identidad visual una vez el MVP funcional esté validado
  (todavía en placeholders geométricos, según el spec original).

## 2026-09-08 (noche) — Misil como bomba, pausa, jefe gigante con fases

El usuario probó el juego y reportó que el misil "no funciona". Investigado a
fondo: el disparo, el daño y el vuelo del misil sí funcionaban (confirmado
inyectando ticks manuales y leyendo `state.missiles`), pero **no había ninguna
señal visual de que existiera** — sin barra de cooldown, sin indicación de
cuándo estaba listo, y el proyectil era pequeño y fácil de perder de vista.
Diagnóstico: no era un bug de lógica, era ausencia total de feedback. Se
aprovechó además para redefinir el arma como el usuario la describió — una
bomba de área, no un arma secundaria de disparo continuo.

**Cambios:**

- **Misil ahora hace daño en área** (`game/world.ts::explodeMissile`, radio 46
  px): al primer impacto explota y daña a todo enemigo/jefe cercano, no solo
  al primero que toca. Nuevo evento `missileImpact` con burst de partículas
  más grande, sonido de explosión distinto (ruido filtrado + tono grave) y
  shake pequeño — coherente con la regla de "shake solo en impactos con peso".
- **Indicador de misil en el HUD** (`render/hud.ts::drawMissileStatus`): barra
  bajo LIVES que se llena con el cooldown real (`missileCooldownFor`) y se
  pone naranja brillante con el texto "MISIL LISTO (M/X)" en cuanto se puede
  disparar. El botón táctil MSL también brilla (`.action-missile.ready` en
  `ui.css`) cuando está listo.
- **Teclas de misil**: ya estaba en `M` desde el milestone 1 (documentado pero
  fácil de pasar por alto); se añadieron `X` y `Ctrl` izquierdo como
  alternativas más descubribles.
- **Sistema de pausa, antes inexistente**: `consumePausePressed()` ya existía
  en `input.ts` desde el milestone 1 pero **nunca se llamaba** desde
  `main.ts` — la tecla P no hacía nada. Ahora: tecla P + botón `⏸` fijo en la
  esquina superior derecha (visible siempre durante la partida, no depende de
  layout táctil), pantalla "PAUSA" superpuesta, y todo se congela de verdad
  (mundo, starfield, partículas, shake) mientras está en pausa.
- **Jefe "Sentinel" ahora es gigante**: de 68×60 px a **128×112 px** (más de
  6× el área del jugador). Ajustado el margen de anclaje y el punto de
  aparición para que no se salga de pantalla.
- **Evolución visual del jefe por fases** (`render/sprites.ts::drawBoss`):
  color más oscuro e intenso por fase (`#ff5470` → `#d43a5c` → `#9c1f3c` con
  pulso), grietas blancas procedurales a partir de la fase 2 (más densas en
  fase 3), anillo de energía pulsante alrededor del núcleo en fase 3. Esto
  responde a la idea del usuario de un sistema de "evolución por fases" tipo
  el juego que mencionó (una araña/ratón con esqueleto que cambia de forma al
  ser dañado) — **se aprobó extenderlo solo al jefe**, no a enemigos
  regulares (mueren demasiado rápido para que se note, y multiplica el
  trabajo de arte). Detalle completo en `LOGIC.md` §8 y §14.

**Verificado en el navegador** (mismo método de tick manual que en el
milestone 1, porque el entorno de previsualización de esta sesión no dispara
`requestAnimationFrame` — ver nota técnica arriba): misil explota con daño en
área, barra de cooldown se llena/vacía correctamente, pausa congela el mundo
y lo reanuda exacto donde quedó, jefe gigante se ve claramente más grande que
cualquier enemigo, y las tres fases muestran colores y grietas distintas —
capturado en screenshot con el jefe en fase 3 (carmesí oscuro, grietas densas,
anillo pulsante, barra de vida al 20%).

**Discutido pero pospuesto (no implementado):** entrada de enemigos desde
direcciones distintas a la derecha, y enemigos no-nave (ej. un "pulpo
espacial"). Ambas quedan anotadas en `LOGIC.md` §14 como milestone 2 — el
usuario decidió retomarlas después de ver el juego con los primeros assets
reales en vez de ahora, con motor todavía en placeholders.

## 2026-09-08 (noche, cont.) — Detonación manual del misil y barra del jefe arriba

Dos ajustes puntuales sobre lo anterior:

- **Detonación manual del misil** (`game/world.ts::stepFiring`): si ya hay un
  misil en vuelo y se pulsa MISSILE otra vez, ya no se ignora ni se dispara
  uno nuevo — el/los misil(es) en camino explotan de inmediato en su posición
  actual, con el mismo daño en área de `explodeMissile`. Verificado con un
  test aislado inyectando un enemigo lejos de la trayectoria natural del
  misil: el misil desapareció exactamente en el segundo press, sin colisión
  natural posible, confirmando que fue la detonación manual y no un disparo
  nuevo. También se verificó el splash real con dos enemigos cercanos entre
  sí (distancia 36px, radio 46+8=54px): ambos recibieron daño de la misma
  explosión en el mismo tick.
- **Barra de vida del jefe movida arriba** (`render/hud.ts::drawBossBar`):
  antes estaba pegada al borde inferior, poco visible en combate. Ahora es
  una franja fina de ancho completo en el borde superior (`y=0, h=8`), con
  etiqueta "JEFE" debajo, sin pisar el SCORE/LIVES/medidor de poder que
  siguen empezando en `y=10`. Confirmado con screenshot: jefe al 55% de vida,
  franja roja hasta poco más de la mitad del ancho.

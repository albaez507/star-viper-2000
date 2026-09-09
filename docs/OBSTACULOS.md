# Obstáculos y ritmo de los primeros niveles

Documento de análisis. Escrito el 2026-09-09 a partir de la petición:
*"quiero enfocarme en agregar obstáculos y de diferentes formas, obstáculos
que sean de foreground y obstáculos que sean objetos moviéndose. Así que los
primeros niveles no está tan enfocado en consigo un arma más poderosa, sino
que puedo mejorar mi arma un poquito, pero está enfocado más como en
sobrevivir... tampoco tan difícil porque debería ser un nivel inicial."*

---

## 1. El problema real que hay hoy

El juego solo sabe pedirte una cosa: **puntería**. Todo lo que aparece en
pantalla se resuelve disparándole. Por eso el nivel 1 se siente resuelto en
cuanto tienes el arma: no hay ninguna pregunta que el arma no conteste.

Un obstáculo es lo único que rompe eso, porque es la primera cosa del juego
que **no se resuelve disparando**. Le enseña al jugador a mirar el espacio en
vez de mirar los enemigos. Y es la base de la que salen casi todas las
tensiones buenas de un shmup: *"tengo el disparo cargado pero no tengo dónde
ponerme"*.

Eso es lo que hace que los primeros niveles puedan ser de supervivencia sin
ser difíciles: **no aumentas el daño que recibes, aumentas las decisiones**.

---

## 2. Los tres tipos de obstáculo (y qué enseña cada uno)

Los ordeno por costo de implementación, de más barato a más caro.

### A. Objeto sólido que cruza — **YA IMPLEMENTADO**
Una roca que entra por la derecha y se va por la izquierda. Las balas se
apagan contra ella. Si la tocas, pierdes vida como con cualquier enemigo.

Dos sabores, y la diferencia importa más de lo que parece:
- **fija** (`driftAmp: 0`): pasa recta. Se memoriza. Es la que enseña.
- **móvil** (`driftAmp: 70`): sube y baja mientras avanza. Hay que *leerla*,
  no memorizarla. Es la que después se vuelve exigente.

Hoy en `Jardines del Céfiro` las oleadas alternan las dos: los índices pares
son fijas, los impares móviles.

Costo: ya está. Reutiliza la colisión enemigo↔jugador que ya existía.

### B. Foreground que tapa la vista — **NO implementado**
Una capa que pasa **por delante** de la nave, más rápido que el fondo, y que
te oculta parte de la pantalla durante un segundo. No hace daño. No colisiona.

Esto es psicológicamente distinto del tipo A: el tipo A te quita **espacio**,
el foreground te quita **información**. Es el que da sensación de velocidad y
de estar volando *dentro* de algo, y es exactamente lo que encaja con tu idea
del viaje (rasante → nubes → altura → espacio).

Ojo con una trampa: si tapa demasiado, deja de ser tensión y se vuelve
injusto. La regla sana es que **nunca oculte más de un tercio de la pantalla
a la vez y nunca durante más de ~1 segundo**.

Costo: bajo. Es una capa más en el render del cielo, con su propio scroll y
su propio PNG. No toca `src/game/` en absoluto — no es lógica, es dibujo.

### C. Terreno / paredes — **NO implementado, y yo lo dejaría para después**
Techo y suelo que se estrechan y te obligan a pasar por un hueco. Es lo que
hace el nivel de las cuevas en cualquier shmup clásico.

Es el que más cambia el juego y el que más cuesta: necesita colisión contra
una silueta, no contra una caja, y necesita que el arte y la colisión coincidan
o se siente tramposo. Además choca con la cámara: si hay paredes, ya no puedes
moverte libremente en vertical, y eso cambia todo el diseño de las oleadas.

Recomendación: **no ahora**. Es el gancho del nivel de superficie del planeta,
al final del viaje, cuando ya haya razón para él.

---

## 3. Cómo se convierte esto en "nivel inicial de supervivencia sin ser duro"

La palanca no es el daño, es **cuántas cosas te piden atención a la vez**.

Un nivel inicial bien armado sube esa cuenta de a una:

| Tramo | Qué hay en pantalla | Qué te pide |
|---|---|---|
| 0–10 s | solo enemigos lentos | apuntar |
| 10–20 s | una roca sola, sin enemigos | descubrir que no se mata |
| 20–35 s | roca + enemigos | elegir a qué le dedicas el espacio |
| 35–50 s | rocas móviles | leer trayectorias |
| 50–70 s | rocas + foreground | actuar con información incompleta |
| 70–90 s | todo junto, más denso | el examen |

Lo importante es el segundo tramo: **la primera roca tiene que aparecer
sola**. Si la primera vez que ves una roca también te están disparando, no
aprendes la regla, solo te mueres. Por eso en el stage la primera oleada de
obstáculos (t=6) va sin enemigos encima, y las mezcladas empiezan en t=40.

Y para que no sea difícil: los obstáculos **no persiguen**. Van a velocidad
constante. Siempre hay un hueco. La dificultad está en que tienes que
decidir *cuándo* usarlo, no en si existe.

---

## 4. Lo de "en el nivel uno ya tengo todo"

Esto es cierto y es un problema aparte de los obstáculos, aunque se resuelve
en el mismo movimiento.

Hoy: cores necesarios por nivel de arma = **1, 3, 5**. `Jardines del Céfiro`
reparte 6 formaciones, o sea 6 cores posibles. Si juegas bien, terminas el
stage con el arma al máximo — y como el arma al máximo también trae los
Options, el nivel 2 empieza sin nada que ganar.

Hay tres formas de arreglarlo. Mi recomendación es la tercera.

1. **Subir los umbrales** (1, 4, 7). Lo más fácil. Pero solo mueve el
   problema: sigues terminando el stage al máximo, solo que más justo, y
   castiga al jugador que juega bien, que es a quien no quieres castigar.

2. **Menos formaciones en el stage 1.** Funciona, pero le quita al stage lo
   que ya funciona bien: la formación de 6 es el mejor momento del juego.

3. **Tope de arma por sector** (recomendada). Cada stage tiene un techo:
   sector 1 llega hasta nivel 1, sector 2 hasta nivel 2, sector 3 hasta 3.
   Los cores que sobran no se pierden: se guardan y arrancan el siguiente
   sector con ventaja.

   Por qué es la buena: hace que el arma sea **la historia del viaje** en vez
   de una carrera dentro de un nivel. El sector 1 pasa a tratarse de lo que tú
   quieres que se trate — sobrevivir y aprender a leer el espacio — y el arma
   se vuelve la recompensa de *avanzar*, no de farmear. Además encaja solo con
   el panel de la nave: las piezas deciden cómo juegas, los cores cuánto
   pegas, y el sector decide hasta dónde puedes llegar hoy.

   Costo: bajo. Un campo `maxWeaponLevel` en la definición del stage y un
   `Math.min` en `subirArma`.

**Esta decisión es tuya y no la he implementado.** Dime cuál y lo hago.

---

## 5. Estado actual del código

Lo que ya está hecho y se puede jugar:

- `src/game/behaviors/hazard.ts` — movimiento del obstáculo (recto + vaivén).
- `Enemy.indestructible` — las balas y el misil no le hacen nada.
- `src/game/spawner.ts` — `case 'hazard'`, alterna fijas y móviles.
- `src/render/sprites.ts` → `drawHazard` — roca gris angular, **provisional**,
  a propósito nada parecida a un enemigo, sin destello al recibir impactos.
- 3 oleadas de obstáculos en `Jardines del Céfiro` (t=6, t=40, t=72).
- Prueba `hazards absorb fire instead of dying`.

Lo que falta:
- Arte real del obstáculo (pedido en `ASSET_BRIEF.md` §9C).
- Capa de foreground (tipo B).
- Decisión sobre el tope de arma por sector (§4).
- Los dos sectores nuevos del viaje (`ASSET_BRIEF.md` §9D).

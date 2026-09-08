# Lógica — Star Viper 2000

Documento de arquitectura y diseño de sistemas. Escrito **antes** de programar,
según el método de los 6 layers.

---

## 1. Principio rector

Tres cosas separadas, siempre:

```
INPUT  →  ESTADO  →  RENDER
```

- **Input** produce un `InputFrame` neutro (booleanos y ejes). No sabe si viene
  de un dedo o de un teclado.
- **Estado** (`game/world.ts`) es una función pura: `step(state, inputs, dt)`.
  Mismo estado + mismos inputs = mismo resultado, siempre.
- **Render** solo lee el estado y dibuja. Si borras toda la carpeta `render/`,
  el juego sigue "jugándose" en memoria sin errores.

Esta regla no es purismo: es exactamente lo que permite meter un servidor
autoritativo después sin reescribir el juego.

---

## 2. Bucle de juego

Paso fijo con acumulador, no delta variable:

```
TICK = 1/60 s

frame():
  acc += min(realDelta, 0.25)     // clamp anti-espiral tras un tirón
  while acc >= TICK:
      inputs = input.sample()
      world.step(state, inputs, TICK)
      acc -= TICK
  alpha = acc / TICK
  renderer.draw(state, alpha)     // interpolación visual
```

Por qué paso fijo: el determinismo se rompe con delta variable, y sin
determinismo no hay reconciliación con servidor. El movimiento sigue siendo
"delta-time based" — simplemente el delta es constante y conocido.

El render interpola entre la posición previa y la actual (`alpha`) para que a
144 Hz no se vea a 60.

---

## 3. InputFrame

Único contrato entre el input y el juego:

```ts
type InputFrame = {
  up: boolean; down: boolean; left: boolean; right: boolean;
  fire: boolean;      // mantener = disparo automático a cadencia
  missile: boolean;   // borde: solo el frame en que se pulsa
  power: boolean;     // borde: solo el frame en que se pulsa
  tick: number;       // número de tick al que corresponde
};
```

Un `InputFrame` es serializable a JSON y pesa nada. El día del multijugador,
esto es literalmente lo que viaja por el cable.

### Táctil (Pointer Events)

- `pointerdown` / `pointermove` / `pointerup` con `setPointerCapture`.
- Cada pointer activo se asocia a la zona donde nació (D-pad izquierdo, botones
  derechos) y **se queda en esa zona** aunque el dedo se salga: se puede
  deslizar del D-pad sin perder el control.
- El D-pad es una zona de 4 direcciones + un círculo central PWR con radio
  propio; se comparan distancias al centro para decidir cuál está pulsado.
- FIRE arriba, MISSILE abajo, apilados en vertical, con zona táctil más grande
  que el círculo visible.
- `touch-action: none` en el overlay para matar el scroll y el zoom del
  navegador.

---

## 4. Movimiento del jugador y Options

### Historial de posiciones

Cada tick se guarda la posición del jugador en un **buffer circular** de ~120
entradas (2 segundos a 60 Hz):

```
history[head] = {x, y}
head = (head + 1) % 120
```

### Options

Un Option **no** cuelga a un offset fijo detrás de la nave. Lee el historial
con un retraso:

```
Option 1 → history[head - 18]    (0.30 s atrás)
Option 2 → history[head - 36]    (0.60 s atrás)
```

Resultado: los orbes recorren exactamente la trayectoria que hizo la nave. Si
el jugador dibuja una S, los Options dibujan la misma S detrás. Es el
comportamiento correcto del arcade clásico y es lo que hace que el sistema se
sienta bien.

Cada Option dispara **el mismo frame** que el jugador, con la misma arma, desde
su propia posición. Máximo 2 en la fase 1; el buffer ya soporta más (retrasos
de 54, 72...).

---

## 5. Formaciones y Power Cores

Ésta es la regla más importante del diseño y la que **no** se debe simplificar.

```
FormationState = {
  id: number
  members: EnemyId[]     // 6
  killed: number
  escaped: number
  rewarded: boolean
}
```

Ciclo de vida:

1. El spawner crea 6 enemigos con el mismo `formationId` y los marca
   visualmente (aura / color distinto) para que el jugador sepa que ese grupo
   vale un core.
2. Un miembro muere → `killed++`.
3. Un miembro **sale por el borde izquierdo** → `escaped++` y la formación se
   marca como fallida de inmediato (feedback visual: el aura se apaga).
4. Solo si `killed === 6 && escaped === 0` se suelta un **Power Core** en la
   posición del último enemigo muerto.

No hay premio parcial, ni cores por número de kills, ni cores por tiempo.
Matar 5 de 6 no da nada. Eso es lo que convierte cada formación en una decisión
táctica en lugar de en relleno.

El core es un objeto físico que hay que **recoger**: flota y deriva hacia la
izquierda; si escapa, se pierde.

---

## 6. Medidor de poder

```
[ SPEED ][ MISSILE ][ DOUBLE ][ LASER ][ OPTION ][ SHIELD ]
```

- Recoger un core: `cursor = min(cursor + 1, 5)`.
- Pulsar PWR: se aplica la mejora de `cursor` y `cursor = 0`.
- PWR sin cores recogidos: no hace nada, sonido de negativo.

| Mejora | Efecto | Acumulable |
|---|---|---|
| SPEED | +18% velocidad de la nave | Sí, hasta 4 niveles |
| MISSILE | Desbloquea/mejora el misil (más cadencia) | Sí, hasta 2 |
| DOUBLE | Añade un disparo diagonal hacia arriba | No (excluye LASER) |
| LASER | Sustituye el disparo por un rayo penetrante | No (excluye DOUBLE) |
| OPTION | +1 Option (máx. 2 en la fase 1) | Sí, hasta 2 |
| SHIELD | Escudo que absorbe 3 impactos, con anillo visible | Recarga a 3 |

Tensión de diseño buscada: SHIELD está al final, así que salvarse cuesta
guardar cinco formaciones perfectas. Gastar en SPEED es barato pero te deja
lejos de OPTION.

---

## 7. Enemigos y comportamientos

Un enemigo es datos. El movimiento es una función registrada por nombre:

```ts
type Behavior = (e: Enemy, dt: number, w: GameState) => void;

const behaviors: Record<string, Behavior> = {
  scout, sine, diver, formation
};
```

| Patrón | Lógica |
|---|---|
| `scout` | `x -= speed * dt`. Nada más. Carne de cañón legible. |
| `sine` | `x -= speed*dt`, `y = baseY + amp * sin(t * freq + phase)` |
| `diver` | Fase 1: entra recto hasta `x < triggerX`. Fase 2: fija el vector hacia la posición del jugador **en ese instante** y se lanza. No persigue eternamente — el jugador puede esquivar. |
| `formation` | Sigue un punto de anclaje del grupo (formación en V, columna u onda); el grupo se mueve como una unidad |

Añadir un patrón nuevo (`weaver`, `turret`, `bomber`, `mine`) es un fichero en
`game/behaviors/` y una línea en el registro. Cero cambios en el resto.

Cada enemigo lleva `hp`, `hitFlash` (contador de frames en blanco) y `score`.

---

## 8. Fase 1 y jefe

Guion en `game/stage1.ts` como datos, no como código:

```ts
[
  { t: 2.0,  type: 'scout',   count: 5, pattern: 'stream' },
  { t: 8.0,  type: 'sine',    count: 4 },
  { t: 14.0, formation: true, count: 6, shape: 'v' },      // → Power Core
  { t: 22.0, type: 'diver',   count: 3 },
  { t: 30.0, formation: true, count: 6, shape: 'column' },
  // ...
  { t: 90.0, boss: 'sentinel' }
]
```

**Jefe "Sentinel"**: nave grande que entra por la derecha, se ancla, y alterna
tres fases según su vida (100% → 60% → 30%): abanico de balas, barrido láser
telegrafiado, y llamada de esbirros. Punto débil visible. Muerte en cadena de
explosiones con pausa dramática antes del fin de fase.

---

## 9. Game feel

Es lo más importante del proyecto. Lista cerrada de efectos, todos cortos:

| Evento | Feedback |
|---|---|
| Disparo | Destello de 2 frames en el morro + retroceso de 2 px + sonido corto y seco |
| Bala impacta enemigo | El enemigo se pinta **blanco 3 frames** + chispa de 4-6 partículas |
| Enemigo muere | Burst de 12-18 partículas + destello circular + sonido más grave |
| Recoger core | Flash de la barra + tono ascendente + la casilla nueva pulsa |
| Jugador recibe daño | Flash rojo de pantalla 4 frames + shake fuerte + invulnerabilidad 1.5 s parpadeando |
| Muerte del jefe | Cadena de explosiones + shake largo + slow-motion 0.4 s |

**Screen shake solo para impactos con peso**: daño al jugador, muerte del jefe,
explosión de misil. Nunca al disparar ni al matar un enemigo normal — eso es lo
que convierte el shake en ruido.

Hit-stop: 2-3 frames de congelación en la muerte del jefe. En nada más.

Audio: todo sintetizado con osciladores de Web Audio (square para fire, ruido
filtrado para explosiones). Sin ficheros que cargar. El `AudioContext` se
desbloquea en el primer `pointerdown` (obligatorio en iOS).

---

## 10. Starfield

Tres capas, cada estrella con su factor de profundidad:

| Capa | Nº | Velocidad | Tamaño | Brillo |
|---|---|---|---|---|
| Lejana | 90 | 12 px/s | 1 px | 35% |
| Media | 50 | 34 px/s | 1 px | 65% |
| Cercana | 25 | 80 px/s | 2 px | 100% |

Al salir por la izquierda, la estrella reaparece por la derecha con Y nueva.
Sin 3D, sin cálculo de perspectiva: solo velocidad × brillo × tamaño
correlacionados. Es lo que crea la sensación de profundidad.

Las capas cercanas se dibujan **por encima** de las lejanas pero **por debajo**
de las naves.

---

## 11. Colisiones

AABB simple con hitboxes **más pequeñas que el sprite** para el jugador (regla
de arcade: el jugador siempre siente que esquivó) y **iguales o mayores** para
los enemigos (siempre siente que acertó).

Rejilla espacial de celdas de 64 px para no comparar todo contra todo. Pares
que se comprueban:

```
balaJugador  × enemigo
balaJugador  × jefe
misil        × enemigo/jefe
balaEnemiga  × jugador
enemigo      × jugador
core         × jugador
```

---

## 12. Preparación para multijugador (NO se implementa en la fase 1)

Objetivo final: **cooperativo online, 2 jugadores, dos teléfonos distintos,
servidor autoritativo.**

Decisiones que se toman AHORA para no bloquearlo:

1. **`game/` es aislable.** Sin DOM, sin Canvas, sin Audio. Ese mismo código
   corre en Node sin tocar una línea.
2. **`GameState` es un objeto plano serializable.** Nada de clases con métodos
   guardados dentro, nada de referencias circulares, IDs numéricos en lugar de
   punteros entre entidades.
3. **`state.players[]` desde el día uno**, aunque solo haya uno. El código
   nunca asume "el jugador".
4. **`step(state, inputsPorJugador, dt)`** ya recibe un mapa de inputs, no un
   input suelto.
5. **RNG con semilla** en `core/rng.ts`. Nada de `Math.random()` dentro de
   `game/`. Sin esto, dos clientes divergen en el primer spawn.
6. **Tick fijo numerado.** Cada `InputFrame` lleva su `tick`, que es la unidad
   de sincronización.
7. **El render nunca escribe estado.** Ni un `entity.x +=` dentro de `render/`.

Cuando llegue el momento, el añadido sería:

```
Cliente A ─┐
           ├─ WebSocket ─→ Servidor Node/TS (autoritativo)
Cliente B ─┘                  corre game/step() a 60 Hz
                              emite snapshots ~20 Hz
```

- Sala por **código de invitación** de 4-6 caracteres.
- Cliente hace **predicción local** de su propia nave y **reconciliación** con
  el snapshot del servidor (por eso hace falta el determinismo).
- Enemigos, formaciones, jefe y cores: **solo el servidor decide**. El cliente
  los interpola.
- Reconexión: el servidor guarda el slot del jugador N segundos y reenvía el
  estado completo al volver.

No se escribe nada de red en la fase 1. La carpeta `src/net/` queda vacía a
propósito, como recordatorio del contrato.

---

## 13. Deploy — Cloudflare Pages, no Firebase

Recomendación, con motivo:

- El juego compila a **estáticos** (`dist/`). Cloudflare Pages y Firebase
  Hosting sirven eso igual de bien y de rápido.
- El estándar ya establecido en `DEV_WORKFLOW.md` es Cloudflare Pages, y el
  deploy automático desde GitHub ya está montado en esa cuenta.
- El desempate real es el **multijugador**: hace falta un servidor con
  WebSockets persistentes. Cloudflare lo resuelve con **Durable Objects** en la
  misma cuenta y el mismo despliegue (una sala = un Durable Object, encaja
  exactamente con el modelo). Firebase Hosting **no** sirve WebSockets — habría
  que añadir Cloud Run o cambiar a Realtime Database, que no encaja con un
  servidor autoritativo a 60 Hz.

Decisión: **Cloudflare Pages** para el juego, y Durable Objects reservado para
la fase de multijugador. Firebase se descarta salvo que aparezca una necesidad
de auth/Firestore que hoy no existe.

# Estructura — Star Viper 2000

Propuesta de estructura de ficheros para la fase 1. TypeScript + Vite, sin
motor de juego y sin dependencias de runtime.

Regla de oro: **nada dentro de `src/game/` importa nada de `src/render/`,
`src/input/` ni `src/audio/`.** El estado del juego no sabe que existe una
pantalla. Esa es la condición que hace posible el multijugador más adelante.

```
star-viper-2000/
├── index.html                  Canvas + overlay de HUD/menús
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   └── favicon.svg
├── docs/                       STRUCTURE.md · LOGIC.md · BITACORA.md
└── src/
    ├── main.ts                 Arranque: crea canvas, loop, input, audio, render
    │
    ├── core/                   Infraestructura, nada de reglas de juego
    │   ├── loop.ts             Bucle de tiempo fijo (60 Hz) + acumulador
    │   ├── rng.ts              Random con semilla (determinista, clave para red)
    │   ├── pool.ts             Pool de objetos: balas, partículas, enemigos
    │   ├── events.ts           Bus de eventos del juego (hit, muerte, core...)
    │   ├── math.ts             clamp, lerp, distancia, ángulos
    │   └── types.ts            Tipos compartidos (Vec2, Rect, Entity, InputFrame)
    │
    ├── game/                   ESTADO PURO — determinista, sin DOM, sin Canvas
    │   ├── world.ts            GameState completo + step(state, inputs, dt)
    │   ├── player.ts           Nave: movimiento, cadencia, daño, invulnerabilidad
    │   ├── history.ts          Historial de posiciones del jugador (para Options)
    │   ├── options.ts          Orbes de apoyo que siguen posiciones pasadas
    │   ├── bullets.ts          Balas del jugador y del enemigo
    │   ├── missiles.ts         Misiles: arco de caída, daño mayor
    │   ├── enemy.ts            Entidad enemiga + salud + flash de impacto
    │   ├── behaviors/          UN FICHERO POR PATRÓN DE MOVIMIENTO
    │   │   ├── index.ts        Registro nombre → función de comportamiento
    │   │   ├── scout.ts
    │   │   ├── sine.ts
    │   │   ├── diver.ts
    │   │   └── formation.ts
    │   ├── formations.ts       Grupos de 6, marcado, seguimiento de escapes
    │   ├── powercore.ts        Drop del core, recogida, avance del cursor
    │   ├── powermeter.ts       SPEED·MISSILE·DOUBLE·LASER·OPTION·SHIELD
    │   ├── boss.ts             Jefe de la fase 1: fases y patrones de ataque
    │   ├── collision.ts        AABB + rejilla espacial simple
    │   ├── spawner.ts          Lee el guion de la fase y crea oleadas
    │   └── stage1.ts           Datos de la fase 1 (tiempos, oleadas, jefe)
    │
    ├── input/                  Convierte input físico → InputFrame neutro
    │   ├── input.ts            Agrega fuentes y produce el InputFrame del tick
    │   ├── keyboard.ts         Teclado (escritorio)
    │   └── touch.ts            Pointer Events: D-pad + PWR + FIRE + MISSILE
    │
    ├── render/                 SOLO LEE el estado, nunca lo modifica
    │   ├── renderer.ts         Orquesta capas y aplica el screen shake
    │   ├── camera.ts           Offset de scroll y sacudida de pantalla
    │   ├── starfield.ts        Parallax de 3 capas por factor de profundidad
    │   ├── sprites.ts          Sprites generados por código en canvas offscreen
    │   ├── particles.ts        Render del sistema de partículas
    │   ├── hud.ts              Score, vidas, medidor de poder, avisos
    │   └── screens.ts          Título, pausa, game over, transición de fase
    │
    ├── fx/
    │   ├── particles.ts        Simulación de partículas (estado, no render)
    │   └── shake.ts            Curva de sacudida por impacto
    │
    ├── audio/
    │   ├── audio.ts            Contexto Web Audio, desbloqueo al primer toque
    │   └── sfx.ts              Sonidos sintetizados: fire, hit, boom, core, dmg
    │
    ├── net/                    VACÍO EN LA FASE 1 — reservado para multijugador
    │   └── README.md           Contrato previsto de red (ver LOGIC.md)
    │
    └── styles/
        ├── tokens.css          Paleta limitada, tipografía, radios
        └── ui.css              Overlay de HUD y botones táctiles
```

## Por qué esta separación

| Carpeta | Puede importar de | Nunca importa de |
|---|---|---|
| `core/` | — | game, render, input, audio |
| `game/` | core | render, input, audio, DOM |
| `input/` | core | game (solo produce `InputFrame`) |
| `render/` | core, game (lectura) | input, audio |
| `audio/` | core, events | game |
| `net/` | core, game | render, input |

`game/` es la única carpeta que se ejecutaría también en el servidor el día que
haya multijugador. Por eso no puede tocar `window`, `document`, `Canvas`,
`Audio` ni `Math.random()` (usa `core/rng.ts` con semilla).

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

**Pendiente / siguiente paso:**

- Aprobar la estructura propuesta en `STRUCTURE.md`.
- Andamiaje del proyecto (`npm create vite`, tsconfig, canvas, bucle vacío).
- Milestone 1 jugable: movimiento, disparo, starfield parallax, 3 patrones de
  enemigo, formaciones, Power Cores, medidor completo, Options, misiles,
  colisiones, score, vidas, game over, restart, jefe simple.
- Repo en GitHub + conexión a Cloudflare Pages.
- Registrar en Notion (Projects Registry) y en `PROJECTS_SUMMARY.md`.

# Hangar — progreso entre partidas

## Qué es

Los **items** son la moneda que sobrevive a la partida. No se gastan dentro
del stage (eso es el Power Core); se guardan y se cambian por mejoras
permanentes de la nave en el hangar, accesible desde la pantalla de título.

## De dónde salen

Por ahora, de una sola fuente: la **nave acosadora** (`behaviors/harasser.ts`).
Aparece dos veces por stage, no intenta matarte, y huye a los 9 segundos. Si
la destruyes antes, suelta un item.

Es a propósito que sea la única fuente: la decisión "¿la persigo y me expongo,
o la dejo ir?" es toda la gracia del sistema. Si los items cayeran de
cualquier enemigo, dejaría de ser una decisión.

## Cuándo se abonan

Los items recogidos viven en `state.itemsCollected` durante la partida y solo
se suman al total persistente **cuando la partida termina** (game over o
victoria). Ni antes ni por partes: morir no los regala a medias, y recogerlos
sigue teniendo sentido aunque la run vaya mal.

## Mejoras disponibles

| Mejora | Efecto | Costo | Máximo |
|---|---|---|---|
| CASCO REFORZADO | +1 vida al empezar | 3 items | 2 |
| MOTORES | +18% velocidad de base (un nivel de SPEED gratis) | 2 items | 2 |
| ESCUDO INICIAL | Empiezas con el escudo cargado | 4 items | 1 |

## Dónde vive el código, y por qué ahí

`src/meta/progress.ts`, **fuera de `src/game/`**. La regla del proyecto
(`LOGIC.md` §12) es que la simulación no toca DOM ni almacenamiento, porque
ese mismo código tiene que poder correr en un servidor Node el día del
multijugador. Así que:

- `meta/progress.ts` lee y escribe `localStorage`.
- `main.ts` traduce el progreso a campos del jugador (`aplicarMejoras()`) justo
  después de crear el mundo.
- `game/` no sabe que el hangar existe.

## ⚠️ El problema pendiente con el multijugador

Esto **no sirve tal cual** para el cooperativo online, y conviene tenerlo
escrito antes de que sorprenda:

1. `localStorage` lo edita cualquiera desde la consola del navegador. Hoy da
   igual (es un juego de un jugador contra el reloj), pero en una sesión
   compartida sería trampa directa.
2. Dos jugadores con mejoras distintas entran a la misma partida con naves
   desiguales. Hay que decidir a propósito si eso se permite (co-op asimétrico)
   o si se normaliza.

Cuando llegue el servidor autoritativo, el inventario y las mejoras tienen que
vivir **en el servidor** y validarse ahí; esta capa quedaría solo como caché
local. La forma de `Progress` está pensada para poder moverse tal cual a una
respuesta del servidor sin cambiar el resto.

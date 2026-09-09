import type { Enemy } from '../enemy';

/**
 * Obstáculo: no se puede destruir, solo esquivar.
 *
 * Es un enemigo normal con `indestructible`, porque la colisión cuerpo contra
 * jugador ya existía — no hacía falta un sistema de terreno para tener
 * obstáculos, que era la parte cara.
 *
 * `driftAmp` decide de qué tipo es:
 *  - 0  → obstáculo fijo que solo se desplaza con el nivel (una roca, una
 *         columna, un trozo de estructura).
 *  - >0 → obstáculo **móvil**: además sube y baja, así que hay que leer su
 *         trayectoria en vez de memorizar un hueco.
 */
export function hazard(e: Enemy, dt: number): void {
  e.t += dt;
  e.x += e.vx * dt;
  if (e.driftAmp > 0) {
    e.y = e.baseY + Math.sin(e.t * e.driftFreq) * e.driftAmp;
  }
}

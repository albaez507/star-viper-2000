import type { Enemy } from '../enemy';

const APPROACH_SPEED = 150;
const MATCH_SPEED = 175;

/**
 * Nave rival: el mini-jefe de mitad de stage.
 *
 * A diferencia del jefe (que se ancla y hace patrones de bala), la rival
 * **te persigue en vertical** — intenta ponerse a tu altura para dispararte
 * de frente. Se lee como "otra nave peleando contra ti", no como una
 * estructura. Nunca llega a alcanzarte del todo: es más lenta que tú, así
 * que puedes despegarte si te mueves.
 */
export function rival(e: Enemy, dt: number, playerX: number, playerY: number): void {
  e.t += dt;

  // Entra desde la derecha hasta su distancia de combate y ahí se queda.
  const dx = e.anchorX - e.x;
  if (Math.abs(dx) > 2) {
    e.x += Math.sign(dx) * Math.min(Math.abs(dx), APPROACH_SPEED * dt);
  }

  // Persigue la altura del jugador, pero más lento que él.
  const dy = playerY - e.y;
  if (Math.abs(dy) > 2) {
    e.y += Math.sign(dy) * Math.min(Math.abs(dy), MATCH_SPEED * dt);
  }

  void playerX;
}

import type { Enemy } from '../enemy';

const APPROACH_SPEED = 210;
const DIVE_SPEED = 265;

/**
 * Enjambre estilo Galaxian, pero horizontal.
 *
 * Tres etapas por miembro, sin necesidad de un controlador de grupo:
 *  1. Entra desde la derecha y se acomoda en su ranura de la rejilla.
 *  2. Aguanta la formación "respirando" alrededor de su ranura.
 *  3. Al cumplirse su `diveDelay` (escalonado en el spawner), fija un vector
 *     hacia donde está el jugador EN ESE INSTANTE y se lanza a estrellarse.
 *
 * El escalonado por miembro es lo que produce el efecto de "se van
 * descolgando de a uno" sin que haga falta un estado a nivel de enjambre —
 * cada enemigo sigue siendo autónomo, igual que el resto de patrones.
 */
export function swarm(e: Enemy, dt: number, playerX: number, playerY: number): void {
  e.t += dt;

  if (e.diving) {
    e.x += e.divingVx * dt;
    e.y += e.divingVy * dt;
    return;
  }

  if (e.t >= e.diveDelay) {
    const dx = playerX - e.x;
    const dy = playerY - e.y;
    const len = Math.hypot(dx, dy) || 1;
    e.divingVx = (dx / len) * DIVE_SPEED;
    e.divingVy = (dy / len) * DIVE_SPEED;
    e.diving = true;
    return;
  }

  const targetX = e.anchorX + Math.sin(e.t * 1.1) * 10;
  const targetY = e.anchorY + Math.cos(e.t * 0.9) * 8;
  const dx = targetX - e.x;
  const dy = targetY - e.y;
  const dist = Math.hypot(dx, dy);

  if (dist > 1) {
    const step = Math.min(dist, APPROACH_SPEED * dt);
    e.x += (dx / dist) * step;
    e.y += (dy / dist) * step;
  }
}

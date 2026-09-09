import type { Enemy } from '../enemy';

const APPROACH_SPEED = 190;
const WEAVE_AMPLITUDE = 110;
const WEAVE_FREQ = 1.5;
const FLEE_SPEED = 260;
const KEEP_AWAY = 220;

/**
 * Nave acosadora.
 *
 * No intenta matarte: nunca se lanza contra ti y hasta se aparta si te
 * acercas demasiado. Solo se queda molestando y disparando. Si no la matas
 * antes de que se le acabe el tiempo (`lifetime`), **huye por la derecha** y
 * te quedas sin el item.
 *
 * Toda la gracia está en la decisión que te obliga a tomar: perseguirla te
 * saca de posición y te expone al resto de la oleada, pero ignorarla te
 * cuesta el item. Es el OVNI rojo de Space Invaders.
 */
export function harasser(e: Enemy, dt: number, playerX: number, playerY: number): void {
  e.t += dt;

  if (e.t >= e.lifetime) {
    e.x += FLEE_SPEED * dt;
    return;
  }

  const targetY = e.anchorY + Math.sin(e.t * WEAVE_FREQ) * WEAVE_AMPLITUDE;

  // Si el jugador se le acerca, retrocede: no busca el choque.
  let targetX = e.anchorX;
  if (playerX > e.anchorX - KEEP_AWAY) {
    targetX = playerX + KEEP_AWAY;
  }

  const dx = targetX - e.x;
  const dy = targetY - e.y;
  const dist = Math.hypot(dx, dy);

  if (dist > 1) {
    const step = Math.min(dist, APPROACH_SPEED * dt);
    e.x += (dx / dist) * step;
    e.y += (dy / dist) * step;
  }

  void playerY;
}

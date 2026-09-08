import type { Enemy } from '../enemy';

const DIVE_SPEED = 160;

export function diver(e: Enemy, dt: number, playerX: number, playerY: number): void {
  if (!e.diving) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    if (e.x <= e.triggerX) {
      const dx = playerX - e.x;
      const dy = playerY - e.y;
      const len = Math.hypot(dx, dy) || 1;
      e.divingVx = (dx / len) * DIVE_SPEED;
      e.divingVy = (dy / len) * DIVE_SPEED;
      e.diving = true;
    }
  } else {
    e.x += e.divingVx * dt;
    e.y += e.divingVy * dt;
  }
}

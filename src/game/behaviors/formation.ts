import type { Enemy } from '../enemy';

export function formation(e: Enemy, dt: number): void {
  e.t += dt;
  e.x += e.vx * dt;
  e.y = e.baseY + Math.sin(e.t * 1.4) * 18;
}

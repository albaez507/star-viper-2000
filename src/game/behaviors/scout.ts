import type { Enemy } from '../enemy';

export function scout(e: Enemy, dt: number): void {
  e.x += e.vx * dt;
  e.y += e.vy * dt;
}

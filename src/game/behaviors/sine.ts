import type { Enemy } from '../enemy';

const AMPLITUDE = 46;
const FREQUENCY = 2.1;

export function sine(e: Enemy, dt: number): void {
  e.t += dt;
  e.x += e.vx * dt;
  e.y = e.baseY + Math.sin(e.t * FREQUENCY) * AMPLITUDE;
}

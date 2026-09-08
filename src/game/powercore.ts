export type PowerCore = {
  x: number; y: number;
  vx: number;
  active: boolean;
};

export function makePowerCore(): PowerCore {
  return { x: 0, y: 0, vx: -70, active: false };
}

export function spawnPowerCore(c: PowerCore, x: number, y: number): void {
  c.x = x; c.y = y; c.vx = -70; c.active = true;
}

export function stepPowerCore(c: PowerCore, dt: number): void {
  c.x += c.vx * dt;
}

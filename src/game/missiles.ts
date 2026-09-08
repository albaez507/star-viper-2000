export type Missile = {
  x: number; y: number;
  vx: number; vy: number;
  dmg: number;
  active: boolean;
};

export function makeMissile(): Missile {
  return { x: 0, y: 0, vx: 0, vy: 0, dmg: 4, active: false };
}

export function spawnMissile(m: Missile, x: number, y: number, vx: number): void {
  m.x = x; m.y = y; m.vx = vx; m.vy = 0; m.dmg = 4; m.active = true;
}

export function stepMissile(m: Missile, dt: number): void {
  m.x += m.vx * dt;
}

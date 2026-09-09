export type Bullet = {
  x: number; y: number;
  vx: number; vy: number;
  dmg: number;
  fromPlayer: boolean;
  pierce: boolean;
  big: boolean;
  /** Solo balas del jugador: corrige su rumbo hacia el enemigo más cercano. */
  homing: boolean;
  active: boolean;
};

export function makeBullet(): Bullet {
  return { x: 0, y: 0, vx: 0, vy: 0, dmg: 1, fromPlayer: true, pierce: false, big: false, homing: false, active: false };
}

export function spawnBullet(
  b: Bullet, x: number, y: number, vx: number, vy: number,
  dmg: number, fromPlayer: boolean, pierce = false, big = false, homing = false
): void {
  b.x = x; b.y = y; b.vx = vx; b.vy = vy; b.dmg = dmg;
  b.fromPlayer = fromPlayer; b.pierce = pierce; b.big = big; b.homing = homing; b.active = true;
}

export function stepBullet(b: Bullet, dt: number): void {
  b.x += b.vx * dt;
  b.y += b.vy * dt;
}

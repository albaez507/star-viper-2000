export type Bullet = {
  x: number; y: number;
  vx: number; vy: number;
  dmg: number;
  fromPlayer: boolean;
  pierce: boolean;
  active: boolean;
};

export function makeBullet(): Bullet {
  return { x: 0, y: 0, vx: 0, vy: 0, dmg: 1, fromPlayer: true, pierce: false, active: false };
}

export function spawnBullet(
  b: Bullet, x: number, y: number, vx: number, vy: number,
  dmg: number, fromPlayer: boolean, pierce = false
): void {
  b.x = x; b.y = y; b.vx = vx; b.vy = vy; b.dmg = dmg;
  b.fromPlayer = fromPlayer; b.pierce = pierce; b.active = true;
}

export function stepBullet(b: Bullet, dt: number): void {
  b.x += b.vx * dt;
  b.y += b.vy * dt;
}

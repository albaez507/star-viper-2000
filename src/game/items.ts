/**
 * Item suelto en el espacio. A diferencia del Power Core (que se gasta
 * dentro de la partida en el medidor), el item **sobrevive a la partida**:
 * es la moneda con la que se modifica la nave en el hangar.
 */
export type Item = {
  x: number; y: number;
  vx: number;
  t: number;
  active: boolean;
};

export const ITEM_MAGNET_RADIUS = 320;
const MAGNET_SPEED = 400;

export function makeItem(): Item {
  return { x: 0, y: 0, vx: -40, t: 0, active: false };
}

export function spawnItem(it: Item, x: number, y: number): void {
  it.x = Math.min(x, 520); it.y = y; it.vx = -40; it.t = 0; it.active = true;
}

/** Mismo magnetismo que el Power Core, y por la misma razón: un premio que
 * se gana pero no se cobra no es un premio. Ver `powercore.ts`. */
export function stepItem(it: Item, dt: number, playerX: number, playerY: number): void {
  it.t += dt;

  const dx = playerX - it.x;
  const dy = playerY - it.y;
  const dist = Math.hypot(dx, dy);

  if (dist < ITEM_MAGNET_RADIUS && dist > 0.001) {
    const pull = 1 - dist / ITEM_MAGNET_RADIUS;
    const speed = MAGNET_SPEED * (0.4 + 0.6 * pull);
    it.x += (dx / dist) * speed * dt;
    it.y += (dy / dist) * speed * dt;
  }

  it.x += it.vx * dt;
}

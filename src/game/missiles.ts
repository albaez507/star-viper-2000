export type Missile = {
  x: number; y: number;
  vx: number; vy: number;
  dmg: number;
  active: boolean;
};

/**
 * El misil es el ÚNICO proyectil que persigue en todo el juego.
 *
 * Antes perseguían las balas de LANCE, y eso apuntaba por ti: el juego se
 * volvía fácil porque la puntería dejaba de importar. Aquí no pasa lo mismo
 * porque el misil sale muy de vez en cuando -- perseguir es lo que lo hace
 * valer la espera, no un sustituto de apuntar.
 */
export const MISSILE_DMG = 24;

export function makeMissile(): Missile {
  return { x: 0, y: 0, vx: 0, vy: 0, dmg: MISSILE_DMG, active: false };
}

export function spawnMissile(m: Missile, x: number, y: number, vx: number): void {
  m.x = x; m.y = y; m.vx = vx; m.vy = 0; m.dmg = MISSILE_DMG; m.active = true;
}

export function stepMissile(m: Missile, dt: number): void {
  m.x += m.vx * dt;
  m.y += m.vy * dt;
}

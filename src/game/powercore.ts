export type PowerCore = {
  x: number; y: number;
  vx: number;
  active: boolean;
};

/** Radio dentro del cual el core empieza a irse solo hacia el jugador. */
export const CORE_MAGNET_RADIUS = 170;
const MAGNET_SPEED = 320;

export function makePowerCore(): PowerCore {
  return { x: 0, y: 0, vx: -70, active: false };
}

export function spawnPowerCore(c: PowerCore, x: number, y: number): void {
  c.x = x; c.y = y; c.vx = -70; c.active = true;
}

/**
 * El core deriva a la izquierda, pero si el jugador se acerca lo suficiente
 * se va hacia él con fuerza creciente.
 *
 * Sin esto el core era casi imposible de cobrar: aparecía a la derecha con
 * una Y fija y tardaba ~10s en cruzar, así que había que adivinar su altura
 * y quedarse ahí quieto mientras esquivabas. Medido con un jugador simulado:
 * 6 formaciones daban core y se recogían 0. El magnetismo mantiene el "ve a
 * buscarlo" pero perdona la precisión de píxel.
 */
export function stepPowerCore(c: PowerCore, dt: number, playerX: number, playerY: number): void {
  const dx = playerX - c.x;
  const dy = playerY - c.y;
  const dist = Math.hypot(dx, dy);

  if (dist < CORE_MAGNET_RADIUS && dist > 0.001) {
    // Cuanto más cerca, más fuerte tira — se siente como un imán, no como
    // un teletransporte.
    const pull = 1 - dist / CORE_MAGNET_RADIUS;
    const speed = MAGNET_SPEED * pull;
    c.x += (dx / dist) * speed * dt;
    c.y += (dy / dist) * speed * dt;
  }

  c.x += c.vx * dt;
}

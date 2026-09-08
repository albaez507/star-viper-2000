export type Boss = {
  x: number; y: number;
  hp: number;
  maxHp: number;
  phase: 1 | 2 | 3;
  entering: boolean;
  t: number;
  fireCooldown: number;
  hitFlash: number;
  halfW: number;
  halfH: number;
  active: boolean;
  dying: boolean;
  dyingTimer: number;
};

export function makeBoss(): Boss {
  return {
    x: 0, y: 0, hp: 90, maxHp: 90, phase: 1, entering: true, t: 0,
    fireCooldown: 1, hitFlash: 0, halfW: 64, halfH: 56, active: false,
    dying: false, dyingTimer: 0,
  };
}

export function spawnBoss(b: Boss, worldW: number, worldH: number): void {
  b.x = worldW + b.halfW + 20;
  b.y = worldH / 2;
  b.hp = b.maxHp;
  b.phase = 1;
  b.entering = true;
  b.t = 0;
  b.active = true;
  b.dying = false;
  b.dyingTimer = 0;
}

export function updateBossPhase(b: Boss): void {
  const ratio = b.hp / b.maxHp;
  if (ratio <= 0.3) b.phase = 3;
  else if (ratio <= 0.6) b.phase = 2;
  else b.phase = 1;
}

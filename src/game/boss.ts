export type BossIntroPhase = 'none' | 'hold' | 'warp' | 'reveal';

export const BOSS_ANCHOR_MARGIN = 220;
export const BASE_HALF_W = 128;
export const BASE_HALF_H = 112;

const INTRO_HOLD = 0.5;
const INTRO_WARP = 1.4;

export type Boss = {
  x: number; y: number;
  hp: number;
  maxHp: number;
  phase: 1 | 2 | 3;
  t: number;
  fireCooldown: number;
  hitFlash: number;
  halfW: number;
  halfH: number;
  active: boolean;
  dying: boolean;
  dyingTimer: number;
  revealed: boolean;
  introPhase: BossIntroPhase;
  introTimer: number;
};

export function makeBoss(): Boss {
  return {
    x: 0, y: 0, hp: 90, maxHp: 90, phase: 1, t: 0,
    fireCooldown: 1, hitFlash: 0, halfW: BASE_HALF_W, halfH: BASE_HALF_H, active: false,
    dying: false, dyingTimer: 0,
    revealed: false, introPhase: 'none', introTimer: 0,
  };
}

export function spawnBoss(b: Boss, worldW: number, worldH: number): void {
  b.x = worldW - BOSS_ANCHOR_MARGIN;
  b.y = worldH / 2;
  b.hp = b.maxHp;
  b.phase = 1;
  b.halfW = BASE_HALF_W;
  b.halfH = BASE_HALF_H;
  b.t = 0;
  b.active = true;
  b.dying = false;
  b.dyingTimer = 0;
  b.revealed = false;
  b.introPhase = 'hold';
  b.introTimer = INTRO_HOLD;
}

export function updateBossIntro(b: Boss, dt: number): void {
  if (b.revealed) return;

  b.introTimer -= dt;
  if (b.introTimer > 0) return;

  if (b.introPhase === 'hold') {
    b.introPhase = 'warp';
    b.introTimer = INTRO_WARP;
  } else if (b.introPhase === 'warp') {
    b.introPhase = 'reveal';
    b.introTimer = 0;
    b.revealed = true;
  }
}

export function bossWarpMultiplier(b: Boss): number {
  if (!b.active || b.revealed) return 1;
  if (b.introPhase === 'hold') return 0;
  if (b.introPhase === 'warp') return 6;
  return 1;
}

export function updateBossPhase(b: Boss): void {
  const ratio = b.hp / b.maxHp;
  if (ratio <= 0.3) {
    b.phase = 3;
    b.halfW = BASE_HALF_W * 1.18;
    b.halfH = BASE_HALF_H * 1.18;
  } else if (ratio <= 0.6) {
    b.phase = 2;
    b.halfW = BASE_HALF_W * 1.08;
    b.halfH = BASE_HALF_H * 1.08;
  } else {
    b.phase = 1;
    b.halfW = BASE_HALF_W;
    b.halfH = BASE_HALF_H;
  }
}

export type BossIntroPhase = 'none' | 'hold' | 'warp' | 'reveal';

export const BOSS_ANCHOR_MARGIN = 220;
export const BASE_HALF_W = 128;
export const BASE_HALF_H = 112;

const INTRO_HOLD = 0.5;
const INTRO_WARP = 1.4;

const PHASE_HP = [30, 35, 40];
const PHASE_SCALE = [1, 1.08, 1.18];

export type Boss = {
  x: number; y: number;
  phase: 1 | 2 | 3;
  phaseHp: number;
  phaseMaxHp: number;
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
  enrageFlash: number;
};

export function makeBoss(): Boss {
  return {
    x: 0, y: 0, phase: 1, phaseHp: PHASE_HP[0], phaseMaxHp: PHASE_HP[0], t: 0,
    fireCooldown: 1, hitFlash: 0, halfW: BASE_HALF_W, halfH: BASE_HALF_H, active: false,
    dying: false, dyingTimer: 0,
    revealed: false, introPhase: 'none', introTimer: 0,
    enrageFlash: 0,
  };
}

/**
 * Antes el cambio de fase saltaba en un solo frame: color, tamaño y cadencia
 * cambiaban de golpe y se sentía brusco. Ahora el tamaño se interpola hacia
 * el de la fase nueva mientras dura `enrageFlash`, así el jefe **crece** en
 * lugar de teletransportarse a su tamaño nuevo.
 */
function targetSizeForPhase(b: Boss): { w: number; h: number } {
  const scale = PHASE_SCALE[b.phase - 1];
  return { w: BASE_HALF_W * scale, h: BASE_HALF_H * scale };
}

function resizeForPhase(b: Boss): void {
  const { w, h } = targetSizeForPhase(b);
  b.halfW = w;
  b.halfH = h;
}

/** Acerca el tamaño actual al de la fase, un poco por frame. */
export function easeBossSize(b: Boss, dt: number): void {
  const { w, h } = targetSizeForPhase(b);
  const k = Math.min(1, dt * 4);
  b.halfW += (w - b.halfW) * k;
  b.halfH += (h - b.halfH) * k;
}

export function spawnBoss(b: Boss, worldW: number, worldH: number): void {
  b.x = worldW - BOSS_ANCHOR_MARGIN;
  b.y = worldH / 2;
  b.phase = 1;
  b.phaseMaxHp = PHASE_HP[0];
  b.phaseHp = PHASE_HP[0];
  resizeForPhase(b);
  b.t = 0;
  b.active = true;
  b.dying = false;
  b.dyingTimer = 0;
  b.revealed = false;
  b.introPhase = 'hold';
  b.introTimer = INTRO_HOLD;
  b.enrageFlash = 0;
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

/**
 * Solo congela el fondo durante la pausa previa. **No acelera**: la animación
 * de "viajar rápido hacia el jefe" se quitó a petición del usuario — lo que
 * funciona de esa secuencia es el 警告 y el silencio, no el zoom.
 */
export function bossWarpMultiplier(b: Boss): number {
  if (!b.active || b.revealed) return 1;
  if (b.introPhase === 'hold') return 0;
  return 1;
}

export type DamageResult = 'hit' | 'enraged' | 'dead';

/** Applies damage to the boss's current phase bar. Returns what happened so
 * the caller can trigger the right events (hit flash / enrage burst / death). */
export function damageBoss(b: Boss, dmg: number): DamageResult {
  b.phaseHp -= dmg;
  if (b.phaseHp > 0) return 'hit';

  if (b.phase < 3) {
    b.phase = (b.phase + 1) as 1 | 2 | 3;
    b.phaseMaxHp = PHASE_HP[b.phase - 1];
    b.phaseHp = b.phaseMaxHp;
    // Sin `resizeForPhase` aquí: el tamaño lo alcanza `easeBossSize` a lo
    // largo del destello, para que se vea crecer.
    b.enrageFlash = 0.9;
    return 'enraged';
  }

  return 'dead';
}

export function bossMovementFrequency(b: Boss): number {
  return 1 + (b.phase - 1) * 0.3;
}

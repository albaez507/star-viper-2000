export type BossIntroPhase = 'none' | 'hold' | 'warp' | 'reveal';

export const BOSS_ANCHOR_MARGIN = 220;
export const BASE_HALF_W = 128;
export const BASE_HALF_H = 112;

const INTRO_HOLD = 0.5;
const INTRO_WARP = 1.4;

/**
 * Subida grande y deliberada. Con 30/35/40 un solo misil (24 de daño) se
 * llevaba casi una fase entera, así que la pelea terminaba antes de que
 * llegaras a ver un patrón. Con ventanas de verdad hay que aguantar lo
 * suficiente para aprenderlos.
 */
const PHASE_HP = [120, 150, 180];
const PHASE_SCALE = [1, 1.08, 1.18];

export type BossAttack = 'fan' | 'sweep' | 'charge' | 'wall';
export type AttackStage = 'telegraph' | 'execute' | 'recover';

/**
 * Qué ataques tiene cada fase.
 *
 * El jefe no era predecible: es que **no tenía patrones**. Se movía con una
 * suma de tres senos -- ruido suave, igual en el segundo 3 que en el 40, o
 * sea imposible de aprender -- y tenía un único ataque del que entre fases
 * solo cambiaba la cadencia.
 *
 * Un patrón es algo que se puede aprender, y para eso hace falta que sea
 * DISCRETO: empieza, pasa, termina.
 */
const ROTACION: Record<1 | 2 | 3, BossAttack[]> = {
  1: ['fan', 'sweep'],
  2: ['fan', 'charge', 'sweep'],
  3: ['wall', 'charge', 'fan', 'sweep'],
};

/** Aviso antes de cada ataque. Sin esto el ataque es injusto, no difícil. */
const TELEGRAPH = 0.7;

const EJECUCION: Record<BossAttack, number> = { fan: 0.95, sweep: 1.7, charge: 1.0, wall: 0.7 };

/**
 * Recuperación: se queda quieto y recibe el doble de daño. **Es el tiempo
 * que convierte esto en una pelea.** Antes disparaba sin parar, así que
 * atacarle era cuestión de aguantar, no de elegir el momento.
 */
const RECUPERACION = [1.15, 0.95, 0.75];
export const RECOVER_DAMAGE_MULT = 2;

export type Boss = {
  attack: BossAttack;
  stage: AttackStage;
  stageTimer: number;
  attackIndex: number;
  /** Lo pone la máquina de estados y lo consume el mundo al disparar. */
  volleyPending: boolean;
  volleyTimer: number;
  /** Dónde estaba al empezar la embestida, para volver luego. */
  homeX: number;
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
    attack: 'fan', stage: 'telegraph', stageTimer: TELEGRAPH, attackIndex: 0,
    volleyPending: false, volleyTimer: 0, homeX: 0,
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

/** Cuánto dura la etapa actual, según ataque y fase. */
function duracionEtapa(b: Boss): number {
  if (b.stage === 'telegraph') return TELEGRAPH;
  if (b.stage === 'execute') return EJECUCION[b.attack];
  return RECUPERACION[b.phase - 1];
}

/**
 * Avanza la máquina de estados y coloca al jefe.
 *
 * Cada ataque son tres tiempos: **aviso** (se coloca y se hincha, te dice qué
 * viene), **ejecución** (difícil, pero con hueco porque lo telegrafió) y
 * **recuperación** (quieto, y recibe el doble de daño).
 *
 * El movimiento ya no es ruido continuo: cada etapa lo coloca donde el ataque
 * necesita, así que la posición del jefe *significa* algo.
 */
export function updateBossAttack(b: Boss, dt: number, worldW: number, worldH: number, playerY: number): void {
  b.stageTimer -= dt;

  if (b.stageTimer <= 0) {
    if (b.stage === 'telegraph') {
      b.stage = 'execute';
      b.volleyTimer = 0;
    } else if (b.stage === 'execute') {
      b.stage = 'recover';
    } else {
      // Siguiente ataque de la rotación de esta fase.
      const lista = ROTACION[b.phase];
      b.attackIndex = (b.attackIndex + 1) % lista.length;
      b.attack = lista[b.attackIndex];
      b.stage = 'telegraph';
      b.homeX = worldW - BOSS_ANCHOR_MARGIN;
    }
    b.stageTimer = duracionEtapa(b);
  }

  const anchorX = worldW - BOSS_ANCHOR_MARGIN;
  const avance = 1 - b.stageTimer / Math.max(0.0001, duracionEtapa(b));

  if (b.stage === 'telegraph') {
    // Se coloca donde el ataque lo necesita. Verlo subir ES el aviso.
    const destinoY = b.attack === 'sweep' ? b.halfH + 20
      : b.attack === 'charge' ? playerY
      : worldH / 2;
    b.y += (destinoY - b.y) * Math.min(1, dt * 4);
    b.x += (anchorX - b.x) * Math.min(1, dt * 4);
    return;
  }

  if (b.stage === 'execute') {
    if (b.attack === 'sweep') {
      // Baja de arriba abajo disparando: hay que cruzar por detrás.
      b.y = b.halfH + 20 + (worldH - b.halfH * 2 - 40) * avance;
      b.volleyTimer -= dt;
      if (b.volleyTimer <= 0) { b.volleyPending = true; b.volleyTimer = 0.13; }
    } else if (b.attack === 'charge') {
      // Cruza la pantalla. Se esquiva EN VERTICAL: es donde el dash importa.
      b.x = anchorX - (anchorX - b.halfW - 30) * Math.sin(avance * Math.PI);
    } else if (b.attack === 'fan') {
      // Tres ráfagas con hueco entre ellas, no un chorro continuo.
      b.volleyTimer -= dt;
      if (b.volleyTimer <= 0) { b.volleyPending = true; b.volleyTimer = 0.3; }
    } else {
      // wall: una sola pared densa, al principio de la ejecución.
      if (avance < 0.15 && b.volleyTimer <= 0) { b.volleyPending = true; b.volleyTimer = 99; }
    }
    return;
  }

  // Recuperación: quieto y vulnerable. Aquí es donde le pegas.
  b.volleyTimer = 0;
  b.x += (anchorX - b.x) * Math.min(1, dt * 3);
}

/** Multiplicador de daño según la etapa: el doble mientras se recupera. */
export function bossDamageMultiplier(b: Boss): number {
  return b.stage === 'recover' ? RECOVER_DAMAGE_MULT : 1;
}

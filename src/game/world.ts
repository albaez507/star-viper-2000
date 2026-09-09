import type { InputFrame } from '../core/types';
import { Pool } from '../core/pool';
import { Rng } from '../core/rng';
import { EventBus } from '../core/events';
import { hits } from './collision';
import { dist } from '../core/math';

import { createPlayer, movePlayer, type Player, fireCooldownFor, missileCooldownFor, INVULN_TIME, PLAYER_HALF_W, PLAYER_HALF_H } from './player';
import { PositionHistory } from './history';
import { createOptions, updateOptions, type Option } from './options';
import { makeEnemy, type Enemy } from './enemy';
import { behaviors } from './behaviors/index';
import { type Formation, registerKill, registerEscape } from './formations';
import { makeBullet, spawnBullet, stepBullet, type Bullet } from './bullets';
import { makeMissile, spawnMissile, stepMissile, type Missile } from './missiles';
import { makePowerCore, spawnPowerCore, stepPowerCore, type PowerCore } from './powercore';
import { createPowerMeter, advanceCursor, activateSlot, type PowerMeter } from './powermeter';
import { makeBoss, updateBossIntro, damageBoss, bossMovementFrequency, BOSS_ANCHOR_MARGIN, type Boss } from './boss';
import { updateSpawner } from './spawner';

export type GameState = {
  worldW: number;
  worldH: number;

  player: Player;
  history: PositionHistory;
  options: Option[];
  powerMeter: PowerMeter;

  enemies: Pool<Enemy>;
  formations: Map<number, Formation>;

  playerBullets: Pool<Bullet>;
  enemyBullets: Pool<Bullet>;
  missiles: Pool<Missile>;
  powerCores: Pool<PowerCore>;

  boss: Boss;

  score: number;
  stageTime: number;
  spawnIndex: number;
  nextEnemyId: number;
  nextFormationId: number;
  rng: Rng;

  gameOver: boolean;
  victory: boolean;

  events: EventBus;
};

export function createWorld(worldW: number, worldH: number, seed = 1337): GameState {
  return {
    worldW, worldH,
    player: createPlayer(90, worldH / 2),
    history: new PositionHistory(),
    options: createOptions(),
    powerMeter: createPowerMeter(),
    enemies: new Pool(makeEnemy, 48),
    formations: new Map(),
    playerBullets: new Pool(makeBullet, 64),
    enemyBullets: new Pool(makeBullet, 32),
    missiles: new Pool(makeMissile, 8),
    powerCores: new Pool(makePowerCore, 4),
    boss: makeBoss(),
    score: 0,
    stageTime: 0,
    spawnIndex: 0,
    nextEnemyId: 1,
    nextFormationId: 1,
    rng: new Rng(seed),
    gameOver: false,
    victory: false,
    events: new EventBus(),
  };
}

const PLAYER_BULLET_SPEED = 560;
const ENEMY_BULLET_SPEED = 220;
const MISSILE_SPEED = 340;
const PLAYER_BULLET_HIT_HALF = 5;

export function step(state: GameState, input: InputFrame, dt: number): void {
  if (state.gameOver || state.victory) return;

  if (state.boss.active && !state.boss.revealed) {
    updateBossIntro(state.boss, dt);
    return;
  }

  state.stageTime += dt;
  updateSpawner(state);

  stepPlayer(state, input, dt);
  stepFiring(state, input, dt);
  stepEnemies(state, dt);
  stepProjectiles(state, dt);
  stepBoss(state, dt);
  stepCollisions(state);
  stepPowerCores(state, dt);

  if (state.player.lives <= 0) {
    state.gameOver = true;
    state.events.emit({ type: 'playerDeath' });
  }
}

function stepPlayer(state: GameState, input: InputFrame, dt: number): void {
  const p = state.player;
  if (p.hitFlash > 0) p.hitFlash = Math.max(0, p.hitFlash - dt);
  if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);

  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  movePlayer(p, dx, dy, dt, { w: state.worldW, h: state.worldH });

  state.history.push(p.x, p.y);
  updateOptions(state.options, p.optionCount, state.history);

  if (p.fireCooldown > 0) p.fireCooldown -= dt;
  if (p.missileCooldown > 0) p.missileCooldown -= dt;

  if (input.power) {
    const ok = activateSlot(state.powerMeter, p);
    state.events.emit(ok ? { type: 'powerActivate', slot: 0 } : { type: 'coreDenied' });
  }
}

function fireFrom(state: GameState, x: number, y: number, weapon: 'single' | 'double' | 'laser'): void {
  if (weapon === 'double') {
    const b1 = state.playerBullets.acquire();
    spawnBullet(b1, x + 10, y - 6, PLAYER_BULLET_SPEED, 0, 1, true);
    const b2 = state.playerBullets.acquire();
    spawnBullet(b2, x + 10, y + 6, PLAYER_BULLET_SPEED, 0, 1, true);
    return;
  }

  if (weapon === 'laser') {
    const b = state.playerBullets.acquire();
    spawnBullet(b, x + 10, y, PLAYER_BULLET_SPEED * 1.15, 0, 2, true, true);
    return;
  }

  const b = state.playerBullets.acquire();
  spawnBullet(b, x + 10, y, PLAYER_BULLET_SPEED, 0, 1, true);
}

function stepFiring(state: GameState, input: InputFrame, dt: number): void {
  void dt;
  const p = state.player;
  if (!p.alive) return;

  if (input.fire && p.fireCooldown <= 0) {
    fireFrom(state, p.x, p.y, p.weapon);
    for (const opt of state.options) {
      if (opt.active) fireFrom(state, opt.x, opt.y, 'single');
    }
    p.fireCooldown = fireCooldownFor(p.weapon);
    state.events.emit({ type: 'fire', weapon: p.weapon });
  }

  if (input.missile) {
    const inFlight = state.missiles.active();
    if (inFlight.length > 0) {
      for (const m of inFlight) {
        m.active = false;
        explodeMissile(state, m.x, m.y, m.dmg);
      }
    } else if (p.missileCooldown <= 0) {
      const m = state.missiles.acquire();
      spawnMissile(m, p.x + 6, p.y, MISSILE_SPEED);
      p.missileCooldown = missileCooldownFor(p);
      state.events.emit({ type: 'missileFire' });
    }
  }
}

const ENEMY_FIRE_MIN = 1.6;
const ENEMY_FIRE_MAX = 3.4;

/** Un enemigo solo dispara mientras está dentro de pantalla y no pegado al
 * borde izquierdo — si no, aparecen balas "de la nada" fuera de cuadro. */
function tryEnemyFire(state: GameState, e: Enemy, dt: number): void {
  if (!e.canShoot) return;

  e.fireCooldown -= dt;
  if (e.fireCooldown > 0) return;

  const onScreen = e.x < state.worldW - 10 && e.x > 60;
  if (!onScreen) return;

  const b = state.enemyBullets.acquire();

  if (e.behavior === 'diver' && !e.diving) {
    // El diver apunta: su disparo telegrafía que va a lanzarse.
    const dx = state.player.x - e.x;
    const dy = state.player.y - e.y;
    const len = Math.hypot(dx, dy) || 1;
    spawnBullet(b, e.x - e.halfW, e.y, (dx / len) * ENEMY_BULLET_SPEED, (dy / len) * ENEMY_BULLET_SPEED, 1, false);
  } else {
    spawnBullet(b, e.x - e.halfW, e.y, -ENEMY_BULLET_SPEED, 0, 1, false);
  }

  e.fireCooldown = state.rng.range(ENEMY_FIRE_MIN, ENEMY_FIRE_MAX);
}

function stepEnemies(state: GameState, dt: number): void {
  const ctx = { playerX: state.player.x, playerY: state.player.y };

  for (const e of state.enemies.active()) {
    if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);

    const behavior = behaviors[e.behavior];
    behavior(e, dt, ctx);
    tryEnemyFire(state, e, dt);

    if (e.x < -40) {
      if (e.formationId >= 0) {
        const f = state.formations.get(e.formationId);
        if (f) registerEscape(f);
      }
      e.active = false;
    } else if (e.y < -60 || e.y > state.worldH + 60) {
      // Un miembro del enjambre que se lanzó en diagonal puede salir por
      // arriba o por abajo en vez de por la izquierda.
      e.active = false;
    }
  }
}

function stepProjectiles(state: GameState, dt: number): void {
  for (const b of state.playerBullets.active()) {
    stepBullet(b, dt);
    if (b.x > state.worldW + 30 || b.y < -30 || b.y > state.worldH + 30) b.active = false;
  }
  for (const b of state.enemyBullets.active()) {
    stepBullet(b, dt);
    if (b.x < -30 || b.x > state.worldW + 30 || b.y < -30 || b.y > state.worldH + 30) {
      b.active = false;
    }
  }
  for (const m of state.missiles.active()) {
    stepMissile(m, dt);
    if (m.x > state.worldW + 30) m.active = false;
  }
}

function stepPowerCores(state: GameState, dt: number): void {
  for (const c of state.powerCores.active()) {
    stepPowerCore(c, dt, state.player.x, state.player.y);
    if (c.x < -30) c.active = false;
  }
}

function damagePlayer(state: GameState): void {
  const p = state.player;
  if (p.invulnTimer > 0) return;

  if (p.shield > 0) {
    p.shield--;
  } else {
    p.lives--;
  }
  p.hitFlash = 0.25;
  p.invulnTimer = INVULN_TIME;
  state.events.emit({ type: 'playerDamage' });
  state.events.emit({ type: 'shake', strength: 7, duration: 0.25 });
}

function applyBossDamage(state: GameState, dmg: number, x: number, y: number): void {
  const boss = state.boss;
  const result = damageBoss(boss, dmg);

  if (result === 'hit') {
    boss.hitFlash = 0.1;
  } else if (result === 'enraged') {
    state.events.emit({ type: 'bossEnrage', x, y });
    state.events.emit({ type: 'shake', strength: 10, duration: 0.4 });
  } else if (result === 'dead') {
    boss.dying = true;
    boss.dyingTimer = 1.2;
    state.events.emit({ type: 'bossDeath', x, y });
    state.events.emit({ type: 'shake', strength: 14, duration: 0.6 });
  }
}

const MISSILE_SPLASH_RADIUS = 46;

function explodeMissile(state: GameState, x: number, y: number, dmg: number): void {
  for (const e of state.enemies.active()) {
    if (dist(x, y, e.x, e.y) <= MISSILE_SPLASH_RADIUS + Math.max(e.halfW, e.halfH)) {
      e.hp -= dmg;
      e.hitFlash = 0.12;
      if (e.hp <= 0) killEnemy(state, e);
    }
  }

  if (state.boss.active && state.boss.revealed && !state.boss.dying && dist(x, y, state.boss.x, state.boss.y) <= MISSILE_SPLASH_RADIUS + state.boss.halfW) {
    applyBossDamage(state, dmg, state.boss.x, state.boss.y);
  }

  state.events.emit({ type: 'missileImpact', x, y });
  state.events.emit({ type: 'shake', strength: 5, duration: 0.2 });
}

function killEnemy(state: GameState, e: Enemy): void {
  state.score += e.score;
  state.events.emit({ type: 'enemyDeath', x: e.x, y: e.y });

  if (e.formationId >= 0) {
    const f = state.formations.get(e.formationId);
    if (f) {
      const earned = registerKill(f, e.x, e.y);
      if (earned && !f.rewarded) {
        f.rewarded = true;
        const core = state.powerCores.acquire();
        spawnPowerCore(core, e.x, e.y);
      }
    }
  }

  e.active = false;
}

function stepCollisions(state: GameState): void {
  const p = state.player;

  for (const b of state.playerBullets.active()) {
    if (!b.active) continue;
    for (const e of state.enemies.active()) {
      if (hits(b.x, b.y, PLAYER_BULLET_HIT_HALF, PLAYER_BULLET_HIT_HALF, e.x, e.y, e.halfW, e.halfH)) {
        e.hp -= b.dmg;
        e.hitFlash = 0.12;
        state.events.emit({ type: 'hit', x: b.x, y: b.y });
        if (!b.pierce) b.active = false;
        if (e.hp <= 0) killEnemy(state, e);
        if (!b.pierce) break;
      }
    }
    if (b.active && state.boss.active && state.boss.revealed && !state.boss.dying) {
      const boss = state.boss;
      if (hits(b.x, b.y, PLAYER_BULLET_HIT_HALF, PLAYER_BULLET_HIT_HALF, boss.x, boss.y, boss.halfW, boss.halfH)) {
        applyBossDamage(state, b.dmg, boss.x, boss.y);
        state.events.emit({ type: 'hit', x: b.x, y: b.y });
        if (!b.pierce) b.active = false;
      }
    }
  }

  for (const m of state.missiles.active()) {
    let impactX = m.x;
    let impactY = m.y;
    let exploded = false;

    for (const e of state.enemies.active()) {
      if (hits(m.x, m.y, 4, 4, e.x, e.y, e.halfW, e.halfH)) {
        impactX = e.x;
        impactY = e.y;
        exploded = true;
        break;
      }
    }
    if (!exploded && state.boss.active && !state.boss.dying) {
      const boss = state.boss;
      if (hits(m.x, m.y, 4, 4, boss.x, boss.y, boss.halfW, boss.halfH)) {
        impactX = boss.x;
        impactY = boss.y;
        exploded = true;
      }
    }

    if (exploded) {
      m.active = false;
      explodeMissile(state, impactX, impactY, m.dmg);
    }
  }

  for (const b of state.enemyBullets.active()) {
    const bulletHalf = b.big ? 8 : 2;
    if (hits(b.x, b.y, bulletHalf, bulletHalf, p.x, p.y, PLAYER_HALF_W, PLAYER_HALF_H)) {
      b.active = false;
      damagePlayer(state);
    }
  }

  for (const e of state.enemies.active()) {
    if (hits(e.x, e.y, e.halfW, e.halfH, p.x, p.y, PLAYER_HALF_W, PLAYER_HALF_H)) {
      damagePlayer(state);
      e.active = false;
    }
  }

  if (state.boss.active && !state.boss.dying) {
    const boss = state.boss;
    if (hits(boss.x, boss.y, boss.halfW, boss.halfH, p.x, p.y, PLAYER_HALF_W, PLAYER_HALF_H)) {
      damagePlayer(state);
    }
  }

  for (const c of state.powerCores.active()) {
    if (hits(c.x, c.y, 10, 10, p.x, p.y, PLAYER_HALF_W + 8, PLAYER_HALF_H + 8)) {
      c.active = false;
      advanceCursor(state.powerMeter);
      state.events.emit({ type: 'coreCollected', slot: state.powerMeter.cursor });
    }
  }
}

function stepBoss(state: GameState, dt: number): void {
  const boss = state.boss;
  if (!boss.active || !boss.revealed) return;

  boss.t += dt;
  if (boss.hitFlash > 0) boss.hitFlash = Math.max(0, boss.hitFlash - dt);

  if (boss.dying) {
    boss.dyingTimer -= dt;
    if (boss.dyingTimer <= 0) {
      boss.active = false;
      state.victory = true;
    }
    return;
  }

  if (boss.enrageFlash > 0) boss.enrageFlash = Math.max(0, boss.enrageFlash - dt);

  const freq = bossMovementFrequency(boss);
  const anchorX = state.worldW - BOSS_ANCHOR_MARGIN;
  boss.x = anchorX + Math.sin(boss.t * 0.6 * freq) * 30;
  boss.y = state.worldH / 2
    + Math.sin(boss.t * 1.3 * freq) * 70
    + Math.sin(boss.t * 0.47 * freq) * 40
    + Math.cos(boss.t * 2.1 * freq) * 15;

  boss.fireCooldown -= dt;
  if (boss.fireCooldown <= 0) {
    fireBossPattern(state, boss);
    boss.fireCooldown = boss.phase === 3 ? 0.5 : boss.phase === 2 ? 0.75 : 1.1;
  }
}

function fireBossPattern(state: GameState, boss: Boss): void {
  const shots = boss.phase === 3 ? 5 : boss.phase === 2 ? 3 : 1;
  const spread = 0.5;
  for (let i = 0; i < shots; i++) {
    const angle = shots === 1 ? Math.PI : Math.PI - spread / 2 + (spread * i) / Math.max(1, shots - 1);
    const b = state.enemyBullets.acquire();
    spawnBullet(
      b,
      boss.x - boss.halfW,
      boss.y,
      Math.cos(angle) * ENEMY_BULLET_SPEED,
      Math.sin(angle) * ENEMY_BULLET_SPEED * 0.6,
      1,
      false,
      false,
      true
    );
  }
}

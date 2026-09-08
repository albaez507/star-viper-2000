import type { InputFrame } from '../core/types';
import { Pool } from '../core/pool';
import { Rng } from '../core/rng';
import { EventBus } from '../core/events';
import { hits } from './collision';
import { dist } from '../core/math';

import { createPlayer, movePlayer, type Player, FIRE_COOLDOWN, missileCooldownFor, INVULN_TIME, PLAYER_HALF_W, PLAYER_HALF_H } from './player';
import { PositionHistory } from './history';
import { createOptions, updateOptions, type Option } from './options';
import { makeEnemy, type Enemy } from './enemy';
import { behaviors } from './behaviors/index';
import { type Formation, registerKill, registerEscape } from './formations';
import { makeBullet, spawnBullet, stepBullet, type Bullet } from './bullets';
import { makeMissile, spawnMissile, stepMissile, type Missile } from './missiles';
import { makePowerCore, spawnPowerCore, stepPowerCore, type PowerCore } from './powercore';
import { createPowerMeter, advanceCursor, activateSlot, type PowerMeter } from './powermeter';
import { makeBoss, updateBossPhase, type Boss } from './boss';
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

export function step(state: GameState, input: InputFrame, dt: number): void {
  if (state.gameOver || state.victory) return;

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
  const b1 = state.playerBullets.acquire();
  spawnBullet(b1, x + 10, y, PLAYER_BULLET_SPEED, 0, 1, true, weapon === 'laser');

  if (weapon === 'double') {
    const b2 = state.playerBullets.acquire();
    spawnBullet(b2, x + 6, y - 4, PLAYER_BULLET_SPEED * 0.98, -90, 1, true);
  }
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
    p.fireCooldown = FIRE_COOLDOWN;
    state.events.emit({ type: 'fire', weapon: p.weapon });
  }

  if (input.missile && p.missileCooldown <= 0) {
    const m = state.missiles.acquire();
    spawnMissile(m, p.x + 6, p.y, MISSILE_SPEED);
    p.missileCooldown = missileCooldownFor(p);
    state.events.emit({ type: 'missileFire' });
  }
}

function stepEnemies(state: GameState, dt: number): void {
  const ctx = { playerX: state.player.x, playerY: state.player.y };

  for (const e of state.enemies.active()) {
    if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);

    const behavior = behaviors[e.behavior];
    behavior(e, dt, ctx);

    if (e.x < -40) {
      if (e.formationId >= 0) {
        const f = state.formations.get(e.formationId);
        if (f) registerEscape(f);
      }
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
    if (b.x < -30) b.active = false;
  }
  for (const m of state.missiles.active()) {
    stepMissile(m, dt);
    if (m.x > state.worldW + 30) m.active = false;
  }
}

function stepPowerCores(state: GameState, dt: number): void {
  for (const c of state.powerCores.active()) {
    stepPowerCore(c, dt);
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

const MISSILE_SPLASH_RADIUS = 46;

function explodeMissile(state: GameState, x: number, y: number, dmg: number): void {
  for (const e of state.enemies.active()) {
    if (dist(x, y, e.x, e.y) <= MISSILE_SPLASH_RADIUS + Math.max(e.halfW, e.halfH)) {
      e.hp -= dmg;
      e.hitFlash = 0.12;
      if (e.hp <= 0) killEnemy(state, e);
    }
  }

  if (state.boss.active && !state.boss.dying && dist(x, y, state.boss.x, state.boss.y) <= MISSILE_SPLASH_RADIUS + state.boss.halfW) {
    state.boss.hp -= dmg;
    state.boss.hitFlash = 0.15;
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
      if (hits(b.x, b.y, 2, 2, e.x, e.y, e.halfW, e.halfH)) {
        e.hp -= b.dmg;
        e.hitFlash = 0.12;
        state.events.emit({ type: 'hit', x: b.x, y: b.y });
        if (!b.pierce) b.active = false;
        if (e.hp <= 0) killEnemy(state, e);
        if (!b.pierce) break;
      }
    }
    if (b.active && state.boss.active && !state.boss.dying) {
      const boss = state.boss;
      if (hits(b.x, b.y, 2, 2, boss.x, boss.y, boss.halfW, boss.halfH)) {
        boss.hp -= b.dmg;
        boss.hitFlash = 0.1;
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
    if (hits(b.x, b.y, 2, 2, p.x, p.y, PLAYER_HALF_W, PLAYER_HALF_H)) {
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
    if (hits(c.x, c.y, 6, 6, p.x, p.y, PLAYER_HALF_W + 6, PLAYER_HALF_H + 6)) {
      c.active = false;
      advanceCursor(state.powerMeter);
      state.events.emit({ type: 'coreCollected', slot: state.powerMeter.cursor });
    }
  }
}

const BOSS_ANCHOR_MARGIN = 170;

function stepBoss(state: GameState, dt: number): void {
  const boss = state.boss;
  if (!boss.active) return;

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

  if (boss.entering) {
    const targetX = state.worldW - BOSS_ANCHOR_MARGIN;
    boss.x += (targetX - boss.x) * Math.min(1, dt * 1.4);
    if (Math.abs(boss.x - targetX) < 1.5) boss.entering = false;
  } else {
    boss.y = state.worldH / 2 + Math.sin(boss.t * 0.8) * 90;
  }

  updateBossPhase(boss);

  if (boss.hp <= 0) {
    boss.dying = true;
    boss.dyingTimer = 1.2;
    state.events.emit({ type: 'bossDeath', x: boss.x, y: boss.y });
    state.events.emit({ type: 'shake', strength: 14, duration: 0.6 });
    return;
  }

  boss.fireCooldown -= dt;
  if (!boss.entering && boss.fireCooldown <= 0) {
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
      false
    );
  }
}

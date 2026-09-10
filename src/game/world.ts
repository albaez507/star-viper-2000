import type { InputFrame } from '../core/types';
import { Pool } from '../core/pool';
import { Rng } from '../core/rng';
import { EventBus } from '../core/events';
import { hits } from './collision';
import { dist } from '../core/math';

import { createPlayer, movePlayer, updatePlayerPitch, type Player, fireCooldownFor, missileCooldownFor, INVULN_TIME, PLAYER_HALF_W, PLAYER_HALF_H, DASH_SPEED_MULT, DASH_TIME, DASH_COOLDOWN, CHARGE_TIME, CHARGE_MIN_RATIO, CHARGE_DMG_MIN, CHARGE_DMG_MAX } from './player';
import { PositionHistory } from './history';
import { createOptions, updateOptions, type Option } from './options';
import { makeEnemy, type Enemy } from './enemy';
import { behaviors } from './behaviors/index';
import { type Formation, registerKill, registerEscape } from './formations';
import { makeBullet, spawnBullet, stepBullet, type Bullet } from './bullets';
import { makeMissile, spawnMissile, stepMissile, type Missile } from './missiles';
import { makePowerCore, spawnPowerCore, stepPowerCore, type PowerCore } from './powercore';
import { makeItem, spawnItem, stepItem, type Item } from './items';
import { disparosDe, optionsPara, MAX_WEAPON_LEVEL, SHIPS, nivelPorCores, coresParaNivel } from './weapons';
import { makeBoss, updateBossIntro, damageBoss, bossMovementFrequency, easeBossSize, BOSS_ANCHOR_MARGIN, type Boss } from './boss';
import { updateSpawner } from './spawner';
import type { StageId } from './stages';

export type GameState = {
  stageId: StageId;
  worldW: number;
  worldH: number;

  player: Player;
  history: PositionHistory;
  options: Option[];

  enemies: Pool<Enemy>;
  formations: Map<number, Formation>;

  playerBullets: Pool<Bullet>;
  enemyBullets: Pool<Bullet>;
  missiles: Pool<Missile>;
  powerCores: Pool<PowerCore>;
  items: Pool<Item>;

  boss: Boss;

  score: number;
  /** Items de hangar recogidos en esta partida. Se suman al total
   * persistente solo cuando la partida termina — morir no los regala. */
  itemsCollected: number;
  stageTime: number;
  spawnIndex: number;
  nextEnemyId: number;
  nextFormationId: number;
  rng: Rng;

  gameOver: boolean;
  victory: boolean;

  events: EventBus;
};

export function createWorld(worldW: number, worldH: number, seed = 1337, stageId: StageId = 'orbit'): GameState {
  return {
    worldW, worldH, stageId,
    player: createPlayer(90, worldH / 2),
    history: new PositionHistory(),
    options: createOptions(),
    enemies: new Pool(makeEnemy, 48),
    formations: new Map(),
    playerBullets: new Pool(makeBullet, 64),
    enemyBullets: new Pool(makeBullet, 32),
    missiles: new Pool(makeMissile, 8),
    powerCores: new Pool(makePowerCore, 4),
    items: new Pool(makeItem, 4),
    boss: makeBoss(),
    score: 0,
    itemsCollected: 0,
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
  stepItems(state, dt);

  if (state.player.lives <= 0) {
    state.gameOver = true;
    state.events.emit({ type: 'playerDeath' });
  }
}

function stepPlayer(state: GameState, input: InputFrame, dt: number): void {
  const p = state.player;
  if (p.hitFlash > 0) p.hitFlash = Math.max(0, p.hitFlash - dt);
  if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);

  if (p.dashCooldown > 0) p.dashCooldown = Math.max(0, p.dashCooldown - dt);

  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  updatePlayerPitch(p, dy, dt);

  if (input.dash && p.dashTimer <= 0 && p.dashCooldown <= 0) {
    // Va hacia donde estés pulsando; sin nada pulsado, hacia delante. Es lo
    // que hace que se sienta como "pongo la dirección y pulso", sin secuencias.
    const largo = Math.hypot(dx, dy);
    p.dashDX = largo > 0 ? dx / largo : 1;
    p.dashDY = largo > 0 ? dy / largo : 0;
    p.dashTimer = DASH_TIME;
    p.dashCooldown = DASH_COOLDOWN;
    state.events.emit({ type: 'dash', x: p.x, y: p.y });
  }

  if (p.dashTimer > 0) {
    p.dashTimer = Math.max(0, p.dashTimer - dt);
    // La dirección quedó congelada al arrancar: corregirla a media carrera
    // convertiría el dash en "ir rápido", que es otra cosa.
    dx = p.dashDX * DASH_SPEED_MULT;
    dy = p.dashDY * DASH_SPEED_MULT;
  }

  movePlayer(p, dx, dy, dt, { w: state.worldW, h: state.worldH });
  if (state.stageId === 'sky') p.y = Math.max(86, Math.min(state.worldH - 28, p.y));

  state.history.push(p.x, p.y);
  updateOptions(state.options, p.optionCount, state.history);

  if (p.fireCooldown > 0) p.fireCooldown -= dt;
  if (p.missileCooldown > 0) p.missileCooldown -= dt;

}

function fireFrom(state: GameState, x: number, y: number, esOption: boolean): void {
  const p = state.player;
  // Los Options siempre disparan la versión básica: si replicaran el arma
  // entera, tres buscadores por ráfaga barrerían la pantalla sola.
  const specs = disparosDe(p.ship, esOption ? 0 : p.weaponLevel);

  for (const spec of specs) {
    const b = state.playerBullets.acquire();
    spawnBullet(b, x + 10, y + spec.offsetY, spec.vx, spec.vy, spec.dmg, true, spec.pierce, false, spec.homing);
  }
}

function stepFiring(state: GameState, input: InputFrame, dt: number): void {
  const p = state.player;
  if (!p.alive) return;

  if (p.dashTimer > 0) return;

  // --- Carga -------------------------------------------------------------
  // Mantener carga; soltar dispara lo acumulado. Mientras carga NO salen
  // balitas: si pudieras cargar y disparar a la vez, cargar sería gratis y
  // entonces siempre mejor, y el juego se reduciría a mantener el botón.
  if (input.charge) {
    const antes = p.chargeTimer;
    p.chargeTimer = Math.min(CHARGE_TIME, p.chargeTimer + dt);
    if (antes < CHARGE_TIME && p.chargeTimer >= CHARGE_TIME) {
      state.events.emit({ type: 'chargeReady' });
    }
    return;
  }

  if (p.chargeTimer > 0) {
    const ratio = p.chargeTimer / CHARGE_TIME;
    p.chargeTimer = 0;
    // Por debajo del mínimo no sale nada: un roce del botón no es un disparo,
    // y así soltar por nervios se siente como haber perdido la carga.
    if (ratio >= CHARGE_MIN_RATIO) {
      const dmg = Math.round(CHARGE_DMG_MIN + (CHARGE_DMG_MAX - CHARGE_DMG_MIN) * ratio);
      const b = state.playerBullets.acquire();
      // Atraviesa: contra una formación en línea es devastador, contra
      // enemigos sueltos y rápidos es un desperdicio. Esa asimetría es la
      // decisión.
      spawnBullet(b, p.x + 14, p.y, 700, 0, dmg, true, true, true, false);
      state.events.emit({ type: 'chargeShot', ratio });
      // Tras soltar, la cadencia normal arranca limpia.
      p.fireCooldown = 0;
    }
    return;
  }

  if (input.fire && p.fireCooldown <= 0) {
    fireFrom(state, p.x, p.y, false);
    for (const opt of state.options) {
      if (opt.active) fireFrom(state, opt.x, opt.y, true);
    }
    p.fireCooldown = fireCooldownFor(p.ship, p.weaponLevel);
    state.events.emit({ type: 'fire', weapon: 'single' });
  }

  // Lanzar y detonar en botones distintos. Antes compartían uno, así que un
  // doble toque nervioso te detonaba el misil en la cara.
  if (input.detonate) {
    for (const m of state.missiles.active()) {
      m.active = false;
      explodeMissile(state, m.x, m.y, m.dmg);
    }
  }

  if (input.missile) {
    if (p.missileCooldown <= 0) {
      const m = state.missiles.acquire();
      spawnMissile(m, p.x + 6, p.y, MISSILE_SPEED);
      p.missileCooldown = missileCooldownFor(p);
      state.events.emit({ type: 'missileFire' });
    }
  }
}

const ENEMY_FIRE_MIN = 1.25;
const ENEMY_FIRE_MAX = 2.7;

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

const RIVAL_MISSILE_SPEED = 150;

/** La rival lanza misiles lentos y grandes: se esquivan, pero te obligan a
 * moverte, que es justo lo que ella quiere para ponerse a tu altura. */
function tryRivalMissile(state: GameState, e: Enemy, dt: number): void {
  if (e.missileCooldown <= 0) return;

  e.missileCooldown -= dt;
  if (e.missileCooldown > 0) return;

  if (e.x > state.worldW - 10) return;

  const b = state.enemyBullets.acquire();
  spawnBullet(b, e.x - e.halfW, e.y, -RIVAL_MISSILE_SPEED, 0, 1, false, false, true);
  e.missileCooldown = state.rng.range(2.6, 4.2);
}

function stepEnemies(state: GameState, dt: number): void {
  const ctx = { playerX: state.player.x, playerY: state.player.y };

  for (const e of state.enemies.active()) {
    if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);

    const behavior = behaviors[e.behavior];
    behavior(e, dt, ctx);
    tryEnemyFire(state, e, dt);
    if (e.behavior === 'rival') tryRivalMissile(state, e, dt);

    if (e.x < -40) {
      if (e.formationId >= 0) {
        const f = state.formations.get(e.formationId);
        if (f) registerEscape(f);
      }
      e.active = false;
    } else if (e.behavior === 'harasser' && e.x > state.worldW + 60) {
      // Huyó con el item: se pierde la oportunidad.
      e.active = false;
    } else if (e.y < -60 || e.y > state.worldH + 60) {
      // Un miembro del enjambre que se lanzó en diagonal puede salir por
      // arriba o por abajo en vez de por la izquierda.
      e.active = false;
    }
  }
}

const HOMING_TURN = 2.5;

/** Corrige el rumbo hacia el enemigo más cercano por delante, con giro
 * limitado: persigue, pero no es infalible — si te colocas mal, falla. */
/**
 * Gira más despacio que una bala buscadora a propósito (1.9 rad/s frente a
 * 3.6): tiene que poder fallar si el enemigo cambia de rumbo. Un misil que
 * nunca falla es una tecla de "matar", no un arma.
 */
const MISSILE_TURN = 1.9;

function guiarMisil(state: GameState, m: Missile, dt: number): void {
  // El jefe manda sobre todo lo demás: es para lo que guardas el misil.
  let objetivo: { x: number; y: number } | null = null;
  if (state.boss.active && state.boss.revealed && !state.boss.dying) {
    objetivo = state.boss;
  } else {
    let mejorDist = Infinity;
    for (const e of state.enemies.active()) {
      // Los obstáculos no se pueden destruir: perseguirlos sería tirar el misil.
      if (e.indestructible) continue;
      if (e.x < m.x) continue;
      const d = dist(m.x, m.y, e.x, e.y);
      if (d < mejorDist) { mejorDist = d; objetivo = e; }
    }
  }
  if (!objetivo) return;

  const velocidad = Math.hypot(m.vx, m.vy) || 1;
  const actual = Math.atan2(m.vy, m.vx);
  let delta = Math.atan2(objetivo.y - m.y, objetivo.x - m.x) - actual;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const giro = Math.max(-MISSILE_TURN * dt, Math.min(MISSILE_TURN * dt, delta));
  const nuevo = actual + giro;
  m.vx = Math.cos(nuevo) * velocidad;
  m.vy = Math.sin(nuevo) * velocidad;
}

function guiarBala(state: GameState, b: Bullet, dt: number): void {
  let mejor: { x: number; y: number } | null = null;
  let mejorDist = Infinity;

  for (const e of state.enemies.active()) {
    if (e.x < b.x) continue;
    const d = dist(b.x, b.y, e.x, e.y);
    if (d < mejorDist) { mejorDist = d; mejor = e; }
  }
  if (!mejor && state.boss.active && state.boss.revealed && !state.boss.dying) {
    mejor = state.boss;
  }
  if (!mejor) return;

  const velocidad = Math.hypot(b.vx, b.vy) || 1;
  const anguloActual = Math.atan2(b.vy, b.vx);
  const anguloObjetivo = Math.atan2(mejor.y - b.y, mejor.x - b.x);

  let delta = anguloObjetivo - anguloActual;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;

  const giro = Math.max(-HOMING_TURN * dt, Math.min(HOMING_TURN * dt, delta));
  const nuevo = anguloActual + giro;
  b.vx = Math.cos(nuevo) * velocidad;
  b.vy = Math.sin(nuevo) * velocidad;
}

function stepProjectiles(state: GameState, dt: number): void {
  for (const b of state.playerBullets.active()) {
    if (b.homing) guiarBala(state, b, dt);
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
    guiarMisil(state, m, dt);
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

function stepItems(state: GameState, dt: number): void {
  for (const it of state.items.active()) {
    stepItem(it, dt, state.player.x, state.player.y);
    if (it.x < -30) it.active = false;
  }
}

function damagePlayer(state: GameState): void {
  const p = state.player;
  if (p.invulnTimer > 0) return;

  if (p.shield > 0) {
    p.shield--;
  } else {
    p.lives--;
    if (p.weaponLevel > 0) {
      p.weaponLevel = (p.weaponLevel - 1) as typeof p.weaponLevel;
      // Los cores retroceden al umbral del nivel que queda: si no, un golpe
      // se recuperaría con un solo core y el castigo no se notaría.
      p.cores = coresParaNivel(p.weaponLevel);
      p.optionCount = optionsPara(p.weaponLevel);
    }
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

const MISSILE_SPLASH_RADIUS = 70;

function explodeMissile(state: GameState, x: number, y: number, dmg: number): void {
  for (const e of state.enemies.active()) {
    if (e.indestructible) continue;
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

/** Primer core: activa el arma característica. Siguientes: la suben de nivel.
 * Sin cursor y sin decidir cuándo gastarlo — ese era justo el punto donde el
 * sistema anterior se rompía. */
function subirArma(state: GameState): void {
  const p = state.player;
  const eraBasica = p.weaponLevel === 0;

  p.cores++;
  const nuevoNivel = nivelPorCores(p.cores);
  if (nuevoNivel > p.weaponLevel && p.weaponLevel < MAX_WEAPON_LEVEL) {
    p.weaponLevel = nuevoNivel;
    p.optionCount = optionsPara(p.weaponLevel);
  }

  // El primer core no es "una mejora más": es el momento en que tu nave
  // estrena su arma. Se anuncia distinto a propósito.
  if (eraBasica) {
    state.events.emit({ type: 'weaponActivated', nombre: SHIPS[p.ship].armaNombre });
  } else {
    state.events.emit({ type: 'coreCollected', slot: p.weaponLevel });
  }
}

function killEnemy(state: GameState, e: Enemy): void {
  state.score += e.score;
  state.events.emit({ type: 'enemyDeath', x: e.x, y: e.y });

  if (e.dropsItem) {
    const it = state.items.acquire();
    spawnItem(it, e.x, e.y);
  }

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
        if (e.indestructible) {
          // La bala se apaga contra la roca: sin destello y sin daño, para
          // que en dos disparos quede claro que esto no se mata, se esquiva.
          if (!b.pierce) b.active = false;
          state.events.emit({ type: 'hit', x: b.x, y: b.y });
          if (!b.pierce) break;
          continue;
        }
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
    if (hits(c.x, c.y, 14, 14, p.x, p.y, PLAYER_HALF_W + 16, PLAYER_HALF_H + 16)) {
      c.active = false;
      subirArma(state);
    }
  }

  for (const it of state.items.active()) {
    if (hits(it.x, it.y, 14, 14, p.x, p.y, PLAYER_HALF_W + 16, PLAYER_HALF_H + 16)) {
      it.active = false;
      state.itemsCollected++;
      state.events.emit({ type: 'itemCollected', x: it.x, y: it.y });
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
  easeBossSize(boss, dt);

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

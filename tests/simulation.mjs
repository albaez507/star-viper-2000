import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const { outputFiles } = await build({
  stdin: { contents: `export * from './src/game/world'; export * from './src/game/stages'; export * from './src/game/spawner'; export * from './src/core/types'; export * from './src/game/bullets'; export * from './src/game/boss';`, resolveDir: root },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { createWorld, step, STAGES, SKY_STAGE, emptyInput, updateSpawner, spawnBullet, spawnBoss } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
const dt = 1 / 60;
const idle = emptyInput(0);

test('both sectors have an ordered, complete timeline and distinct encounters', () => {
  for (const stage of Object.values(STAGES)) {
    assert.equal(stage.events.filter(e => 'boss' in e).length, 1);
    assert.ok('boss' in stage.events.at(-1));
    for (let i = 1; i < stage.events.length; i++) assert.ok(stage.events[i].t > stage.events[i - 1].t);
  }
  assert.equal(new Set(SKY_STAGE.filter(e => 'kind' in e).map(e => e.kind)).size, 8);
  assert.notDeepEqual(STAGES.orbit.events, SKY_STAGE);
});

test('pooled scouts never inherit courier rewards or rival missiles', () => {
  const state = createWorld(960, 540, 1337, 'sky');
  const reused = state.enemies.acquire();
  reused.dropsItem = true; reused.missileCooldown = 2.5; reused.lifetime = 9;
  reused.active = false;
  state.stageTime = 2; updateSpawner(state);
  assert.equal(state.enemies.active().length, 4);
  assert.equal(state.enemies.active()[0], reused);
  for (const enemy of state.enemies.active()) {
    assert.equal(enemy.dropsItem, false); assert.equal(enemy.missileCooldown, 0);
    assert.equal(enemy.lifetime, 0);
  }
});

test('each full sector reaches its boss with an empty projectile arena', () => {
  for (const id of ['orbit', 'sky']) {
    const state = createWorld(960, 540, 1337, id);
    state.player.invulnTimer = 999;
    for (let i = 0; i < 120 * 60 && !state.boss.active; i++) step(state, idle, dt);
    assert.ok(state.boss.active, id);
    assert.equal(state.spawnIndex, STAGES[id].events.length);
    assert.equal(state.enemies.active().length, 0);
    assert.equal(state.enemyBullets.active().length, 0);
    for (let i = 0; i < 180; i++) step(state, idle, dt);
    assert.ok(state.boss.revealed);
    assert.ok(Number.isFinite(state.boss.x));
  }
});

// Ritmo nuevo: el primer core activa el arma, y a partir de ahí cada nivel
// cuesta dos cores (umbrales 1, 3, 5). Antes bastaban 3 cores para el máximo
// y se llegaba al tope a mitad de sector.
test('both ships fire, upgrade on cores 1/3/5, and gain options at max', () => {
  for (const ship of ['vulcan', 'lance']) {
    const state = createWorld(960, 540, 1337, 'sky'); state.player.ship = ship;
    step(state, { ...idle, fire: true }, dt);
    assert.equal(state.playerBullets.active().length, 1);
    const esperadoPorCore = [1, 1, 2, 2, 3];
    for (let i = 0; i < esperadoPorCore.length; i++) {
      const core = state.powerCores.acquire();
      Object.assign(core, { x: state.player.x, y: state.player.y, vx: 0 });
      step(state, idle, dt);
      assert.equal(state.player.weaponLevel, esperadoPorCore[i], `core ${i + 1}`);
    }
    assert.equal(state.player.optionCount, 2);
    state.playerBullets.releaseAll(); state.player.fireCooldown = 0;
    step(state, { ...idle, fire: true }, dt);
    assert.ok(state.playerBullets.active().length > 1);
    assert.equal(state.playerBullets.active()[0].homing, ship === 'lance');
  }
});

test('projectile collisions eliminate formations and award a core', () => {
  const state = createWorld(960, 540, 1337, 'sky');
  // Buscado, no fijo: insertar una oleada nueva antes de la primera
  // formación no debe romper esta prueba.
  const idx = SKY_STAGE.findIndex(e => e.kind === 'formation');
  state.spawnIndex = idx; state.stageTime = SKY_STAGE[idx].t; updateSpawner(state);
  const enemies = state.enemies.active(); assert.equal(enemies.length, 6);
  enemies.forEach((e, i) => {
    Object.assign(e, { x: 300 + i * 65, y: 270, baseY: 270, t: 0 });
    spawnBullet(state.playerBullets.acquire(), e.x, e.y, 0, 0, 4, true);
  });
  step(state, idle, dt);
  assert.equal(state.enemies.active().length, 0);
  assert.equal(state.powerCores.active().length, 1);
  assert.equal(state.score, 1500);
});

test('missiles launch and manual detonation applies splash damage', () => {
  const state = createWorld(960, 540, 1337, 'sky');
  step(state, { ...idle, missile: true }, dt);
  assert.equal(state.missiles.active().length, 1);
  const missile = state.missiles.active()[0]; missile.x = 400;
  const enemy = state.enemies.acquire(); Object.assign(enemy, { x: 405, y: missile.y, hp: 1 });
  step(state, { ...idle, missile: true }, dt);
  assert.equal(state.missiles.active().length, 0); assert.equal(enemy.active, false);
  assert.ok(state.events.drain().some(e => e.type === 'missileImpact'));
});

test('the guardian advances through three phases and ends in victory', () => {
  const state = createWorld(960, 540, 1337, 'sky');
  state.spawnIndex = SKY_STAGE.length; state.player.invulnTimer = 999;
  spawnBoss(state.boss, 960, 540); state.boss.revealed = true;
  for (let phase = 1; phase <= 3; phase++) {
    assert.equal(state.boss.phase, phase);
    spawnBullet(state.playerBullets.acquire(), state.boss.x, state.boss.y, 0, 0, 100, true);
    step(state, idle, dt);
  }
  assert.ok(state.boss.dying);
  for (let i = 0; i < 90; i++) step(state, idle, dt);
  assert.equal(state.victory, true); assert.equal(state.boss.active, false);
});

test('sky bounds keep the ship visible; death and fresh runs reset correctly', () => {
  const state = createWorld(960, 540, 1337, 'sky');
  for (let i = 0; i < 120; i++) step(state, { ...idle, up: true }, dt);
  assert.ok(state.player.y >= 86);
  state.player.lives = 1; state.player.invulnTimer = 0;
  spawnBullet(state.enemyBullets.acquire(), state.player.x, state.player.y, 0, 0, 1, false);
  step(state, idle, dt); assert.equal(state.gameOver, true);
  const fresh = createWorld(960, 540, 1337, 'sky');
  assert.equal(fresh.stageTime, 0); assert.equal(fresh.gameOver, false);
  assert.equal(fresh.player.lives, 3); assert.equal(fresh.stageId, 'sky');
});

test('a hit drops one weapon level; cores spawn in reach and pull in', () => {
  const state = createWorld(960, 540, 1337, 'sky');
  state.player.weaponLevel = 2;
  state.player.cores = 3;          // el umbral del nivel 2
  state.player.optionCount = 0;
  state.player.invulnTimer = 0;
  spawnBullet(state.enemyBullets.acquire(), state.player.x, state.player.y, 0, 0, 1, false);
  step(state, idle, dt);
  assert.equal(state.player.weaponLevel, 1);
  assert.equal(state.player.lives, 2);

  // Un solo core ya no devuelve el nivel perdido: hacen falta dos.
  for (const _ of [0, 1]) {
    const core = state.powerCores.acquire();
    Object.assign(core, { x: 360, y: state.player.y, vx: -42, active: true });
    for (let i = 0; i < 90; i++) step(state, idle, dt);
  }
  assert.equal(state.powerCores.active().length, 0);
  assert.equal(state.player.weaponLevel, 2);
});

test('production sheets exist and both sprite sheets preserve PNG alpha', async () => {
  for (const file of ['background', 'sprites', 'guardian']) {
    const png = await readFile(new URL(`../public/assets/sky/${file}.png`, import.meta.url));
    assert.equal(png.toString('ascii', 1, 4), 'PNG');
    assert.ok(png.readUInt32BE(16) >= 1024);
    if (file !== 'background') assert.equal(png[25], 6, `${file} must be RGBA`);
  }
});

test('hazards absorb fire instead of dying', () => {
  const state = createWorld(960, 540, 99, 'sky');
  const idx = SKY_STAGE.findIndex(e => e.kind === 'hazard');
  state.spawnIndex = idx; state.stageTime = SKY_STAGE[idx].t; updateSpawner(state);
  const roca = state.enemies.active()[0];
  assert.equal(roca.indestructible, true);
  assert.equal(roca.score, 0);
  Object.assign(roca, { x: 300, y: 270, baseY: 270 });
  for (let i = 0; i < 20; i++) {
    spawnBullet(state.playerBullets.acquire(), roca.x, roca.y, 0, 0, 4, true);
    step(state, idle, dt);
  }
  assert.equal(roca.active, true, 'la roca no se destruye');
  assert.equal(state.score, 0, 'y no da puntos');
});

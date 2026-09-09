import type { GameState } from './world';
import { STAGE_1, isBossSpawn, type WaveSpawn } from './stage1';
import { createFormation } from './formations';
import { spawnBoss } from './boss';

export function updateSpawner(state: GameState): void {
  while (
    state.spawnIndex < STAGE_1.length &&
    state.stageTime >= STAGE_1[state.spawnIndex].t
  ) {
    const ev = STAGE_1[state.spawnIndex];
    if (isBossSpawn(ev)) {
      spawnBoss(state.boss, state.worldW, state.worldH);
    } else {
      spawnWave(state, ev);
    }
    state.spawnIndex++;
  }
}

function spawnWave(state: GameState, wave: WaveSpawn): void {
  const isFormation = wave.kind === 'formation';
  const formationId = isFormation ? state.nextFormationId++ : -1;
  if (isFormation) {
    state.formations.set(formationId, createFormation(formationId, wave.count));
  }

  for (let i = 0; i < wave.count; i++) {
    const e = state.enemies.acquire();
    e.id = state.nextEnemyId++;
    e.hitFlash = 0;
    e.t = state.rng.range(0, 6.28);
    e.diving = false;
    e.formationId = formationId;
    e.score = isFormation ? 250 : 100;

    const spreadY = 40 + (i % 6) * 68;
    e.baseY = 60 + spreadY;
    e.y = e.baseY;
    e.x = state.worldW + 40 + i * 46;
    e.halfW = 13;
    e.halfH = 12;
    e.hp = isFormation ? 2 : wave.kind === 'diver' ? 2 : 1;
    e.maxHp = e.hp;
    e.triggerX = state.worldW * 0.55;
    e.canShoot = false;
    e.diveDelay = 0;
    // Escalonado inicial para que una oleada entera no dispare a la vez.
    e.fireCooldown = state.rng.range(0.8, 2.6);

    switch (wave.kind) {
      case 'scout':
        e.behavior = 'scout';
        e.vx = -70 - state.rng.range(0, 20);
        e.vy = 0;
        break;
      case 'sine':
        e.behavior = 'sine';
        e.vx = -55;
        e.vy = 0;
        e.canShoot = true;
        break;
      case 'diver':
        e.behavior = 'diver';
        e.vx = -60;
        e.vy = 0;
        e.canShoot = true;
        break;
      case 'formation': {
        e.behavior = 'formation';
        e.vx = -46;
        e.vy = 0;
        const shape = wave.shape ?? 'line';
        const offset = formationOffset(shape, i);
        e.baseY = state.worldH / 2 + offset.y;
        e.y = e.baseY;
        e.x = state.worldW + 40 + offset.x;
        break;
      }
      case 'harasser': {
        e.behavior = 'harasser';
        e.vx = 0;
        e.vy = 0;
        e.t = 0;
        e.hp = 4;
        e.maxHp = 4;
        e.anchorX = state.worldW * 0.68;
        e.anchorY = state.worldH / 2;
        e.x = state.worldW + 40;
        e.y = e.anchorY;
        e.baseY = e.anchorY;
        e.canShoot = true;
        e.dropsItem = true;
        e.lifetime = 9;
        e.score = 400;
        e.halfW = 15;
        e.halfH = 14;
        break;
      }
      case 'rival': {
        e.behavior = 'rival';
        e.vx = 0;
        e.vy = 0;
        e.t = 0;
        e.hp = 22;
        e.maxHp = 22;
        e.anchorX = state.worldW * 0.74;
        e.anchorY = state.worldH / 2;
        e.x = state.worldW + 60;
        e.y = e.anchorY;
        e.baseY = e.anchorY;
        e.canShoot = true;
        e.missileCooldown = 2.5;
        e.fireCooldown = 1.2;
        e.score = 1200;
        e.halfW = 26;
        e.halfH = 22;
        break;
      }
      case 'swarm': {
        e.behavior = 'swarm';
        e.vx = 0;
        e.vy = 0;
        e.t = 0;

        const col = Math.floor(i / SWARM_ROWS);
        const row = i % SWARM_ROWS;
        e.anchorX = state.worldW - 140 - col * 48;
        e.anchorY = state.worldH / 2 + (row - (SWARM_ROWS - 1) / 2) * 64;
        e.x = state.worldW + 60 + col * 48;
        e.y = e.anchorY;
        e.baseY = e.anchorY;
        e.diveDelay = SWARM_FIRST_DIVE + i * SWARM_DIVE_SPACING;
        e.score = 150;
        break;
      }
    }
  }
}

const SWARM_ROWS = 4;
const SWARM_FIRST_DIVE = 2.2;
const SWARM_DIVE_SPACING = 0.5;

function formationOffset(shape: 'v' | 'column' | 'line', i: number): { x: number; y: number } {
  switch (shape) {
    case 'v':
      return { x: Math.abs(i - 2.5) * 36, y: (i - 2.5) * 44 };
    case 'column':
      return { x: 0, y: (i - 2.5) * 50 };
    case 'line':
    default:
      return { x: i * 50, y: 0 };
  }
}

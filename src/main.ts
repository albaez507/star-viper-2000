import { GameLoop } from './core/loop';
import { createWorld, step, type GameState } from './game/world';
import { bossWarpMultiplier, spawnBoss } from './game/boss';
import { STAGE_1 } from './game/stage1';
import type { Weapon } from './core/types';
import { InputManager } from './input/input';
import { AudioEngine } from './audio/audio';
import { playSfx } from './audio/sfx';
import { Starfield } from './render/starfield';
import { ParticleSystem } from './fx/particles';
import { ScreenShake } from './fx/shake';
import { Renderer } from './render/renderer';
import { drawPauseOverlay, type ScreenMode } from './render/screens';

const WORLD_W = 960;
const WORLD_H = 540;

const canvas = document.getElementById('game') as HTMLCanvasElement;
canvas.width = WORLD_W;
canvas.height = WORLD_H;
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('2D canvas context unavailable');

const dpadEl = document.getElementById('dpad') as HTMLElement;
const fireEl = document.getElementById('btn-fire') as HTMLElement;
const missileEl = document.getElementById('btn-missile') as HTMLElement;
const pauseEl = document.getElementById('btn-pause') as HTMLElement;

const input = new InputManager();
input.attachTouch(dpadEl, fireEl, missileEl);

let pauseRequested = false;
pauseEl.addEventListener('pointerdown', (e) => {
  pauseRequested = true;
  e.preventDefault();
  e.stopPropagation();
});

const audio = new AudioEngine();
const unlockAudio = (): void => audio.unlock();
window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });

let tapToStart = false;
canvas.addEventListener('pointerdown', () => {
  if (mode === 'title' || mode === 'gameover' || mode === 'victory') tapToStart = true;
});

const starfield = new Starfield(WORLD_W, WORLD_H);
const particles = new ParticleSystem(200);
const shake = new ScreenShake();
const renderer = new Renderer(ctx, starfield, particles, shake);

let state: GameState = createWorld(WORLD_W, WORLD_H);
let mode: ScreenMode = 'title';
let elapsed = 0;
let paused = false;

function resetGame(): void {
  state = createWorld(WORLD_W, WORLD_H);
  mode = 'playing';
}

const devPlayEl = document.getElementById('dev-play') as HTMLElement;
const devBossEl = document.getElementById('dev-boss') as HTMLElement;
const devSwarmEl = document.getElementById('dev-swarm') as HTMLElement;
const devWeaponsEl = document.getElementById('dev-weapons') as HTMLElement;
const devReadoutEl = document.getElementById('dev-weapon-readout') as HTMLElement;

const WEAPON_CYCLE: Weapon[] = ['single', 'double', 'laser'];
let weaponTestIndex = 0;

devPlayEl.addEventListener('click', () => {
  resetGame();
});

devBossEl.addEventListener('click', () => {
  resetGame();
  state.spawnIndex = STAGE_1.length;
  spawnBoss(state.boss, state.worldW, state.worldH);
});

devSwarmEl.addEventListener('click', () => {
  resetGame();
  const swarmIndex = STAGE_1.findIndex((ev) => 'kind' in ev && ev.kind === 'swarm');
  if (swarmIndex >= 0) {
    state.spawnIndex = swarmIndex;
    state.stageTime = STAGE_1[swarmIndex].t;
  }
});

devWeaponsEl.addEventListener('click', () => {
  const alreadyInTest = mode === 'playing' && state.enemies.active().some((e) => e.id === 99999);
  if (!alreadyInTest) {
    resetGame();
    state.spawnIndex = STAGE_1.length;
    state.player.optionCount = 2;

    const dummy = state.enemies.acquire();
    Object.assign(dummy, {
      id: 99999, x: state.worldW * 0.72, y: state.worldH / 2,
      hp: 9999, maxHp: 9999, halfW: 13, halfH: 12,
      behavior: 'scout', vx: 0, vy: 0, hitFlash: 0,
      formationId: -1, active: true, diving: false, score: 0,
      fireCooldown: 0, t: 0, triggerX: 0, divingVx: 0, divingVy: 0,
    });
    weaponTestIndex = 0;
  } else {
    weaponTestIndex = (weaponTestIndex + 1) % WEAPON_CYCLE.length;
  }
  state.player.weapon = WEAPON_CYCLE[weaponTestIndex];
});

function handleEvents(s: GameState): void {
  for (const ev of s.events.drain()) {
    playSfx(audio, ev);

    switch (ev.type) {
      case 'hit':
        particles.burst(ev.x, ev.y, 5, '#ffd23f', 70);
        break;
      case 'enemyDeath':
        particles.burst(ev.x, ev.y, 16, '#ff8c3e', 130);
        break;
      case 'bossDeath':
        particles.burst(ev.x, ev.y, 40, '#ff5470', 180);
        break;
      case 'bossEnrage':
        particles.burst(ev.x, ev.y, 30, '#9c1f3c', 160);
        break;
      case 'coreCollected':
        particles.burst(s.player.x, s.player.y, 10, '#ffd23f', 60);
        break;
      case 'shake':
        shake.trigger(ev.strength, ev.duration);
        break;
      case 'missileImpact':
        particles.burst(ev.x, ev.y, 26, '#ff8c3e', 150);
        break;
    }
  }
}

const loop = new GameLoop({
  step: (dt) => {
    const frame = input.sample();
    const pausePressed = input.consumePausePressed() || pauseRequested;
    pauseRequested = false;

    if (mode !== 'playing') {
      paused = false;
    } else if (pausePressed) {
      paused = !paused;
    }

    if (paused) return;

    elapsed += dt;
    const warp = mode === 'playing' ? bossWarpMultiplier(state.boss) : 1;
    starfield.update(dt, warp);
    particles.update(dt);
    shake.update(dt);

    if (mode === 'title') {
      if (input.consumeStartPressed() || frame.fire || tapToStart) resetGame();
      tapToStart = false;
      return;
    }

    if (mode === 'gameover' || mode === 'victory') {
      if (input.consumeStartPressed() || frame.power || tapToStart) resetGame();
      tapToStart = false;
      return;
    }

    step(state, frame, dt);
    handleEvents(state);

    if (state.gameOver) mode = 'gameover';
    if (state.victory) mode = 'victory';
  },
  render: () => {
    renderer.draw(state, mode, elapsed);
    if (paused && mode === 'playing') drawPauseOverlay(ctx, WORLD_W, WORLD_H);

    pauseEl.textContent = paused ? '▶' : '⏸';
    pauseEl.hidden = mode !== 'playing';
    missileEl.classList.toggle('ready', mode === 'playing' && !paused && state.player.missileCooldown <= 0);
    devReadoutEl.textContent = mode === 'playing' ? `ARMA: ${state.player.weapon.toUpperCase()}` : '';
  },
});

loop.start();

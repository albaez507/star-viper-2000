import { GameLoop } from './core/loop';
import { createWorld, step, type GameState } from './game/world';
import { InputManager } from './input/input';
import { AudioEngine } from './audio/audio';
import { playSfx } from './audio/sfx';
import { Starfield } from './render/starfield';
import { ParticleSystem } from './fx/particles';
import { ScreenShake } from './fx/shake';
import { Renderer } from './render/renderer';
import type { ScreenMode } from './render/screens';

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

const input = new InputManager();
input.attachTouch(dpadEl, fireEl, missileEl);

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

function resetGame(): void {
  state = createWorld(WORLD_W, WORLD_H);
  mode = 'playing';
}

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
      case 'coreCollected':
        particles.burst(s.player.x, s.player.y, 10, '#ffd23f', 60);
        break;
      case 'shake':
        shake.trigger(ev.strength, ev.duration);
        break;
    }
  }
}

const loop = new GameLoop({
  step: (dt) => {
    elapsed += dt;
    starfield.update(dt);
    particles.update(dt);
    shake.update(dt);

    const frame = input.sample();

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
  },
});

loop.start();

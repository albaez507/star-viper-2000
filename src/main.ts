import { GameLoop } from './core/loop';
import { createWorld, step, type GameState } from './game/world';
import { bossWarpMultiplier, spawnBoss } from './game/boss';
import { STAGE_1 } from './game/stage1';
import { SHIP_ORDER, SHIPS, nombreArma, MAX_WEAPON_LEVEL, type WeaponLevel } from './game/weapons';
import { loadProgress, banquearItems, comprar, nivelDe, puedeComprar, UPGRADES, type Progress } from './meta/progress';
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

let progress: Progress = loadProgress();

/** Traduce el progreso persistente a campos del jugador. Vive aquí y no en
 * `game/` para que la simulación siga sin saber nada de almacenamiento. */
function aplicarMejoras(): void {
  state.player.lives = SHIPS[state.player.ship].vidasIniciales + nivelDe(progress, 'hull');
  state.player.speedLevel += nivelDe(progress, 'engines');
  if (nivelDe(progress, 'shield') > 0) state.player.shield = state.player.shieldMax;
}

/** Los items solo se abonan al terminar la partida: morir no los regala a
 * medias, y así recogerlos tiene sentido incluso en una run que va mal. */
function banquearRun(): void {
  if (state.itemsCollected > 0) {
    progress = banquearItems(progress, state.itemsCollected);
    state.itemsCollected = 0;
    renderHangar();
  }
}

function resetGame(): void {
  state = createWorld(WORLD_W, WORLD_H);
  aplicarMejoras();
  mode = 'playing';
  // Sin esto, reiniciar mientras estabas en pausa arranca la partida
  // congelada y sin nada que indique por qué.
  paused = false;
}

const devPlayEl = document.getElementById('dev-play') as HTMLElement;
const devBossEl = document.getElementById('dev-boss') as HTMLElement;
const devSwarmEl = document.getElementById('dev-swarm') as HTMLElement;
const devWeaponsEl = document.getElementById('dev-weapons') as HTMLElement;
const devReadoutEl = document.getElementById('dev-weapon-readout') as HTMLElement;
const visualStyleEl = document.getElementById('visual-style') as HTMLSelectElement;
const visualWeaponEl = document.getElementById('visual-weapon') as HTMLSelectElement;
const visualLightingEl = document.getElementById('visual-lighting') as HTMLInputElement;
const styleReadoutEl = document.getElementById('style-readout') as HTMLElement;

const savedVisualStyle = localStorage.getItem('sv-visual-style');
const savedLighting = localStorage.getItem('sv-visual-lighting') === 'true';
if (savedVisualStyle && [...visualStyleEl.options].some((o) => o.value === savedVisualStyle)) visualStyleEl.value = savedVisualStyle;
visualLightingEl.checked = savedLighting;
function applyVisualLab(): void {
  document.body.dataset.visualStyle = visualStyleEl.value;
  document.body.dataset.lighting = String(visualLightingEl.checked);
  localStorage.setItem('sv-visual-style', visualStyleEl.value);
  localStorage.setItem('sv-visual-lighting', String(visualLightingEl.checked));
  styleReadoutEl.textContent = `${visualStyleEl.selectedOptions[0].text} · ${visualWeaponEl.selectedOptions[0].text}`;
}
visualStyleEl.addEventListener('change', applyVisualLab);
visualWeaponEl.addEventListener('change', applyVisualLab);
visualLightingEl.addEventListener('change', applyVisualLab);
applyVisualLab();

let shipTestIndex = 0;
let nivelTest: WeaponLevel = 1;

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
    shipTestIndex = 0;
    nivelTest = 1;
  } else {
    // Cada click recorre nivel 1→2→3 y al pasarse cambia de nave, para poder
    // comparar las dos naves en sus tres niveles sin jugar el stage.
    if (nivelTest < MAX_WEAPON_LEVEL) {
      nivelTest = (nivelTest + 1) as WeaponLevel;
    } else {
      nivelTest = 1;
      shipTestIndex = (shipTestIndex + 1) % SHIP_ORDER.length;
    }
  }
  state.player.ship = SHIP_ORDER[shipTestIndex];
  state.player.weaponLevel = nivelTest;
  state.player.optionCount = nivelTest >= 3 ? 2 : nivelTest >= 2 ? 1 : 0;
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
      case 'itemCollected':
        particles.burst(ev.x, ev.y, 18, '#9dff5e', 110);
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

    if (state.gameOver) { mode = 'gameover'; banquearRun(); }
    else if (state.victory) { mode = 'victory'; banquearRun(); }
  },
  render: () => {
    renderer.draw(state, mode, elapsed);
    if (paused && mode === 'playing') drawPauseOverlay(ctx, WORLD_W, WORLD_H);

    pauseEl.textContent = paused ? '▶' : '⏸';
    pauseEl.hidden = mode !== 'playing';
    missileEl.classList.toggle('ready', mode === 'playing' && !paused && state.player.missileCooldown <= 0);
    devReadoutEl.textContent = mode === 'playing'
      ? `${SHIPS[state.player.ship].nombre} — ${nombreArma(state.player.ship, state.player.weaponLevel)}`
      : '';
    hangarBtn.hidden = mode === 'playing';
  },
});

const hangarEl = document.getElementById('hangar') as HTMLElement;
const hangarBtn = document.getElementById('btn-hangar') as HTMLElement;
const hangarCloseBtn = document.getElementById('hangar-close') as HTMLElement;
const hangarCountEl = document.getElementById('hangar-count') as HTMLElement;
const hangarListEl = document.getElementById('hangar-list') as HTMLElement;

function renderHangar(): void {
  hangarCountEl.textContent = String(progress.items);
  hangarListEl.replaceChildren();

  for (const def of UPGRADES) {
    const nivel = nivelDe(progress, def.id);
    const alMaximo = nivel >= def.maxNivel;

    const fila = document.createElement('div');
    fila.className = 'hangar-row';

    const info = document.createElement('div');
    info.className = 'hangar-row-info';
    const nombre = document.createElement('div');
    nombre.className = 'hangar-row-name';
    nombre.textContent = `${def.nombre}  [${nivel}/${def.maxNivel}]`;
    const desc = document.createElement('div');
    desc.className = 'hangar-row-desc';
    desc.textContent = def.descripcion;
    info.append(nombre, desc);

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = alMaximo ? 'MÁXIMO' : `${def.costo} ITEMS`;
    boton.disabled = alMaximo || !puedeComprar(progress, def);
    boton.addEventListener('click', () => {
      progress = comprar(progress, def);
      renderHangar();
    });

    fila.append(info, boton);
    hangarListEl.append(fila);
  }
}

hangarBtn.addEventListener('click', () => {
  renderHangar();
  hangarEl.hidden = false;
});
hangarCloseBtn.addEventListener('click', () => { hangarEl.hidden = true; });

renderHangar();
hangarEl.hidden = true;

loop.start();



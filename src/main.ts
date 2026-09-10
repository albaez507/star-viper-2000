import { GameLoop } from './core/loop';
import { createWorld, step, type GameState } from './game/world';
import { bossWarpMultiplier, spawnBoss } from './game/boss';
import { STAGES, stageId } from './game/stages';
import { SHIP_ORDER, SHIPS, nombreArma, MAX_WEAPON_LEVEL, type ShipId, type WeaponLevel } from './game/weapons';
import { loadProgress, banquearItems, comprar, nivelDe, puedeComprar, UPGRADES, type Progress } from './meta/progress';
import { InputManager } from './input/input';
import { AudioEngine } from './audio/audio';
import { playSfx } from './audio/sfx';
import { Starfield } from './render/starfield';
import { ParticleSystem } from './fx/particles';
import { ScreenShake } from './fx/shake';
import { Renderer } from './render/renderer';
import { drawPauseOverlay, drawWeaponBanner, type ScreenMode } from './render/screens';
import { setSpriteVisualStyle } from './render/sprites';
import { getEnemyVariant, setEnemyVariant, skyAssetsReady, type ManagedEnemyVariant, type ManagedEnemyFamily } from './render/sky-assets';
import { ENEMY_ASSET_OPTIONS, MANAGED_ENEMY_FAMILIES } from './render/asset-registry';
import { CHARGE_TIME } from './game/player';

const WORLD_W = 960;
const WORLD_H = 540;

const canvas = document.getElementById('game') as HTMLCanvasElement;
const rawCtx = canvas.getContext('2d');
if (!rawCtx) throw new Error('2D canvas context unavailable');
const ctx = rawCtx;

/**
 * El lienzo se dibuja a la resolución REAL a la que se ve.
 *
 * Antes el bitmap era siempre 960×540 y el navegador lo estiraba a lo que
 * midiera la ventana (p. ej. 1178×663, un 1.23×). Ese estirón fraccionario es
 * lo que emborronaba todo: unos píxeles salían de 1 y otros de 2. Ahora el
 * bitmap coincide con los píxeles de pantalla, así que no hay estirón y los
 * sprites se reducen desde su arte original directamente al tamaño final.
 *
 * Las coordenadas del juego siguen siendo 960×540: lo único que cambia es
 * cuántos píxeles reales hay por unidad de mundo.
 */
function fitCanvas(): void {
  const parent = canvas.parentElement;
  if (!parent) return;
  const fit = Math.min(parent.clientWidth / WORLD_W, parent.clientHeight / WORLD_H);
  const cssScale = Number.isFinite(fit) && fit > 0 ? fit : 1;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const cssW = Math.round(WORLD_W * cssScale);
  const cssH = Math.round(WORLD_H * cssScale);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.width = Math.max(1, Math.round(cssW * dpr));
  canvas.height = Math.max(1, Math.round(cssH * dpr));

  const escala = canvas.width / WORLD_W;
  ctx.setTransform(escala, 0, 0, escala, 0, 0);
  ctx.imageSmoothingEnabled = false;
}
fitCanvas();

/**
 * iOS informa tamaños viejos justo cuando gira la pantalla: si solo escuchas
 * `resize`, la partida se queda con las medidas del vertical y aparece
 * diminuta en una esquina. Por eso se vuelve a medir en el frame siguiente y
 * otra vez pasado un momento, cuando la barra del navegador ya se ha movido.
 */
function reajustar(): void {
  fitCanvas();
  requestAnimationFrame(fitCanvas);
  setTimeout(fitCanvas, 350);
}
// Esconder la cabecera al empezar la partida cambia el alto disponible sin
// que se dispare ningún `resize`. El observador lo cubre sin tener que
// acordarse de llamar a fitCanvas en cada sitio que cambia de pantalla.
if (canvas.parentElement) new ResizeObserver(() => fitCanvas()).observe(canvas.parentElement);
window.addEventListener('resize', reajustar);
window.addEventListener('orientationchange', reajustar);
window.visualViewport?.addEventListener('resize', reajustar);

const fullscreenEl = document.getElementById('btn-fullscreen') as HTMLElement;
fullscreenEl?.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await document.documentElement.requestFullscreen();
    // Solo Android lo permite; en iOS lanza y no pasa nada más.
    await (screen.orientation as { lock?: (o: string) => Promise<void> })
      .lock?.('landscape');
  } catch {
    // Safari en iPhone no tiene fullscreen de elementos. No es un fallo que
    // deba romper nada: el juego se sigue jugando, solo con la barra puesta.
  }
  reajustar();
});
document.addEventListener('fullscreenchange', reajustar);

const dpadEl = document.getElementById('dpad') as HTMLElement;
const fireEl = document.getElementById('btn-fire') as HTMLElement;
const missileEl = document.getElementById('btn-missile') as HTMLElement;
const chargeEl = document.getElementById('btn-charge') as HTMLElement;
const pauseEl = document.getElementById('btn-pause') as HTMLElement;

const input = new InputManager();
input.attachTouch(dpadEl, fireEl, missileEl, chargeEl);

let pauseRequested = false;
pauseEl.addEventListener('pointerdown', (e) => {
  pauseRequested = true;
  e.preventDefault();
  e.stopPropagation();
});

// El navegador oculta los mandos hasta que se pulsa un botón, así que el
// aviso llega al pulsar, no al enchufar. Merece la pena decirlo en pantalla.
const padToastEl = document.getElementById('pad-toast') as HTMLElement;
let padToastTimer = 0;
function avisarMando(texto: string): void {
  padToastEl.textContent = texto;
  padToastEl.hidden = false;
  window.clearTimeout(padToastTimer);
  padToastTimer = window.setTimeout(() => { padToastEl.hidden = true; }, 3500);
}
window.addEventListener('gamepadconnected', (e) => {
  const id = (e as GamepadEvent).gamepad.id.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  avisarMando(`🎮 MANDO CONECTADO · ${id || 'genérico'}`);
});
window.addEventListener('gamepaddisconnected', () => avisarMando('🎮 MANDO DESCONECTADO'));

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

let selectedStage = stageId(localStorage.getItem('sv-stage'));
const savedShip = localStorage.getItem('sv-ship');
let selectedShip: ShipId = savedShip && SHIP_ORDER.includes(savedShip as ShipId) ? savedShip as ShipId : 'vulcan';
let assetsReady = false;
let state: GameState = createWorld(WORLD_W, WORLD_H, 1337, selectedStage);
let mode: ScreenMode = 'title';
let elapsed = 0;
let paused = false;

const BANNER_DURACION = 1.6;
let bannerArma = '';
let bannerTimer = 0;

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

function resetGame(): boolean {
  if (selectedStage === 'sky' && !assetsReady) return false;
  bannerTimer = 0;
  state = createWorld(WORLD_W, WORLD_H, 1337, selectedStage);
  state.player.ship = selectedShip;
  aplicarMejoras();
  mode = 'playing';
  hangarEl.hidden = true;
  document.body.dataset.mode = mode;
  // Sin esto, reiniciar mientras estabas en pausa arranca la partida
  // congelada y sin nada que indique por qué.
  paused = false;
  return true;
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
const stylePreviewEl = document.getElementById('style-preview') as HTMLImageElement;

const savedVisualStyle = localStorage.getItem('sv-visual-style');
const savedLighting = localStorage.getItem('sv-visual-lighting') === 'true';
if (savedVisualStyle && [...visualStyleEl.options].some((o) => o.value === savedVisualStyle)) visualStyleEl.value = savedVisualStyle;
visualLightingEl.checked = savedLighting;
function applyVisualLab(): void {
  document.body.dataset.visualStyle = visualStyleEl.value;
  setSpriteVisualStyle(visualStyleEl.value);
  document.body.dataset.lighting = String(visualLightingEl.checked);
  localStorage.setItem('sv-visual-style', visualStyleEl.value);
  localStorage.setItem('sv-visual-lighting', String(visualLightingEl.checked));
  styleReadoutEl.textContent = `${visualStyleEl.selectedOptions[0].text} · ${visualWeaponEl.selectedOptions[0].text}`;
  stylePreviewEl.hidden = visualStyleEl.value !== 'detailed';
}
visualStyleEl.addEventListener('change', applyVisualLab);
visualWeaponEl.addEventListener('change', applyVisualLab);
visualLightingEl.addEventListener('change', applyVisualLab);
applyVisualLab();

const menuEl = document.getElementById('mission-menu')!;
const homeViewEl = document.getElementById('home-view')!;
const onePlayerViewEl = document.getElementById('one-player-view')!;
const optionsViewEl = document.getElementById('options-view')!;
const spriteManagementEl = document.getElementById('sprite-management')!;
const assetManagerListEl = document.getElementById('asset-manager-list')!;
const assetManagerStatusEl = document.getElementById('asset-manager-status')!;
const startEl = document.getElementById('start-mission') as HTMLButtonElement;
const missionStatus = document.getElementById('mission-status')!;
const sectorButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-stage]')];
const shipButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-ship]')];
type MenuView = 'home' | 'one-player' | 'options' | 'sprites';
const menuViews: Record<MenuView, HTMLElement> = {
  home: homeViewEl, 'one-player': onePlayerViewEl, options: optionsViewEl, sprites: spriteManagementEl,
};
function showMenuView(view: MenuView): void {
  for (const [name, element] of Object.entries(menuViews)) element.hidden = name !== view;
}

const assetFamilyInfo: Record<ManagedEnemyFamily, { name: string; role: string }> = {
  scout: { name: 'SCOUT', role: 'INTERCEPTOR BÁSICO' },
  diver: { name: 'DIVER', role: 'NAVE DE PICADO' },
  formation: { name: 'FORMATION', role: 'ESCUADRÓN DE DRONES' },
};

function renderAssetManager(): void {
  assetManagerListEl.replaceChildren();
  for (const family of MANAGED_ENEMY_FAMILIES) {
    const familyCard = document.createElement('section');
    familyCard.className = 'asset-family-card';

    const heading = document.createElement('div');
    heading.className = 'asset-family-heading';
    const familyName = document.createElement('strong');
    familyName.textContent = assetFamilyInfo[family].name;
    const familyRole = document.createElement('small');
    familyRole.textContent = assetFamilyInfo[family].role;
    heading.append(familyName, familyRole);

    const choiceGrid = document.createElement('div');
    choiceGrid.className = 'asset-choice-grid';
    const current = getEnemyVariant(family);
    for (const option of ENEMY_ASSET_OPTIONS[family]) {
      const choice = document.createElement('button');
      choice.type = 'button';
      choice.className = 'asset-choice';
      choice.setAttribute('aria-pressed', String(option.id === current));
      choice.setAttribute('aria-label', `${assetFamilyInfo[family].name} ${option.label}`);
      choice.title = option.description;

      const preview = document.createElement('span');
      preview.className = 'asset-choice-preview';
      preview.style.backgroundImage = `url("${option.sheet}")`;
      preview.style.backgroundSize = '300% 100%';
      preview.style.backgroundPosition = `${option.position} 50%`;
      preview.style.setProperty('--asset-accent', option.accent);

      const label = document.createElement('span');
      label.className = 'asset-choice-label';
      label.textContent = option.label;
      choice.append(preview, label);
      choice.addEventListener('click', () => {
        setEnemyVariant(family, option.id as ManagedEnemyVariant);
        assetManagerStatusEl.textContent = `${assetFamilyInfo[family].name} → ${option.label} · ACTIVO EN SENTINEL`;
        renderAssetManager();
      });
      choiceGrid.append(choice);
    }
    familyCard.append(heading, choiceGrid);
    assetManagerListEl.append(familyCard);
  }
}

function updateMissionSelection(): void {
  document.body.dataset.stage = selectedStage;
  sectorButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.stage === selectedStage)));
  shipButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ship === selectedShip)));
  startEl.disabled = selectedStage === 'sky' && !assetsReady;
  startEl.firstElementChild!.textContent = startEl.disabled ? 'PREPARANDO VUELO…' : 'INICIAR MISIÓN';
  missionStatus.textContent = startEl.disabled ? 'Cargando los assets del archipiélago…' : `${STAGES[selectedStage].name} · ENTER para despegar`;
  if (mode === 'title') {
    state.stageId = selectedStage;
    state.player.ship = selectedShip;
  }
  localStorage.setItem('sv-stage', selectedStage);
  localStorage.setItem('sv-ship', selectedShip);
}
sectorButtons.forEach(b => b.addEventListener('click', () => {
  selectedStage = stageId(b.dataset.stage ?? null); updateMissionSelection();
}));
shipButtons.forEach(b => b.addEventListener('click', () => {
  if (SHIP_ORDER.includes(b.dataset.ship as ShipId)) selectedShip = b.dataset.ship as ShipId;
  updateMissionSelection();
}));
startEl.addEventListener('click', () => { resetGame(); canvas.focus(); });
document.getElementById('menu-start')!.addEventListener('click', () => showMenuView('one-player'));
document.getElementById('menu-one-player')!.addEventListener('click', () => showMenuView('one-player'));
document.getElementById('menu-options')!.addEventListener('click', () => showMenuView('options'));
document.getElementById('one-player-back')!.addEventListener('click', () => showMenuView('home'));
document.getElementById('options-back')!.addEventListener('click', () => showMenuView('home'));
document.getElementById('open-sprite-management')!.addEventListener('click', () => {
  renderAssetManager();
  showMenuView('sprites');
});
document.getElementById('sprite-management-back')!.addEventListener('click', () => showMenuView('options'));
menuEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.repeat && hangarEl.hidden) {
    e.preventDefault(); resetGame(); canvas.focus();
  }
});
document.getElementById('btn-missions')!.addEventListener('click', () => {
  mode = 'title'; paused = false; bannerTimer = 0;
  state = createWorld(WORLD_W, WORLD_H, 1337, selectedStage);
  showMenuView('one-player');
  updateMissionSelection();
});
document.getElementById('toggle-lab')!.addEventListener('click', e => {
  const button = e.currentTarget as HTMLButtonElement;
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('lab-open', open);
  fitCanvas();
});
canvas.tabIndex = 0;
showMenuView('home');
updateMissionSelection();
Promise.all([skyAssetsReady, renderer.sky.ready]).then(() => {
  assetsReady = true; updateMissionSelection();
}).catch((error: unknown) => {
  console.error('Sky assets failed to load', error);
  missionStatus.textContent = 'No se pudieron cargar los assets. Recarga la página o elige Órbita Sentinel.';
});

let shipTestIndex = 0;
let nivelTest: WeaponLevel = 1;

devPlayEl.addEventListener('click', () => {
  resetGame();
});

devBossEl.addEventListener('click', () => {
  if (!resetGame()) return;
  state.spawnIndex = STAGES[state.stageId].events.length;
  spawnBoss(state.boss, state.worldW, state.worldH);
});

devSwarmEl.addEventListener('click', () => {
  if (!resetGame()) return;
  const timeline = STAGES[state.stageId].events;
  const swarmIndex = timeline.findIndex((ev) => 'kind' in ev && ev.kind === 'swarm');
  if (swarmIndex >= 0) {
    state.spawnIndex = swarmIndex;
    state.stageTime = timeline[swarmIndex].t;
  }
});

devWeaponsEl.addEventListener('click', () => {
  const alreadyInTest = mode === 'playing' && state.enemies.active().some((e) => e.id === 99999);
  if (!alreadyInTest) {
    if (!resetGame()) return;
    state.spawnIndex = STAGES[state.stageId].events.length;
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
        if (s.stageId === 'sky') renderer.sky.burst(ev.x, ev.y, elapsed);
        particles.burst(ev.x, ev.y, 16, '#ff8c3e', 130);
        break;
      case 'bossDeath':
        if (s.stageId === 'sky') renderer.sky.burst(ev.x, ev.y, elapsed, 240);
        particles.burst(ev.x, ev.y, 40, '#ff5470', 180);
        break;
      case 'bossEnrage':
        particles.burst(ev.x, ev.y, 30, '#9c1f3c', 160);
        break;
      case 'coreCollected':
        particles.burst(s.player.x, s.player.y, 10, '#ffd23f', 60);
        break;
      case 'weaponActivated':
        bannerArma = ev.nombre;
        bannerTimer = BANNER_DURACION;
        particles.burst(s.player.x, s.player.y, 24, '#3ee6c4', 130);
        shake.trigger(4, 0.18);
        break;
      case 'itemCollected':
        particles.burst(ev.x, ev.y, 18, '#9dff5e', 110);
        break;
      case 'shake':
        shake.trigger(ev.strength, ev.duration);
        break;
      case 'missileImpact':
        if (s.stageId === 'sky') renderer.sky.burst(ev.x, ev.y, elapsed, 80);
        particles.burst(ev.x, ev.y, 26, '#ff8c3e', 150);
        break;
    }
  }
}

const loop = new GameLoop({
  step: (dt) => {
    const frame = input.sample();
    const startPressed = input.consumeStartPressed();
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
    renderer.sky.update(dt, warp);
    particles.update(dt);
    shake.update(dt);
    if (bannerTimer > 0) bannerTimer = Math.max(0, bannerTimer - dt);

    if (mode === 'title') {
      const editing = document.activeElement?.matches('button, select, input');
      if (!editing && hangarEl.hidden && (startPressed || tapToStart)) resetGame();
      tapToStart = false;
      return;
    }

    if (mode === 'gameover' || mode === 'victory') {
      if (startPressed || frame.power || tapToStart) resetGame();
      tapToStart = false;
      return;
    }

    // Propulsor: sale de la tobera cada frame mientras la nave esté viva.
    // Más fuerte si aceleras hacia delante y más flojo si frenas, para que se
    // vea que la nave responde en vez de arrastrar una llama fija.
    if (!paused && state.player.alive && !state.gameOver) {
      // En el teléfono no cabe un cuarto botón, así que MSL cambia de papel
      // cuando hay un misil volando. Lo dice la etiqueta: si no, el jugador
      // no puede saber que el mismo botón hace otra cosa.
      const volando = state.missiles.active().length > 0;
      missileEl.textContent = volando ? 'DET' : 'MSL';
      missileEl.classList.toggle('armed', volando);

      // El botón táctil también avisa: en el teléfono el pulgar tapa la nave.
      const ratioCarga = state.player.chargeTimer / CHARGE_TIME;
      chargeEl.classList.toggle('charging', ratioCarga > 0 && ratioCarga < 1);
      chargeEl.classList.toggle('full', ratioCarga >= 1);

      if (state.player.dashTimer > 0) {
        particles.dashTrail(state.player.x, state.player.y);
      } else {
        const fuerza = frame.right ? 1.45 : frame.left ? 0.6 : 1;
        const color = Math.random() < 0.35 ? '#ff8c3e' : '#ffd23f';
        particles.thruster(state.player.x - 17, state.player.y, color, fuerza);
      }
    }

    step(state, frame, dt);
    handleEvents(state);

    if (state.gameOver) { mode = 'gameover'; banquearRun(); }
    else if (state.victory) { mode = 'victory'; banquearRun(); }
  },
  render: () => {
    menuEl.hidden = mode !== 'title';
    document.body.dataset.mode = mode;
    renderer.draw(state, mode, elapsed);
    if (bannerTimer > 0 && mode === 'playing') {
      drawWeaponBanner(ctx, WORLD_W, WORLD_H, bannerArma, bannerTimer, BANNER_DURACION);
    }
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




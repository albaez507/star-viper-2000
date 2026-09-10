import type { AudioEngine } from './audio';
import type { GameEvent } from '../core/events';

function envGain(ctx: AudioContext, out: AudioNode, peak: number, attack: number, release: number): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(peak, ctx.currentTime + attack);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + attack + release);
  g.connect(out);
  return g;
}

function tone(engine: AudioEngine, freq: number, type: OscillatorType, duration: number, peak = 0.5): void {
  const ctx = engine.context;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  const g = envGain(ctx, engine.output, peak, 0.005, duration);
  osc.connect(g);
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.05);
}

function noiseBurst(engine: AudioEngine, duration: number, peak = 0.6, filterFreq = 1200): void {
  const ctx = engine.context;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + duration);

  const g = envGain(ctx, engine.output, peak, 0.005, duration);
  src.connect(filter);
  filter.connect(g);
  src.start();
}

export function playSfx(engine: AudioEngine, ev: GameEvent): void {
  switch (ev.type) {
    case 'fire':
      tone(engine, 720, 'square', 0.06, 0.14);
      break;
    case 'dash':
      // Corto y agudo, nada de explosión: es un movimiento, no un impacto.
      tone(engine, 980, 'triangle', 0.05, 0.11);
      break;
    case 'chargeReady':
      // Aviso de "ya está": dos notas cortas subiendo, distintas de todo lo
      // demás para que se reconozca sin mirar.
      tone(engine, 880, 'triangle', 0.05, 0.09);
      window.setTimeout(() => tone(engine, 1320, 'triangle', 0.06, 0.1), 70);
      break;
    case 'chargeShot':
      // Grave y con cuerpo: tiene que sonar más caro que una balita.
      tone(engine, 180 + 260 * ev.ratio, 'sawtooth', 0.16, 0.3);
      break;
    case 'missileFire':
      tone(engine, 220, 'sawtooth', 0.14, 0.25);
      break;
    case 'missileImpact':
      noiseBurst(engine, 0.32, 0.5, 900);
      tone(engine, 90, 'sawtooth', 0.15, 0.3);
      break;
    case 'hit':
      tone(engine, 340, 'square', 0.05, 0.16);
      break;
    case 'enemyDeath':
      noiseBurst(engine, 0.22, 0.35, 1400);
      break;
    case 'coreCollected':
      tone(engine, 660, 'triangle', 0.09, 0.3);
      tone(engine, 990, 'triangle', 0.12, 0.22);
      break;
    case 'weaponActivated':
      tone(engine, 440, 'square', 0.07, 0.3);
      tone(engine, 660, 'square', 0.07, 0.3);
      tone(engine, 880, 'triangle', 0.28, 0.34);
      break;
    case 'itemCollected':
      tone(engine, 880, 'triangle', 0.08, 0.28);
      tone(engine, 1320, 'triangle', 0.14, 0.2);
      break;
    case 'playerDamage':
      noiseBurst(engine, 0.18, 0.45, 900);
      break;
    case 'playerDeath':
      noiseBurst(engine, 0.5, 0.5, 500);
      break;
    case 'bossDeath':
      noiseBurst(engine, 0.6, 0.55, 700);
      break;
    case 'bossEnrage':
      tone(engine, 110, 'sawtooth', 0.3, 0.4);
      noiseBurst(engine, 0.35, 0.4, 1100);
      break;
  }
}

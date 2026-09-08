import { POWER_SLOTS } from '../core/types';
import type { GameState } from '../game/world';
import { missileCooldownFor } from '../game/player';
import { clamp } from '../core/math';

const SLOT_LABELS: Record<string, string> = {
  speed: 'SPD', missile: 'MSL', double: 'DBL', laser: 'LSR', option: 'OPT', shield: 'SHD',
};

export function drawHud(ctx: CanvasRenderingContext2D, state: GameState, t: number): void {
  ctx.save();
  ctx.font = '14px "Courier New", monospace';
  ctx.textBaseline = 'top';

  ctx.fillStyle = '#eaf6ff';
  ctx.fillText(`SCORE ${String(state.score).padStart(6, '0')}`, 12, 10);
  ctx.fillText(`LIVES ${'▲'.repeat(Math.max(0, state.player.lives))}`, 12, 28);

  drawMissileStatus(ctx, state, t);
  drawPowerMeter(ctx, state, t);

  if (state.boss.active) drawBossBar(ctx, state);

  ctx.restore();
}

function drawPowerMeter(ctx: CanvasRenderingContext2D, state: GameState, t: number): void {
  const meter = state.powerMeter;
  const boxW = 46;
  const boxH = 22;
  const gap = 4;
  const totalW = POWER_SLOTS.length * boxW + (POWER_SLOTS.length - 1) * gap;
  const startX = state.worldW - totalW - 12;
  const y = 10;

  POWER_SLOTS.forEach((slot, i) => {
    const x = startX + i * (boxW + gap);
    const filled = i < meter.filled;
    const isCursor = i === meter.cursor && meter.filled > 0;

    ctx.fillStyle = filled ? 'rgba(62, 230, 196, 0.28)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(x, y, boxW, boxH);

    ctx.strokeStyle = isCursor
      ? `rgba(255, 210, 63, ${0.6 + Math.sin(t * 10) * 0.4})`
      : 'rgba(234, 246, 255, 0.25)';
    ctx.lineWidth = isCursor ? 2 : 1;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.fillStyle = filled ? '#3ee6c4' : 'rgba(234,246,255,0.5)';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText(SLOT_LABELS[slot], x + 6, y + 6);
  });
}

function drawMissileStatus(ctx: CanvasRenderingContext2D, state: GameState, t: number): void {
  const p = state.player;
  const max = missileCooldownFor(p);
  const ready = p.missileCooldown <= 0;
  const ratio = max > 0 ? clamp(1 - p.missileCooldown / max, 0, 1) : 1;

  const x = 12;
  const y = 46;
  const w = 100;
  const h = 12;

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = ready ? '#ff8c3e' : 'rgba(255,140,62,0.35)';
  ctx.fillRect(x, y, w * ratio, h);

  ctx.strokeStyle = ready
    ? `rgba(255, 140, 63, ${0.6 + Math.sin(t * 10) * 0.4})`
    : 'rgba(234, 246, 255, 0.25)';
  ctx.lineWidth = ready ? 2 : 1;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#eaf6ff';
  ctx.font = '9px "Courier New", monospace';
  ctx.fillText(ready ? 'MISIL LISTO (M/X)' : 'MISIL', x + 4, y + 2);
}

function drawBossBar(ctx: CanvasRenderingContext2D, state: GameState): void {
  const boss = state.boss;
  const w = state.worldW * 0.5;
  const x = (state.worldW - w) / 2;
  const y = state.worldH - 26;
  const ratio = Math.max(0, boss.hp / boss.maxHp);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x, y, w, 10);
  ctx.fillStyle = '#ff5470';
  ctx.fillRect(x, y, w * ratio, 10);
  ctx.strokeStyle = 'rgba(234,246,255,0.4)';
  ctx.strokeRect(x, y, w, 10);
}

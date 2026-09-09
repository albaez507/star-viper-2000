import type { GameState } from '../game/world';
import { missileCooldownFor } from '../game/player';
import { nombreArma, MAX_WEAPON_LEVEL } from '../game/weapons';
import { clamp } from '../core/math';
import { STAGES } from '../game/stages';

export function drawHud(ctx: CanvasRenderingContext2D, state: GameState, t: number): void {
  ctx.save();
  if (state.stageId === 'sky') {
    ctx.fillStyle = 'rgba(17, 47, 65, .91)';
    ctx.fillRect(0, 0, state.worldW, 70);
    ctx.fillStyle = '#d6b975'; ctx.fillRect(0, 69, state.worldW, 1);
  }
  const stage = STAGES[state.stageId];
  ctx.textAlign = 'center'; ctx.font = 'bold 12px monospace'; ctx.fillStyle = '#fff2ca';
  ctx.fillText(state.boss.active ? stage.boss : stage.name.toUpperCase(), state.worldW / 2 + 45, 22);
  const bossTime = stage.events[stage.events.length - 1].t;
  ctx.fillStyle = '#345967'; ctx.fillRect(state.worldW / 2 - 60, 34, 210, 3);
  ctx.fillStyle = '#e2c77d'; ctx.fillRect(state.worldW / 2 - 60, 34, 210 * Math.min(1, state.stageTime / bossTime), 3);
  ctx.textAlign = 'left';
  ctx.font = '14px "Courier New", monospace';
  ctx.textBaseline = 'top';

  ctx.fillStyle = '#eaf6ff';
  ctx.fillText(`SCORE ${String(state.score).padStart(6, '0')}`, 12, 10);
  ctx.fillText(`LIVES ${'▲'.repeat(Math.max(0, state.player.lives))}`, 12, 28);
  ctx.font = '10px "Courier New", monospace';
  ctx.fillStyle = 'rgba(234,246,255,0.7)';
  ctx.fillText(`ARMA: ${nombreArma(state.player.ship, state.player.weaponLevel)}`, 118, 30);
  ctx.font = '14px "Courier New", monospace';

  drawMissileStatus(ctx, state, t);
  drawWeaponLevel(ctx, state, t);

  ctx.restore();
}

function drawWeaponLevel(ctx: CanvasRenderingContext2D, state: GameState, t: number): void {
  const nivel = state.player.weaponLevel;
  const boxW = 34;
  const boxH = 22;
  const gap = 5;
  const total = MAX_WEAPON_LEVEL * boxW + (MAX_WEAPON_LEVEL - 1) * gap;
  const startX = state.worldW - total - 12;
  const y = 10;

  for (let i = 0; i < MAX_WEAPON_LEVEL; i++) {
    const x = startX + i * (boxW + gap);
    const lleno = i < nivel;
    const siguiente = i === nivel;

    ctx.fillStyle = lleno ? 'rgba(62, 230, 196, 0.32)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = siguiente
      ? `rgba(62, 230, 196, ${0.35 + Math.sin(t * 6) * 0.25})`
      : 'rgba(234, 246, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, boxW, boxH);
  }

  ctx.fillStyle = 'rgba(234,246,255,0.65)';
  ctx.font = '9px "Courier New", monospace';
  ctx.fillText('NIVEL DE ARMA', startX, y + boxH + 4);
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


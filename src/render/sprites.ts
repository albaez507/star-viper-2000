import type { Player } from '../game/player';
import type { Option } from '../game/options';
import type { Enemy } from '../game/enemy';
import type { Bullet } from '../game/bullets';
import type { Missile } from '../game/missiles';
import type { PowerCore } from '../game/powercore';
import type { Boss } from '../game/boss';

const ENEMY_COLORS: Record<string, string> = {
  scout: '#ff5470',
  sine: '#ffd23f',
  diver: '#ff8c3e',
  formation: '#c792ff',
};

export function drawPlayer(ctx: CanvasRenderingContext2D, p: Player): void {
  if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 20) % 2 === 0) return;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = p.hitFlash > 0 ? '#ffffff' : '#3ee6c4';
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-9, -7);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-9, 7);
  ctx.closePath();
  ctx.fill();

  if (p.shield > 0) {
    ctx.strokeStyle = 'rgba(122, 92, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawOption(ctx: CanvasRenderingContext2D, o: Option): void {
  if (!o.active) return;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.fillStyle = '#7a5cff';
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(5, 0);
  ctx.lineTo(0, 5);
  ctx.lineTo(-5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy): void {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : ENEMY_COLORS[e.behavior] ?? '#ff5470';

  if (e.formationId >= 0) {
    ctx.strokeStyle = 'rgba(199, 146, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, e.halfW + 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(-e.halfW, 0);
  ctx.lineTo(e.halfW * 0.4, -e.halfH);
  ctx.lineTo(e.halfW, 0);
  ctx.lineTo(e.halfW * 0.4, e.halfH);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const BOSS_PHASE_COLOR: Record<1 | 2 | 3, string> = {
  1: '#ff5470',
  2: '#d43a5c',
  3: '#9c1f3c',
};

export function drawBoss(ctx: CanvasRenderingContext2D, b: Boss): void {
  if (!b.active) return;
  ctx.save();
  ctx.translate(b.x, b.y);

  const pulse = b.phase === 3 ? 0.75 + Math.sin(b.t * 10) * 0.25 : 1;
  ctx.fillStyle = b.hitFlash > 0 ? '#ffffff' : BOSS_PHASE_COLOR[b.phase];
  ctx.globalAlpha = pulse;
  ctx.beginPath();
  ctx.moveTo(-b.halfW, 0);
  ctx.lineTo(-b.halfW * 0.2, -b.halfH);
  ctx.lineTo(b.halfW, -b.halfH * 0.4);
  ctx.lineTo(b.halfW, b.halfH * 0.4);
  ctx.lineTo(-b.halfW * 0.2, b.halfH);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  if (b.phase >= 2 && b.hitFlash <= 0) drawBossCracks(ctx, b);

  ctx.fillStyle = '#0a0e17';
  ctx.beginPath();
  ctx.arc(b.halfW * 0.3, 0, b.halfH * 0.18, 0, Math.PI * 2);
  ctx.fill();

  if (b.phase === 3 && b.hitFlash <= 0) {
    ctx.strokeStyle = `rgba(255, 84, 112, ${0.5 + Math.sin(b.t * 12) * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.halfW * 0.3, 0, b.halfH * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawBossHealthBar(ctx: CanvasRenderingContext2D, b: Boss): void {
  if (!b.active) return;

  const w = b.halfW * 1.8;
  const h = 7;
  const x = b.x - w / 2;
  const y = b.y - b.halfH - h - 10;
  const ratio = Math.max(0, b.hp / b.maxHp);

  ctx.save();
  ctx.fillStyle = 'rgba(6, 8, 16, 0.7)';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = BOSS_PHASE_COLOR[b.phase];
  ctx.fillRect(x, y, w * ratio, h);
  ctx.strokeStyle = 'rgba(234,246,255,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#eaf6ff';
  ctx.font = '9px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('JEFE', x + w / 2, y - 10);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawBossCracks(ctx: CanvasRenderingContext2D, b: Boss): void {
  ctx.strokeStyle = b.phase === 3 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(-b.halfW * 0.5, -b.halfH * 0.5);
  ctx.lineTo(-b.halfW * 0.15, -b.halfH * 0.1);
  ctx.lineTo(-b.halfW * 0.35, b.halfH * 0.2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(b.halfW * 0.2, -b.halfH * 0.6);
  ctx.lineTo(b.halfW * 0.4, -b.halfH * 0.2);
  ctx.lineTo(b.halfW * 0.15, b.halfH * 0.1);
  ctx.stroke();

  if (b.phase === 3) {
    ctx.beginPath();
    ctx.moveTo(-b.halfW * 0.1, b.halfH * 0.3);
    ctx.lineTo(b.halfW * 0.2, b.halfH * 0.55);
    ctx.lineTo(b.halfW * 0.5, b.halfH * 0.35);
    ctx.stroke();
  }
}

export function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet): void {
  ctx.fillStyle = b.fromPlayer ? (b.pierce ? '#3ee6c4' : '#ffd23f') : '#ff5470';
  const w = b.fromPlayer ? 8 : 6;
  const h = 3;
  ctx.fillRect(b.x - w / 2, b.y - h / 2, w, h);
}

export function drawMissile(ctx: CanvasRenderingContext2D, m: Missile): void {
  ctx.fillStyle = '#ff8c3e';
  ctx.fillRect(m.x - 7, m.y - 3, 14, 6);
  ctx.fillStyle = 'rgba(255,140,62,0.4)';
  ctx.fillRect(m.x - 16, m.y - 1.5, 9, 3);
}

export function drawPowerCore(ctx: CanvasRenderingContext2D, c: PowerCore, t: number): void {
  const pulse = 1 + Math.sin(t * 8) * 0.15;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.arc(0, 0, 7 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,210,63,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 11 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

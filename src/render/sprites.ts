import type { Player } from '../game/player';
import { PLAYER_HALF_W, PLAYER_HALF_H } from '../game/player';
import type { Option } from '../game/options';
import type { Enemy } from '../game/enemy';
import type { Bullet } from '../game/bullets';
import type { Missile } from '../game/missiles';
import type { PowerCore } from '../game/powercore';
import type { Item } from '../game/items';
import type { Boss } from '../game/boss';

const ENEMY_COLORS: Record<string, string> = {
  scout: '#ff5470',
  sine: '#ffd23f',
  diver: '#ff8c3e',
  formation: '#c792ff',
  swarm: '#5ee6ff',
  harasser: '#9dff5e',
  rival: '#ff4fd8',
};

const ASSET_ROOT = '/assets/';
const images = new Map<string, HTMLImageElement>();
const failedAssets = new Set<string>();
function asset(name: string): HTMLImageElement {
  let img = images.get(name);
  if (!img) {
    img = new Image();
    img.src = `${ASSET_ROOT}${name}`;
    img.onerror = () => failedAssets.add(name);
    images.set(name, img);
  }
  return img;
}
function drawAsset(ctx: CanvasRenderingContext2D, name: string, w: number, h: number): boolean {
  if (failedAssets.has(name)) return false;
  const img = asset(name);
  if (!img.complete || img.naturalWidth === 0) return false;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  return true;
}

export function drawPlayer(ctx: CanvasRenderingContext2D, p: Player): void {
  if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 20) % 2 === 0) return;

  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.hitFlash <= 0) {
    // De momento solo el casco. Las otras tres capas llegaron dibujadas como
    // objetos sueltos a lienzo completo (un motor, un cañón), no como partes
    // alineadas sobre la misma nave, así que apilarlas da un amasijo. El
    // casco por sí solo ya es una nave completa y correcta.
    // TODO: reactivar cuando las capas vengan alineadas entre sí.
    drawAsset(ctx, 'ship-hull.png', 48, 32);
  }
  if (p.hitFlash <= 0) {
    if (p.shield > 0) {
      ctx.strokeStyle = 'rgba(122, 92, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, PLAYER_HALF_W + 6, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    return;
  }
  ctx.fillStyle = p.hitFlash > 0 ? '#ffffff' : '#3ee6c4';
  ctx.beginPath();
  ctx.moveTo(PLAYER_HALF_W * 1.2, 0);
  ctx.lineTo(-PLAYER_HALF_W * 0.9, -PLAYER_HALF_H);
  ctx.lineTo(-PLAYER_HALF_W * 0.4, 0);
  ctx.lineTo(-PLAYER_HALF_W * 0.9, PLAYER_HALF_H);
  ctx.closePath();
  ctx.fill();

  if (p.shield > 0) {
    ctx.strokeStyle = 'rgba(122, 92, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_HALF_W + 6, 0, Math.PI * 2);
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
  const damaged = e.hp < e.maxHp;
  if (drawAsset(ctx, `enemy-${e.behavior}${damaged ? '-dmg' : ''}.png`, e.halfW * 2.2, e.halfH * 2.2)) {
    ctx.restore();
    drawEnemyHealthBar(ctx, e);
    return;
  }
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

  // La acosadora lleva un aura: hay que verla desde lejos para decidir si
  // vale la pena ir por ella antes de que huya.
  if (e.behavior === 'harasser') {
    ctx.strokeStyle = `rgba(157, 255, 94, ${0.35 + Math.sin(e.t * 7) * 0.25})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.halfW + 9, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();

  // Barra de vida solo para enemigos que aguantan varios impactos (la rival).
  drawEnemyHealthBar(ctx, e);
}

function drawEnemyHealthBar(ctx: CanvasRenderingContext2D, e: Enemy): void {
  if (e.maxHp > 6 && e.hp < e.maxHp) {
    const w = e.halfW * 2;
    const x = e.x - w / 2;
    const y = e.y - e.halfH - 12;
    ctx.fillStyle = 'rgba(6, 8, 16, 0.7)';
    ctx.fillRect(x - 1, y - 1, w + 2, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = ENEMY_COLORS[e.behavior] ?? '#ff5470';
    ctx.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), 4);
  }
}

export function drawItem(ctx: CanvasRenderingContext2D, it: Item): void {
  const pulse = 1 + Math.sin(it.t * 7) * 0.18;
  ctx.save();
  ctx.translate(it.x, it.y);
  ctx.rotate(it.t * 2.2);
  ctx.fillStyle = '#9dff5e';
  ctx.fillRect(-7 * pulse, -7 * pulse, 14 * pulse, 14 * pulse);
  ctx.fillStyle = '#0a0e17';
  ctx.fillRect(-3 * pulse, -3 * pulse, 6 * pulse, 6 * pulse);
  ctx.restore();

  ctx.strokeStyle = `rgba(157, 255, 94, ${0.4 + Math.sin(it.t * 9) * 0.3})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(it.x, it.y, 15, 0, Math.PI * 2);
  ctx.stroke();
}

const BOSS_PHASE_COLOR: Record<1 | 2 | 3, string> = {
  1: '#ff5470',
  2: '#d43a5c',
  3: '#9c1f3c',
};

export function drawBoss(ctx: CanvasRenderingContext2D, b: Boss): void {
  if (!b.active || !b.revealed) return;
  ctx.save();
  ctx.translate(b.x, b.y);
  if (b.hitFlash <= 0 && b.enrageFlash <= 0 && drawAsset(ctx, `boss-sentinel-${b.phase}.png`, b.halfW * 2, b.halfH * 2)) {
    ctx.restore();
    return;
  }

  const pulse = b.phase === 3 ? 0.75 + Math.sin(b.t * 10) * 0.25 : 1;
  ctx.fillStyle = (b.hitFlash > 0 || b.enrageFlash > 0) ? '#ffffff' : BOSS_PHASE_COLOR[b.phase];
  ctx.globalAlpha = pulse;
  ctx.beginPath();
  ctx.moveTo(-b.halfW, -b.halfH * 0.45);
  ctx.lineTo(-b.halfW * 0.55, -b.halfH);
  ctx.lineTo(b.halfW * 0.6, -b.halfH);
  ctx.lineTo(b.halfW, -b.halfH * 0.35);
  ctx.lineTo(b.halfW, b.halfH * 0.35);
  ctx.lineTo(b.halfW * 0.6, b.halfH);
  ctx.lineTo(-b.halfW * 0.55, b.halfH);
  ctx.lineTo(-b.halfW, b.halfH * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  if (b.phase >= 2 && b.hitFlash <= 0 && b.enrageFlash <= 0) drawBossCracks(ctx, b);

  if (b.enrageFlash > 0) {
    const ringRatio = 1 - b.enrageFlash / 0.5;
    ctx.strokeStyle = `rgba(255, 84, 112, ${1 - ringRatio})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, b.halfW * (0.7 + ringRatio * 0.8), 0, Math.PI * 2);
    ctx.stroke();
  }

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
  if (!b.active || !b.revealed) return;

  const w = b.halfW * 1.8;
  const h = 7;
  const x = b.x - w / 2;
  const y = b.y - b.halfH - h - 10;
  const ratio = Math.max(0, b.phaseHp / b.phaseMaxHp);

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
  ctx.fillText(`JEFE — FASE ${b.phase}/3`, x + w / 2, y - 10);
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
  if (b.fromPlayer && b.pierce) {
    ctx.fillStyle = 'rgba(62, 230, 196, 0.35)';
    ctx.fillRect(b.x - 18, b.y - 2, 14, 4);
    ctx.fillStyle = '#3ee6c4';
    ctx.fillRect(b.x - 4, b.y - 2, 18, 4);
    return;
  }

  if (b.big) {
    ctx.fillStyle = 'rgba(255, 84, 112, 0.3)';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff5470';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd8de';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.fillStyle = b.fromPlayer ? '#ffd23f' : '#ff5470';
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

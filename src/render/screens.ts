import type { GameState } from '../game/world';
import type { Boss } from '../game/boss';
import { STAGES } from '../game/stages';

export type ScreenMode = 'title' | 'playing' | 'gameover' | 'victory';

export function drawScreen(ctx: CanvasRenderingContext2D, state: GameState, mode: ScreenMode): void {
  if (mode === 'playing' || mode === 'title') return;

  ctx.save();
  ctx.fillStyle = 'rgba(6, 8, 16, 0.72)';
  ctx.fillRect(0, 0, state.worldW, state.worldH);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#eaf6ff';

  const cx = state.worldW / 2;
  const cy = state.worldH / 2;

  if (mode === 'gameover') {
    ctx.font = 'bold 30px "Courier New", monospace';
    ctx.fillStyle = '#ff5470';
    ctx.fillText('GAME OVER', cx, cy - 30);
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#eaf6ff';
    ctx.fillText(`SCORE ${state.score}`, cx, cy + 6);
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText('ENTER / toca la pantalla para reintentar', cx, cy + 32);
  } else if (mode === 'victory') {
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillStyle = '#3ee6c4';
    ctx.fillText(`${STAGES[state.stageId].name.toUpperCase()} — COMPLETADO`, cx, cy - 30);
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#eaf6ff';
    ctx.fillText(`SCORE ${state.score}`, cx, cy + 6);
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText('ENTER / toca la pantalla para reiniciar', cx, cy + 32);
  }

  ctx.textAlign = 'left';
  ctx.restore();
}

export function drawBossWarning(ctx: CanvasRenderingContext2D, worldW: number, worldH: number, boss: Boss, elapsed: number): void {
  if (!boss.active || boss.revealed) return;

  const blink = boss.introPhase === 'warp'
    ? 0.55 + Math.sin(elapsed * 16) * 0.45
    : 0.7;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.globalAlpha = blink;

  ctx.font = 'bold 42px "Courier New", monospace';
  ctx.fillStyle = '#ff5470';
  ctx.fillText('警告', worldW / 2, worldH - 78);

  ctx.font = '13px "Courier New", monospace';
  ctx.fillStyle = '#eaf6ff';
  ctx.globalAlpha = Math.min(1, blink + 0.2);
  ctx.fillText('ALERTA — OBJETIVO DE GRAN ESCALA DETECTADO', worldW / 2, worldH - 34);

  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawPauseOverlay(ctx: CanvasRenderingContext2D, worldW: number, worldH: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(6, 8, 16, 0.72)';
  ctx.fillRect(0, 0, worldW, worldH);

  ctx.textAlign = 'center';
  const cx = worldW / 2;
  const cy = worldH / 2;

  ctx.font = 'bold 30px "Courier New", monospace';
  ctx.fillStyle = '#3ee6c4';
  ctx.fillText('PAUSA', cx, cy - 16);

  ctx.font = '13px "Courier New", monospace';
  ctx.fillStyle = '#eaf6ff';
  ctx.fillText('P / botón de pausa para continuar', cx, cy + 12);

  ctx.textAlign = 'left';
  ctx.restore();
}

/** Anuncio grande y breve de que el arma característica se acaba de activar.
 * Sin esto, el primer core solo cambiaba unos números en el HUD y el momento
 * pasaba desapercibido. */
export function drawWeaponBanner(
  ctx: CanvasRenderingContext2D,
  worldW: number,
  worldH: number,
  nombre: string,
  restante: number,
  duracion: number,
): void {
  const t = 1 - restante / duracion;
  const alpha = restante < 0.35 ? restante / 0.35 : Math.min(1, t * 6);
  const subir = (1 - Math.min(1, t * 3)) * 18;

  // Centro de la pantalla, no arriba: ahí choca con el rótulo de sector.
  const cy = worldH * 0.5 + subir;
  const texto = `${nombre} ACTIVADA`;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.globalAlpha = alpha;

  // Panel oscuro detrás. Sin esto el texto turquesa desaparece sobre los
  // entornos claros — se diseñó cuando el fondo era espacio negro.
  ctx.font = 'bold 30px "Courier New", monospace';
  const anchoTexto = ctx.measureText(texto).width;
  const panelW = Math.max(anchoTexto + 56, 300);
  const panelH = 74;
  ctx.fillStyle = 'rgba(6, 8, 16, 0.82)';
  ctx.fillRect(worldW / 2 - panelW / 2, cy - 40, panelW, panelH);
  ctx.strokeStyle = 'rgba(62, 230, 196, 0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(worldW / 2 - panelW / 2, cy - 40, panelW, panelH);

  ctx.fillStyle = '#3ee6c4';
  ctx.fillText(texto, worldW / 2, cy - 8);

  ctx.font = '12px "Courier New", monospace';
  ctx.fillStyle = '#eaf6ff';
  ctx.fillText('tu nave estrenó su arma', worldW / 2, cy + 16);

  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.restore();
}

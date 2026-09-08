import type { GameState } from '../game/world';

export type ScreenMode = 'title' | 'playing' | 'gameover' | 'victory';

export function drawScreen(ctx: CanvasRenderingContext2D, state: GameState, mode: ScreenMode): void {
  if (mode === 'playing') return;

  ctx.save();
  ctx.fillStyle = 'rgba(6, 8, 16, 0.72)';
  ctx.fillRect(0, 0, state.worldW, state.worldH);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#eaf6ff';

  const cx = state.worldW / 2;
  const cy = state.worldH / 2;

  if (mode === 'title') {
    ctx.font = 'bold 34px "Courier New", monospace';
    ctx.fillStyle = '#3ee6c4';
    ctx.fillText('STAR VIPER 2000', cx, cy - 50);
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#eaf6ff';
    ctx.fillText('ENTER / toca la pantalla para empezar', cx, cy);
    ctx.fillText('Flechas o D-pad: mover  ·  FIRE: espacio  ·  MSL: M/X  ·  PWR: shift', cx, cy + 24);
  } else if (mode === 'gameover') {
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
    ctx.fillText('STAGE 1 CLEAR', cx, cy - 30);
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#eaf6ff';
    ctx.fillText(`SCORE ${state.score}`, cx, cy + 6);
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText('ENTER / toca la pantalla para reiniciar', cx, cy + 32);
  }

  ctx.textAlign = 'left';
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

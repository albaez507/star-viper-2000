import type { ScreenShake } from '../fx/shake';

export function applyShake(ctx: CanvasRenderingContext2D, shake: ScreenShake): void {
  const off = shake.offset();
  ctx.translate(off.x, off.y);
}

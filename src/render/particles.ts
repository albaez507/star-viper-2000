import type { ParticleSystem } from '../fx/particles';

export function drawParticles(ctx: CanvasRenderingContext2D, system: ParticleSystem): void {
  for (const p of system.active()) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

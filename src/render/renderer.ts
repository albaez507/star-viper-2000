import type { GameState } from '../game/world';
import type { Starfield } from './starfield';
import type { ParticleSystem } from '../fx/particles';
import type { ScreenShake } from '../fx/shake';
import { applyShake } from './camera';
import { drawPlayer, drawOption, drawEnemy, drawBoss, drawBossHealthBar, drawBullet, drawMissile, drawPowerCore } from './sprites';
import { drawParticles } from './particles';
import { drawHud } from './hud';
import { drawScreen, drawBossWarning, type ScreenMode } from './screens';

export class Renderer {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private starfield: Starfield,
    private particles: ParticleSystem,
    private shake: ScreenShake
  ) {}

  draw(state: GameState, mode: ScreenMode, elapsed: number): void {
    const ctx = this.ctx;
    const { worldW, worldH } = state;

    ctx.clearRect(0, 0, worldW, worldH);
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, worldW, worldH);

    ctx.save();
    applyShake(ctx, this.shake);

    this.starfield.draw(ctx);

    for (const c of state.powerCores.active()) drawPowerCore(ctx, c, elapsed);
    for (const e of state.enemies.active()) drawEnemy(ctx, e);
    if (state.boss.active) {
      drawBoss(ctx, state.boss);
      drawBossHealthBar(ctx, state.boss);
    }

    for (const o of state.options) drawOption(ctx, o);
    if (state.player.alive) drawPlayer(ctx, state.player);

    for (const b of state.playerBullets.active()) drawBullet(ctx, b);
    for (const b of state.enemyBullets.active()) drawBullet(ctx, b);
    for (const m of state.missiles.active()) drawMissile(ctx, m);

    drawParticles(ctx, this.particles);

    ctx.restore();

    if (state.player.hitFlash > 0.15) {
      ctx.fillStyle = `rgba(255, 84, 112, ${state.player.hitFlash * 0.5})`;
      ctx.fillRect(0, 0, worldW, worldH);
    }

    drawHud(ctx, state, elapsed);
    if (mode === 'playing') drawBossWarning(ctx, worldW, worldH, state.boss, elapsed);
    drawScreen(ctx, state, mode);
  }
}

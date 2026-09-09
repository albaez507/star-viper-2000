import type { GameState } from '../game/world';
import type { Starfield } from './starfield';
import type { ParticleSystem } from '../fx/particles';
import type { ScreenShake } from '../fx/shake';
import { applyShake } from './camera';
import { drawPlayer, drawOption, drawEnemy, drawBoss, drawBossHealthBar, drawBullet, drawMissile, drawPowerCore, drawItem } from './sprites';
import { drawParticles } from './particles';
import { drawHud } from './hud';
import { drawScreen, drawBossWarning, type ScreenMode } from './screens';
import { Sky } from './sky';
import { setSkyActive } from './sky-assets';
import { STAGES } from '../game/stages';

export class Renderer {
  readonly sky = new Sky();
  constructor(
    private ctx: CanvasRenderingContext2D,
    private starfield: Starfield,
    private particles: ParticleSystem,
    private shake: ScreenShake
  ) {}

  draw(state: GameState, mode: ScreenMode, elapsed: number): void {
    const ctx = this.ctx;
    const { worldW, worldH } = state;
    const sky = state.stageId === 'sky';
    // Las naves y los enemigos son los mismos vayas donde vayas: el atlas
    // sirve para cualquier sector, no solo para el cielo. Solo el FONDO
    // depende del stage.
    setSkyActive(true);
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';

    ctx.clearRect(0, 0, worldW, worldH);
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, worldW, worldH);

    ctx.save();
    applyShake(ctx, this.shake);

    if (sky) this.sky.draw(ctx, worldW, worldH, elapsed);
    else this.starfield.draw(ctx);

    for (const c of state.powerCores.active()) drawPowerCore(ctx, c, elapsed);
    for (const it of state.items.active()) drawItem(ctx, it);
    for (const e of state.enemies.active()) drawEnemy(ctx, e);
    if (state.boss.active) {
      drawBoss(ctx, state.boss);
      drawBossHealthBar(ctx, state.boss);
    }

    for (const o of state.options) drawOption(ctx, o);
    if (state.player.alive && mode !== 'title') drawPlayer(ctx, state.player);

    for (const b of state.playerBullets.active()) drawBullet(ctx, b);
    for (const b of state.enemyBullets.active()) drawBullet(ctx, b);
    for (const m of state.missiles.active()) drawMissile(ctx, m);

    drawParticles(ctx, this.particles);
    if (sky) this.sky.drawEffects(ctx, elapsed);

    ctx.restore();

    if (state.player.hitFlash > 0.15) {
      ctx.fillStyle = `rgba(255, 84, 112, ${state.player.hitFlash * 0.5})`;
      ctx.fillRect(0, 0, worldW, worldH);
    }

    if (mode === 'playing') drawHud(ctx, state, elapsed);
    if (mode === 'playing' && state.stageTime < 5) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, 5 - state.stageTime);
      ctx.fillStyle = 'rgba(20, 48, 68, .86)'; ctx.fillRect(worldW / 2 - 190, 82, 380, 55);
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff3cf'; ctx.font = 'bold 18px monospace';
      ctx.fillText(STAGES[state.stageId].name.toUpperCase(), worldW / 2, 106);
      ctx.font = '11px monospace'; ctx.fillStyle = '#b8e5da';
      ctx.fillText('Destruye formaciones completas para mejorar tu arma', worldW / 2, 124);
      ctx.restore();
    }
    if (mode === 'playing') drawBossWarning(ctx, worldW, worldH, state.boss, elapsed);
    drawScreen(ctx, state, mode);
  }
}

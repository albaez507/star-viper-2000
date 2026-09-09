import { drawSkySprite } from './sky-assets';

/** One 960×540 tile, nearest-neighbor from the painted source. */
export class Sky {
  private background = new Image();
  private tile: HTMLCanvasElement | null = null;
  private clouds: HTMLCanvasElement | null = null;
  private bursts: { x: number; y: number; t: number; size: number }[] = [];
  /** Desplazamiento acumulado propio. Antes el scroll salía de `elapsed`, así
   * que el fondo del cielo era inmune al "warp" de llegada del jefe: la
   * secuencia congelaba el juego y mostraba 警告 sobre un cielo quieto, y el
   * jefe parecía aparecer de la nada. */
  private scroll = 0;
  readonly ready: Promise<void>;

  constructor() {
    this.background.src = '/assets/sky/background.png';
    this.ready = this.background.decode().then(() => {
      this.tile = document.createElement('canvas');
      this.tile.width = 960;
      this.tile.height = 540;
      const ctx = this.tile.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.background, 0, 0, 960, 540);
      this.clouds = document.createElement('canvas');
      this.clouds.width = 960;
      this.clouds.height = 130;
      const cloudCtx = this.clouds.getContext('2d')!;
      cloudCtx.imageSmoothingEnabled = false;
      cloudCtx.drawImage(this.tile, 0, 410, 960, 130, 0, 0, 960, 130);
      cloudCtx.globalCompositeOperation = 'destination-in';
      const fade = cloudCtx.createLinearGradient(0, 0, 0, 80);
      fade.addColorStop(0, 'transparent'); fade.addColorStop(1, 'white');
      cloudCtx.fillStyle = fade; cloudCtx.fillRect(0, 0, 960, 130);
    });
  }

  /** `warp` > 1 durante la aproximación al jefe: el cielo pasa a toda
   * velocidad y se siente que eres tú quien llega hasta él. */
  update(dt: number, warp = 1): void {
    this.scroll += dt * warp;
  }

  burst(x: number, y: number, t: number, size = 44): void {
    this.bursts.push({ x, y, t, size });
    if (this.bursts.length > 60) this.bursts.shift();
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#83dce3'; ctx.fillRect(0, 0, w, h);
    if (this.tile) {
      const scroll = Math.round(this.scroll * 13);
      const first = Math.floor(scroll / w);
      for (let i = first; i <= first + 1; i++) {
        const x = i * w - scroll;
        ctx.save();
        ctx.translate(x + (i % 2 ? w : 0), 0);
        ctx.scale(i % 2 ? -1 : 1, 1);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.tile, 0, 0, w, h);
        ctx.restore();
      }
    }
    if (this.clouds) {
      const scroll = Math.round(this.scroll * 31);
      const first = Math.floor(scroll / w);
      ctx.globalAlpha = 0.7;
      for (let i = first; i <= first + 1; i++) {
        const x = i * w - scroll;
        ctx.save();
        ctx.translate(x + (i % 2 ? w : 0), h - 130);
        ctx.scale(i % 2 ? -1 : 1, 1);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.clouds, 0, 0, w, 130);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#f4ffeb'; ctx.globalAlpha = 0.55;
    for (let i = 0; i < 18; i++) {
      const x = ((i * 139 - t * (40 + i % 3 * 15)) % w + w) % w;
      const y = 92 + (i * 67 % (h - 170));
      ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 6, 2);
    }
    ctx.restore();
  }

  drawEffects(ctx: CanvasRenderingContext2D, t: number): void {
    this.bursts = this.bursts.filter(b => t - b.t < 0.42);
    for (const b of this.bursts) {
      const age = Math.max(0, (t - b.t) / 0.42);
      ctx.save(); ctx.globalAlpha = 1 - age;
      const size = Math.round(b.size * (0.5 + age));
      drawSkySprite(ctx, 'explosion', b.x, b.y, size, size);
      ctx.restore();
    }
  }
}

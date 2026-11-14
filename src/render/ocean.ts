import { drawSkySprite } from './sky-assets';

type Burst = { x: number; y: number; t: number; size: number };

/** A dedicated underwater scene: painted depth + moving water FX + a real
 * transparent foreground layer. It deliberately lives outside the game
 * simulation so the stage remains deterministic and easy to test. */
export class Ocean {
  private background = new Image();
  private foreground = new Image();
  private backTile: HTMLCanvasElement | null = null;
  private frontTile: HTMLCanvasElement | null = null;
  private scroll = 0;
  private bursts: Burst[] = [];
  readonly ready: Promise<void>;

  constructor() {
    this.background.src = `${import.meta.env.BASE_URL}assets/ocean/background.png`;
    this.foreground.src = `${import.meta.env.BASE_URL}assets/ocean/foreground.png`;
    this.ready = Promise.all([this.background.decode(), this.foreground.decode()]).then(() => {
      this.backTile = this.makeTile(this.background);
      this.frontTile = this.makeTile(this.foreground);
    });
  }

  private makeTile(image: HTMLImageElement): HTMLCanvasElement {
    const tile = document.createElement('canvas');
    tile.width = 960; tile.height = 540;
    const g = tile.getContext('2d')!;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(image, 0, 0, tile.width, tile.height);
    return tile;
  }

  update(dt: number, warp = 1): void { this.scroll += dt * warp; }

  burst(x: number, y: number, t: number, size = 52): void {
    this.bursts.push({ x, y, t, size });
    if (this.bursts.length > 60) this.bursts.shift();
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    ctx.save();
    ctx.fillStyle = '#062436'; ctx.fillRect(0, 0, w, h);
    if (this.backTile) {
      const scroll = (this.scroll * 9) % w;
      ctx.globalAlpha = 0.98;
      ctx.drawImage(this.backTile, -scroll, 0, w, h);
      ctx.drawImage(this.backTile, w - scroll, 0, w, h);
    }

    // Fine suspended silt and caustic streaks keep the scene alive between
    // encounters without competing with the sprites.
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 26; i++) {
      const x = ((i * 151 - this.scroll * (16 + i % 5 * 5)) % w + w) % w;
      const y = 82 + ((i * 47 + Math.sin(t * 0.7 + i) * 12) % (h - 150));
      ctx.globalAlpha = 0.16 + (i % 4) * 0.035;
      ctx.fillStyle = i % 3 === 0 ? '#9effee' : '#4bc6d4';
      ctx.fillRect(x, y, 2 + i % 3, 1);
    }
    for (let i = 0; i < 7; i++) {
      const x = ((i * 167 - this.scroll * 4) % w + w) % w;
      const top = 70 + i * 12;
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#b5fff4';
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + 26, h); ctx.lineTo(x + 55, h); ctx.lineTo(x + 17, top); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  drawForeground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.frontTile) return;
    ctx.save();
    ctx.globalAlpha = 0.94;
    const scroll = (this.scroll * 17) % w;
    ctx.drawImage(this.frontTile, -scroll, 0, w, h);
    ctx.drawImage(this.frontTile, w - scroll, 0, w, h);
    ctx.restore();
  }

  drawEffects(ctx: CanvasRenderingContext2D, t: number): void {
    this.bursts = this.bursts.filter((b) => t - b.t < 0.55);
    for (const b of this.bursts) {
      const age = Math.max(0, (t - b.t) / 0.55);
      ctx.save(); ctx.globalAlpha = 1 - age;
      ctx.strokeStyle = '#8efff1'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.size * (0.25 + age), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = (1 - age) * 0.75;
      drawSkySprite(ctx, 'explosion', b.x, b.y, b.size * (0.7 + age), b.size * (0.7 + age));
      ctx.restore();
    }
  }
}

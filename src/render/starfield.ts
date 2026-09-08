type Star = { x: number; y: number; speed: number; size: number; alpha: number };

type Layer = { stars: Star[]; speed: number; size: number; alpha: number };

export class Starfield {
  private layers: Layer[];
  private warp = 1;

  constructor(private w: number, private h: number) {
    this.layers = [
      this.makeLayer(90, 12, 1, 0.35),
      this.makeLayer(50, 34, 1, 0.65),
      this.makeLayer(25, 80, 2, 1.0),
    ];
  }

  private makeLayer(count: number, speed: number, size: number, alpha: number): Layer {
    const stars: Star[] = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        speed, size, alpha,
      });
    }
    return { stars, speed, size, alpha };
  }

  update(dt: number, warpMultiplier = 1): void {
    this.warp = warpMultiplier;
    for (const layer of this.layers) {
      for (const s of layer.stars) {
        s.x -= layer.speed * warpMultiplier * dt;
        if (s.x < 0) {
          s.x = this.w;
          s.y = Math.random() * this.h;
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#eaf6ff';
    const streak = this.warp > 1.5;
    for (const layer of this.layers) {
      ctx.globalAlpha = layer.alpha;
      for (const s of layer.stars) {
        if (streak) {
          ctx.fillRect(s.x, s.y, layer.size + layer.speed * 0.35, layer.size);
        } else {
          ctx.fillRect(s.x, s.y, layer.size, layer.size);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}

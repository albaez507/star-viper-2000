type Star = { x: number; y: number; speed: number; size: number; alpha: number };

type Layer = { stars: Star[]; speed: number; size: number; alpha: number };

export class Starfield {
  private layers: Layer[];

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

  update(dt: number): void {
    for (const layer of this.layers) {
      for (const s of layer.stars) {
        s.x -= layer.speed * dt;
        if (s.x < 0) {
          s.x = this.w;
          s.y = Math.random() * this.h;
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#eaf6ff';
    for (const layer of this.layers) {
      ctx.globalAlpha = layer.alpha;
      for (const s of layer.stars) {
        ctx.fillRect(s.x, s.y, layer.size, layer.size);
      }
    }
    ctx.globalAlpha = 1;
  }
}

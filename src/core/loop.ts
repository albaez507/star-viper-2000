const TICK = 1 / 60;
const MAX_FRAME = 0.25;

export type LoopCallbacks = {
  step: (dt: number) => void;
  render: (alpha: number) => void;
};

export class GameLoop {
  private acc = 0;
  private last = 0;
  private rafId = 0;
  private running = false;

  constructor(private cb: LoopCallbacks) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    const rawDelta = (now - this.last) / 1000;
    this.last = now;
    this.acc += Math.min(rawDelta, MAX_FRAME);

    while (this.acc >= TICK) {
      this.cb.step(TICK);
      this.acc -= TICK;
    }

    this.cb.render(this.acc / TICK);
    this.rafId = requestAnimationFrame(this.tick);
  };
}

export { TICK };

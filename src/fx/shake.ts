export class ScreenShake {
  private strength = 0;
  private timer = 0;
  private duration = 1;

  trigger(strength: number, duration: number): void {
    this.strength = Math.max(this.strength, strength);
    this.timer = duration;
    this.duration = duration;
  }

  update(dt: number): void {
    if (this.timer > 0) this.timer = Math.max(0, this.timer - dt);
  }

  offset(): { x: number; y: number } {
    if (this.timer <= 0) return { x: 0, y: 0 };
    const t = this.timer / this.duration;
    const mag = this.strength * t;
    return {
      x: (Math.random() * 2 - 1) * mag,
      y: (Math.random() * 2 - 1) * mag,
    };
  }
}

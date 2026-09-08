export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private unlocked = false;

  ensure(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  unlock(): void {
    if (this.unlocked) return;
    const ctx = this.ensure();
    if (ctx.state === 'suspended') void ctx.resume();
    this.unlocked = true;
  }

  get output(): GainNode {
    this.ensure();
    return this.master as GainNode;
  }

  get context(): AudioContext {
    return this.ensure();
  }
}

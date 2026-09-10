export class KeyboardSource {
  private keys = new Set<string>();

  constructor() {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  get up(): boolean { return this.keys.has('ArrowUp') || this.keys.has('KeyW'); }
  get down(): boolean { return this.keys.has('ArrowDown') || this.keys.has('KeyS'); }
  get left(): boolean { return this.keys.has('ArrowLeft') || this.keys.has('KeyA'); }
  get right(): boolean { return this.keys.has('ArrowRight') || this.keys.has('KeyD'); }
  get fire(): boolean { return this.keys.has('Space'); }
  get missile(): boolean {
    return this.keys.has('KeyM') || this.keys.has('KeyX') || this.keys.has('ControlLeft');
  }
  get power(): boolean { return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'); }
  get charge(): boolean { return this.keys.has('KeyZ'); }
  get dash(): boolean { return this.keys.has('KeyC') || this.keys.has('ShiftRight'); }
  get start(): boolean { return this.keys.has('Enter'); }
  get pauseToggle(): boolean { return this.keys.has('KeyP'); }
}

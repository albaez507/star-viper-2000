import { emptyInput, type InputFrame } from '../core/types';
import { KeyboardSource } from './keyboard';
import { TouchSource } from './touch';

export class InputManager {
  private keyboard = new KeyboardSource();
  private touch: TouchSource | null = null;

  private prevMissile = false;
  private prevPower = false;
  private prevStart = false;
  private prevPause = false;
  private tick = 0;

  attachTouch(dpadEl: HTMLElement, fireEl: HTMLElement, missileEl: HTMLElement): void {
    this.touch = new TouchSource(dpadEl, fireEl, missileEl);
  }

  sample(): InputFrame {
    const kb = this.keyboard;
    const t = this.touch;

    const up = kb.up || (t?.up ?? false);
    const down = kb.down || (t?.down ?? false);
    const left = kb.left || (t?.left ?? false);
    const right = kb.right || (t?.right ?? false);
    const fire = kb.fire || (t?.fire ?? false);
    const missileHeld = kb.missile || (t?.missile ?? false);
    const powerHeld = kb.power || (t?.power ?? false);

    const frame: InputFrame = emptyInput(this.tick++);
    frame.up = up;
    frame.down = down;
    frame.left = left;
    frame.right = right;
    frame.fire = fire;
    frame.missile = missileHeld && !this.prevMissile;
    frame.power = powerHeld && !this.prevPower;

    this.prevMissile = missileHeld;
    this.prevPower = powerHeld;

    return frame;
  }

  consumeStartPressed(): boolean {
    const held = this.keyboard.start;
    const pressed = held && !this.prevStart;
    this.prevStart = held;
    return pressed;
  }

  consumePausePressed(): boolean {
    const held = this.keyboard.pauseToggle;
    const pressed = held && !this.prevPause;
    this.prevPause = held;
    return pressed;
  }
}

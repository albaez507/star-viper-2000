import { emptyInput, type InputFrame } from '../core/types';
import { KeyboardSource } from './keyboard';
import { TouchSource } from './touch';
import { GamepadSource } from './gamepad';

export class InputManager {
  private keyboard = new KeyboardSource();
  private touch: TouchSource | null = null;
  private pad = new GamepadSource();

  private prevMissile = false;
  private prevDash = false;
  private prevPower = false;
  private prevStart = false;
  private prevPause = false;
  private tick = 0;

  attachTouch(dpadEl: HTMLElement, fireEl: HTMLElement, missileEl: HTMLElement): void {
    this.touch = new TouchSource(dpadEl, fireEl, missileEl);
  }

  /** Nombre del mando conectado, o null. Para avisar en pantalla. */
  get gamepadName(): string | null { return this.pad.connected; }

  sample(): InputFrame {
    // El mando no emite eventos: hay que preguntarle en cada frame.
    this.pad.update();
    const kb = this.keyboard;
    const t = this.touch;
    const g = this.pad;

    const up = kb.up || (t?.up ?? false) || g.up;
    const down = kb.down || (t?.down ?? false) || g.down;
    const left = kb.left || (t?.left ?? false) || g.left;
    const right = kb.right || (t?.right ?? false) || g.right;
    const fire = kb.fire || (t?.fire ?? false) || g.fire;
    const missileHeld = kb.missile || (t?.missile ?? false) || g.missile;
    const powerHeld = kb.power || (t?.power ?? false) || g.power;
    const dashHeld = kb.dash || g.dash || (t?.dash ?? false);

    const frame: InputFrame = emptyInput(this.tick++);
    frame.up = up;
    frame.down = down;
    frame.left = left;
    frame.right = right;
    frame.fire = fire;
    frame.missile = missileHeld && !this.prevMissile;
    frame.power = powerHeld && !this.prevPower;
    // Pulsación: mantener el botón no encadena dashes.
    frame.dash = dashHeld && !this.prevDash;

    this.prevMissile = missileHeld;
    this.prevPower = powerHeld;
    this.prevDash = dashHeld;

    return frame;
  }

  consumeStartPressed(): boolean {
    const held = this.keyboard.start || this.pad.start;
    const pressed = held && !this.prevStart;
    this.prevStart = held;
    return pressed;
  }

  consumePausePressed(): boolean {
    const held = this.keyboard.pauseToggle || this.pad.pauseToggle;
    const pressed = held && !this.prevPause;
    this.prevPause = held;
    return pressed;
  }
}

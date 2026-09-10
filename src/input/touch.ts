type DpadState = { up: boolean; down: boolean; left: boolean; right: boolean; power: boolean };

const DEAD_ZONE = 14;

/**
 * En el teléfono no caben seis botones, así que el dash es un GESTO: un
 * deslizamiento rápido sobre la cruceta. No roba sitio a nada y el dedo ya
 * está ahí.
 */
const DASH_DIST = 44;
const DASH_MS = 190;

export class TouchSource {
  private dpad: DpadState = { up: false, down: false, left: false, right: false, power: false };
  private firePressed = false;
  private missilePressed = false;

  private dpadPointers = new Map<number, HTMLElement>();
  /** Punto y momento en que cada dedo tocó, para medir el deslizamiento. */
  private swipeStart = new Map<number, { x: number; y: number; t: number }>();
  private dashPulse = false;

  constructor(
    dpadEl: HTMLElement,
    fireEl: HTMLElement,
    missileEl: HTMLElement
  ) {
    this.bindDpad(dpadEl);
    this.bindAction(fireEl, (v) => { this.firePressed = v; });
    this.bindAction(missileEl, (v) => { this.missilePressed = v; });
  }

  private bindDpad(dpadEl: HTMLElement): void {
    const update = (pointerId: number, clientX: number, clientY: number, active: boolean): void => {
      if (!active) {
        this.dpadPointers.delete(pointerId);
        this.recomputeDpad(dpadEl);
        return;
      }
      const rect = dpadEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;

      let zone: HTMLElement | null = null;
      const dist = Math.hypot(dx, dy);
      if (dist < DEAD_ZONE) {
        zone = dpadEl.querySelector('.dpad-pwr');
      } else if (Math.abs(dx) > Math.abs(dy)) {
        zone = dpadEl.querySelector(dx > 0 ? '#btn-right' : '#btn-left');
      } else {
        zone = dpadEl.querySelector(dy > 0 ? '#btn-down' : '#btn-up');
      }
      if (zone) this.dpadPointers.set(pointerId, zone);
      this.recomputeDpad(dpadEl);
    };

    dpadEl.addEventListener('pointerdown', (e) => {
      dpadEl.setPointerCapture(e.pointerId);
      this.swipeStart.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
      update(e.pointerId, e.clientX, e.clientY, true);
      e.preventDefault();
    });
    dpadEl.addEventListener('pointermove', (e) => {
      if (!this.dpadPointers.has(e.pointerId)) return;
      const inicio = this.swipeStart.get(e.pointerId);
      if (inicio) {
        const recorrido = Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y);
        if (recorrido > DASH_DIST && performance.now() - inicio.t < DASH_MS) {
          this.dashPulse = true;
          // Se consume el inicio: un deslizamiento largo es un dash, no diez.
          this.swipeStart.delete(e.pointerId);
        }
      }
      update(e.pointerId, e.clientX, e.clientY, true);
      e.preventDefault();
    });
    const release = (e: PointerEvent): void => {
      this.swipeStart.delete(e.pointerId);
      update(e.pointerId, e.clientX, e.clientY, false);
    };
    dpadEl.addEventListener('pointerup', release);
    dpadEl.addEventListener('pointercancel', release);
  }

  private recomputeDpad(dpadEl: HTMLElement): void {
    const active = new Set(this.dpadPointers.values());
    this.dpad = {
      up: active.has(dpadEl.querySelector('#btn-up') as HTMLElement),
      down: active.has(dpadEl.querySelector('#btn-down') as HTMLElement),
      left: active.has(dpadEl.querySelector('#btn-left') as HTMLElement),
      right: active.has(dpadEl.querySelector('#btn-right') as HTMLElement),
      power: active.has(dpadEl.querySelector('.dpad-pwr') as HTMLElement),
    };

    dpadEl.querySelectorAll<HTMLElement>('.dpad-btn').forEach((el) => {
      el.classList.toggle('active', active.has(el));
    });
  }

  private bindAction(el: HTMLElement, setter: (v: boolean) => void): void {
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      setter(true);
      el.classList.add('active');
      e.preventDefault();
    });
    const release = (): void => {
      setter(false);
      el.classList.remove('active');
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', (e) => {
      if (e.pressure === 0) release();
    });
  }

  get up(): boolean { return this.dpad.up; }
  get down(): boolean { return this.dpad.down; }
  get left(): boolean { return this.dpad.left; }
  get right(): boolean { return this.dpad.right; }
  get power(): boolean { return this.dpad.power; }
  get fire(): boolean { return this.firePressed; }
  get missile(): boolean { return this.missilePressed; }
  /** Se consume al leerlo: un gesto = un dash, no uno por frame. */
  get dash(): boolean {
    const v = this.dashPulse;
    this.dashPulse = false;
    return v;
  }
}

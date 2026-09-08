import type { Vec2 } from '../core/types';

const CAPACITY = 120;

export class PositionHistory {
  private buf: Vec2[] = [];
  private head = 0;

  constructor() {
    for (let i = 0; i < CAPACITY; i++) this.buf.push({ x: 0, y: 0 });
  }

  push(x: number, y: number): void {
    this.buf[this.head].x = x;
    this.buf[this.head].y = y;
    this.head = (this.head + 1) % CAPACITY;
  }

  at(delaySteps: number): Vec2 {
    const i = (this.head - 1 - delaySteps + CAPACITY * 4) % CAPACITY;
    return this.buf[i];
  }
}

export const HISTORY_CAPACITY = CAPACITY;

export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }

  next(): number {
    let x = this.state;
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    this.state = x;
    return x / 0xffffffff;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  pick<T>(items: T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }
}

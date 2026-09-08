export class Pool<T extends { active: boolean }> {
  private items: T[] = [];
  private factory: () => T;

  constructor(factory: () => T, initialSize = 32) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      const item = factory();
      item.active = false;
      this.items.push(item);
    }
  }

  acquire(): T {
    for (const item of this.items) {
      if (!item.active) {
        item.active = true;
        return item;
      }
    }
    const item = this.factory();
    item.active = true;
    this.items.push(item);
    return item;
  }

  all(): T[] {
    return this.items;
  }

  active(): T[] {
    return this.items.filter((i) => i.active);
  }

  releaseAll(): void {
    for (const item of this.items) item.active = false;
  }
}

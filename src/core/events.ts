export type GameEvent =
  | { type: 'fire'; weapon: 'single' | 'double' | 'laser' }
  | { type: 'missileFire' }
  | { type: 'missileImpact'; x: number; y: number }
  | { type: 'hit'; x: number; y: number }
  | { type: 'enemyDeath'; x: number; y: number }
  | { type: 'coreCollected'; slot: number }
  | { type: 'weaponActivated'; nombre: string }
  | { type: 'itemCollected'; x: number; y: number }
  | { type: 'playerDamage' }
  | { type: 'playerDeath' }
  | { type: 'dash'; x: number; y: number }
  | { type: 'bossDeath'; x: number; y: number }
  | { type: 'bossEnrage'; x: number; y: number }
  | { type: 'shake'; strength: number; duration: number };

export class EventBus {
  private queue: GameEvent[] = [];

  emit(e: GameEvent): void {
    this.queue.push(e);
  }

  drain(): GameEvent[] {
    const q = this.queue;
    this.queue = [];
    return q;
  }
}

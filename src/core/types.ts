export type Vec2 = { x: number; y: number };

export type Rect = { x: number; y: number; w: number; h: number };

export type InputFrame = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
  missile: boolean;
  power: boolean;
  tick: number;
};

export function emptyInput(tick: number): InputFrame {
  return { up: false, down: false, left: false, right: false, fire: false, missile: false, power: false, tick };
}

export type EntityId = number;

export type BehaviorName = 'scout' | 'sine' | 'diver' | 'formation' | 'swarm' | 'harasser' | 'rival';

export type Weapon = 'single' | 'double' | 'laser';

export type PowerSlot = 'speed' | 'missile' | 'double' | 'laser' | 'option' | 'shield';

export const POWER_SLOTS: PowerSlot[] = ['speed', 'missile', 'double', 'laser', 'option', 'shield'];

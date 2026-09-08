import type { BehaviorName } from '../core/types';

export type Enemy = {
  id: number;
  x: number; y: number;
  baseY: number;
  vx: number; vy: number;
  hp: number;
  maxHp: number;
  behavior: BehaviorName;
  t: number;
  hitFlash: number;
  fireCooldown: number;
  score: number;
  halfW: number;
  halfH: number;
  formationId: number;
  triggerX: number;
  diving: boolean;
  divingVx: number;
  divingVy: number;
  active: boolean;
};

export function makeEnemy(): Enemy {
  return {
    id: 0, x: 0, y: 0, baseY: 0, vx: -60, vy: 0,
    hp: 1, maxHp: 1, behavior: 'scout', t: 0, hitFlash: 0,
    fireCooldown: 0, score: 100, halfW: 8, halfH: 8,
    formationId: -1, triggerX: 0, diving: false, divingVx: 0, divingVy: 0,
    active: false,
  };
}

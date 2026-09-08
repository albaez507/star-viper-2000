import type { Enemy } from '../enemy';
import { scout } from './scout';
import { sine } from './sine';
import { diver } from './diver';
import { formation } from './formation';

export type BehaviorContext = { playerX: number; playerY: number };

export const behaviors: Record<string, (e: Enemy, dt: number, ctx: BehaviorContext) => void> = {
  scout: (e, dt) => scout(e, dt),
  sine: (e, dt) => sine(e, dt),
  diver: (e, dt, ctx) => diver(e, dt, ctx.playerX, ctx.playerY),
  formation: (e, dt) => formation(e, dt),
};

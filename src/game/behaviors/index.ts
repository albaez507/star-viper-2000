import type { Enemy } from '../enemy';
import { scout } from './scout';
import { sine } from './sine';
import { diver } from './diver';
import { formation } from './formation';
import { swarm } from './swarm';
import { harasser } from './harasser';
import { rival } from './rival';
import { hazard } from './hazard';
import { column } from './column';
import { arc } from './arc';

export type BehaviorContext = { playerX: number; playerY: number };

export const behaviors: Record<string, (e: Enemy, dt: number, ctx: BehaviorContext) => void> = {
  scout: (e, dt) => scout(e, dt),
  sine: (e, dt) => sine(e, dt),
  diver: (e, dt, ctx) => diver(e, dt, ctx.playerX, ctx.playerY),
  formation: (e, dt) => formation(e, dt),
  swarm: (e, dt, ctx) => swarm(e, dt, ctx.playerX, ctx.playerY),
  harasser: (e, dt, ctx) => harasser(e, dt, ctx.playerX, ctx.playerY),
  rival: (e, dt, ctx) => rival(e, dt, ctx.playerX, ctx.playerY),
  hazard: (e, dt) => hazard(e, dt),
  column: (e, dt, ctx) => column(e, dt, ctx.playerY),
  arc: (e, dt) => arc(e, dt),
};

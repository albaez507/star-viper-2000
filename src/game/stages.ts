import { STAGE_1, type StageEvent } from './stage1';

export type StageId = 'orbit' | 'sky';
export const SKY_STAGE: StageEvent[] = [
  { t: 2, kind: 'scout', count: 4 },
  { t: 7, kind: 'formation', count: 6, shape: 'line' },
  { t: 16, kind: 'sine', count: 4 },
  { t: 23, kind: 'formation', count: 6, shape: 'v' },
  { t: 30, kind: 'harasser', count: 1 },
  { t: 36, kind: 'diver', count: 3 },
  { t: 43, kind: 'formation', count: 6, shape: 'column' },
  { t: 51, kind: 'rival', count: 1 },
  { t: 62, kind: 'formation', count: 6, shape: 'line' },
  { t: 69, kind: 'sine', count: 5 },
  { t: 75, kind: 'harasser', count: 1 },
  { t: 81, kind: 'formation', count: 6, shape: 'v' },
  { t: 89, kind: 'swarm', count: 12 },
  { t: 104, boss: 'sentinel' },
];

export const STAGES: Record<StageId, { name: string; subtitle: string; boss: string; events: StageEvent[] }> = {
  orbit: { name: 'Órbita Sentinel', subtitle: 'Sector 01 · espacio profundo', boss: 'SENTINEL', events: STAGE_1 },
  sky: { name: 'Jardines del Céfiro', subtitle: 'Sector 02 · archipiélago celeste', boss: 'GUARDIÁN DEL CÉFIRO', events: SKY_STAGE },
};

export function stageId(value: string | null): StageId { return value === 'orbit' ? 'orbit' : 'sky'; }

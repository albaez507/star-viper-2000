import { STAGE_1, type StageEvent } from './stage1';

export type StageId = 'orbit' | 'sky';
export const SKY_STAGE: StageEvent[] = [
  { t: 2, kind: 'scout', count: 4 },
  // Primer obstáculo solo, sin enemigos encima: la primera vez que ves una
  // roca tienes que poder dispararle, ver que no pasa nada y esquivarla sin
  // que además te estén disparando.
  { t: 6, kind: 'hazard', count: 2 },
  { t: 12, kind: 'formation', count: 6, shape: 'line' },
  { t: 20, kind: 'sine', count: 4 },
  { t: 23, kind: 'formation', count: 6, shape: 'v' },
  // Primera fila que frena y se alinea contigo. Va sola para que se lea el
  // frenazo, que es lo que hace que parezca que están decidiendo.
  { t: 26, kind: 'column', count: 4 },
  { t: 30, kind: 'harasser', count: 1 },
  // Arco: la mitad entran por arriba y la mitad por abajo, y se cruzan.
  { t: 33, kind: 'arc', count: 6 },
  { t: 36, kind: 'diver', count: 3 },
  // Ahora sí: obstáculos mezclados con enemigos, y ya con los móviles.
  { t: 40, kind: 'hazard', count: 4 },
  { t: 43, kind: 'formation', count: 6, shape: 'column' },
  { t: 51, kind: 'rival', count: 1 },
  { t: 62, kind: 'formation', count: 6, shape: 'line' },
  // Ya mezclados: el arco cruza mientras la fila se te alinea.
  { t: 66, kind: 'arc', count: 8 },
  { t: 68, kind: 'column', count: 5 },
  { t: 69, kind: 'sine', count: 5 },
  { t: 72, kind: 'hazard', count: 5 },
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

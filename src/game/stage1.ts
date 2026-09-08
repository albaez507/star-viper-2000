export type WaveSpawn = {
  t: number;
  kind: 'scout' | 'sine' | 'diver' | 'formation';
  count: number;
  shape?: 'v' | 'column' | 'line';
};

export type BossSpawn = { t: number; boss: 'sentinel' };

export type StageEvent = WaveSpawn | BossSpawn;

export function isBossSpawn(e: StageEvent): e is BossSpawn {
  return 'boss' in e;
}

// 6 formaciones (antes 4) repartidas cada ~14s. Con solo 4, llegar a LASER
// exigía limpiar perfectamente TODAS las formaciones del stage sin fallar
// una sola vez -- prácticamente inalcanzable en una partida real, aunque el
// mecanismo del medidor funcionaba bien (verificado). Con 6, DOUBLE (3
// cores) es alcanzable para un jugador que juega bien, y LASER (4 cores) ya
// no exige perfección absoluta.
export const STAGE_1: StageEvent[] = [
  { t: 2.0, kind: 'scout', count: 5 },
  { t: 8.0, kind: 'formation', count: 6, shape: 'v' },
  { t: 16.0, kind: 'sine', count: 4 },
  { t: 22.0, kind: 'formation', count: 6, shape: 'column' },
  { t: 30.0, kind: 'diver', count: 3 },
  { t: 36.0, kind: 'formation', count: 6, shape: 'line' },
  { t: 44.0, kind: 'scout', count: 6 },
  { t: 50.0, kind: 'formation', count: 6, shape: 'v' },
  { t: 58.0, kind: 'sine', count: 5 },
  { t: 64.0, kind: 'formation', count: 6, shape: 'column' },
  { t: 72.0, kind: 'diver', count: 4 },
  { t: 78.0, kind: 'formation', count: 6, shape: 'line' },
  { t: 86.0, kind: 'scout', count: 8 },
  { t: 90.0, boss: 'sentinel' },
];

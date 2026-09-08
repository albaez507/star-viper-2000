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

export const STAGE_1: StageEvent[] = [
  { t: 2.0, kind: 'scout', count: 5 },
  { t: 8.0, kind: 'sine', count: 4 },
  { t: 14.0, kind: 'formation', count: 6, shape: 'v' },
  { t: 22.0, kind: 'diver', count: 3 },
  { t: 28.0, kind: 'scout', count: 6 },
  { t: 34.0, kind: 'formation', count: 6, shape: 'column' },
  { t: 42.0, kind: 'sine', count: 5 },
  { t: 48.0, kind: 'diver', count: 4 },
  { t: 54.0, kind: 'formation', count: 6, shape: 'line' },
  { t: 62.0, kind: 'scout', count: 8 },
  { t: 70.0, kind: 'sine', count: 6 },
  { t: 78.0, kind: 'formation', count: 6, shape: 'v' },
  { t: 90.0, boss: 'sentinel' },
];

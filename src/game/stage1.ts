export type WaveSpawn = {
  t: number;
  kind: 'scout' | 'sine' | 'diver' | 'formation' | 'swarm' | 'harasser' | 'rival' | 'hazard' | 'column' | 'arc';
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
  { t: 28.0, kind: 'harasser', count: 1 },
  { t: 34.0, kind: 'diver', count: 3 },
  { t: 40.0, kind: 'formation', count: 6, shape: 'line' },
  { t: 46.0, kind: 'scout', count: 6 },
  { t: 52.0, kind: 'formation', count: 6, shape: 'v' },
  // Mini-jefe a mitad de stage. NO pegado al jefe final: dos set-pieces
  // seguidos le quitan impacto al jefe.
  { t: 58.0, kind: 'rival', count: 1 },
  { t: 68.0, kind: 'formation', count: 6, shape: 'column' },
  { t: 74.0, kind: 'harasser', count: 1 },
  { t: 78.0, kind: 'sine', count: 5 },
  { t: 84.0, kind: 'diver', count: 4 },
  { t: 90.0, kind: 'formation', count: 6, shape: 'line' },
  // Enjambre: el crescendo justo antes del jefe. NO suelta Power Core a
  // propósito — es un gauntlet de supervivencia, y darle core diluiría el
  // lenguaje establecido de "formación de 6 = core".
  { t: 96.0, kind: 'swarm', count: 12 },
  { t: 112.0, boss: 'sentinel' },
];

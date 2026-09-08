export type Formation = {
  id: number;
  total: number;
  killed: number;
  escaped: number;
  failed: boolean;
  rewarded: boolean;
  lastDeathX: number;
  lastDeathY: number;
};

export function createFormation(id: number, total: number): Formation {
  return { id, total, killed: 0, escaped: 0, failed: false, rewarded: false, lastDeathX: 0, lastDeathY: 0 };
}

export function registerKill(f: Formation, x: number, y: number): boolean {
  f.killed++;
  f.lastDeathX = x;
  f.lastDeathY = y;
  return !f.failed && f.killed === f.total;
}

export function registerEscape(f: Formation): void {
  f.escaped++;
  f.failed = true;
}

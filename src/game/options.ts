import type { PositionHistory } from './history';

export type Option = {
  x: number;
  y: number;
  delaySteps: number;
  active: boolean;
};

export const OPTION_DELAYS = [18, 36];

export function createOptions(): Option[] {
  return OPTION_DELAYS.map((delaySteps) => ({ x: 0, y: 0, delaySteps, active: false }));
}

export function updateOptions(options: Option[], count: number, history: PositionHistory): void {
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    opt.active = i < count;
    if (!opt.active) continue;
    const pos = history.at(opt.delaySteps);
    opt.x = pos.x;
    opt.y = pos.y;
  }
}

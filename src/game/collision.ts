import { aabbOverlap } from '../core/math';

export function hits(
  ax: number, ay: number, ahw: number, ahh: number,
  bx: number, by: number, bhw: number, bhh: number
): boolean {
  return aabbOverlap(ax - ahw, ay - ahh, ahw * 2, ahh * 2, bx - bhw, by - bhh, bhw * 2, bhh * 2);
}

import { POWER_SLOTS } from '../core/types';
import type { Player } from './player';

export type PowerMeter = {
  cursor: number;
  filled: number;
};

export function createPowerMeter(): PowerMeter {
  return { cursor: 0, filled: 0 };
}

export function advanceCursor(meter: PowerMeter): void {
  meter.filled = Math.min(meter.filled + 1, POWER_SLOTS.length);
  meter.cursor = meter.filled - 1;
}

export function activateSlot(meter: PowerMeter, player: Player): boolean {
  if (meter.filled <= 0) return false;
  const slot = POWER_SLOTS[meter.cursor];
  applySlot(slot, player);
  meter.cursor = 0;
  meter.filled = 0;
  return true;
}

function applySlot(slot: string, player: Player): void {
  switch (slot) {
    case 'speed':
      player.speedLevel = Math.min(player.speedLevel + 1, 4);
      break;
    case 'missile':
      player.missileLevel = Math.min(player.missileLevel + 1, 2);
      break;
    case 'double':
      player.weapon = 'double';
      break;
    case 'laser':
      player.weapon = 'laser';
      break;
    case 'option':
      player.optionCount = Math.min(player.optionCount + 1, 2);
      break;
    case 'shield':
      player.shield = player.shieldMax;
      break;
  }
}

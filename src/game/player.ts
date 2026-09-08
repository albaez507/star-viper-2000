import type { Weapon } from '../core/types';
import { clamp } from '../core/math';

export const PLAYER_BASE_SPEED = 220;
export const PLAYER_HALF_W = 15;
export const PLAYER_HALF_H = 10;
export const FIRE_COOLDOWN = 0.14;
export const MISSILE_COOLDOWN_BASE = 1.4;
export const INVULN_TIME = 1.5;
export const SHIELD_MAX = 3;

const WEAPON_FIRE_COOLDOWN: Record<Weapon, number> = {
  single: 0.14,
  double: 0.16,
  laser: 0.22,
};

export function fireCooldownFor(weapon: Weapon): number {
  return WEAPON_FIRE_COOLDOWN[weapon];
}

export type Player = {
  x: number;
  y: number;
  speedLevel: number;
  weapon: Weapon;
  fireCooldown: number;
  missileCooldown: number;
  missileLevel: number;
  optionCount: number;
  shield: number;
  shieldMax: number;
  invulnTimer: number;
  alive: boolean;
  lives: number;
  hitFlash: number;
};

export function createPlayer(x: number, y: number): Player {
  return {
    x, y,
    speedLevel: 0,
    weapon: 'single',
    fireCooldown: 0,
    missileCooldown: 0,
    missileLevel: 0,
    optionCount: 0,
    shield: 0,
    shieldMax: SHIELD_MAX,
    invulnTimer: 0,
    alive: true,
    lives: 3,
    hitFlash: 0,
  };
}

export function playerSpeed(p: Player): number {
  return PLAYER_BASE_SPEED * (1 + p.speedLevel * 0.18);
}

export function movePlayer(
  p: Player,
  dx: number,
  dy: number,
  dt: number,
  bounds: { w: number; h: number }
): void {
  const s = playerSpeed(p);
  p.x = clamp(p.x + dx * s * dt, PLAYER_HALF_W + 4, bounds.w - PLAYER_HALF_W - 4);
  p.y = clamp(p.y + dy * s * dt, PLAYER_HALF_H + 4, bounds.h - PLAYER_HALF_H - 4);
}

export function missileCooldownFor(p: Player): number {
  return MISSILE_COOLDOWN_BASE - p.missileLevel * 0.5;
}

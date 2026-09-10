import { clamp } from '../core/math';
import { SHIPS, fireCooldownFor as cadenciaDe, type ShipId, type WeaponLevel } from './weapons';

export const PLAYER_BASE_SPEED = 220;
export const PLAYER_HALF_W = 15;
export const PLAYER_HALF_H = 10;
export const FIRE_COOLDOWN = 0.14;
/**
 * 1.4 s hacía que el misil fuese un segundo botón de disparo, no un recurso:
 * salía tan seguido que no había nada que decidir. Con 5 s hay que elegir el
 * momento, y por eso puede pegar mucho más fuerte.
 */
export const MISSILE_COOLDOWN_BASE = 5.0;
export const INVULN_TIME = 1.5;
export const SHIELD_MAX = 3;

/**
 * El dash da VELOCIDAD, no inmunidad.
 *
 * Es la decisión que define la mecánica: con inmunidad, la respuesta a todo
 * el juego pasa a ser dashear y los obstáculos dejan de existir. Sin ella,
 * te saca de la trayectoria de una bala pero no te deja atravesar una roca,
 * así que hay que dashear HACIA un hueco -- que es donde está la habilidad.
 */
export const DASH_SPEED_MULT = 3.5;
export const DASH_TIME = 0.16;
export const DASH_COOLDOWN = 0.7;

/**
 * Disparo cargado.
 *
 * Mantener el botón carga; soltarlo dispara lo acumulado. Mientras cargas no
 * salen balitas: ese es el precio, y es lo que impide que cargar sea gratis
 * y por tanto siempre mejor.
 *
 * Se suelta PROPORCIONAL a lo cargado, no en dos escalones: así soltar antes
 * de tiempo por nervios no te deja sin nada, solo con menos. Por debajo del
 * mínimo no sale nada, para que un roce del botón no cuente como disparo.
 */
export const CHARGE_TIME = 0.9;
export const CHARGE_MIN_RATIO = 0.28;
export const CHARGE_DMG_MIN = 2;
export const CHARGE_DMG_MAX = 8;

export function fireCooldownFor(ship: ShipId, level: WeaponLevel): number {
  return cadenciaDe(ship, level);
}

export type Player = {
  x: number;
  y: number;
  speedLevel: number;
  ship: ShipId;
  weaponLevel: WeaponLevel;
  /** Cores recogidos en esta partida. El nivel se deriva de aquí. */
  cores: number;
  fireCooldown: number;
  missileCooldown: number;
  /** Segundos acumulados de carga. 0 = no está cargando. */
  chargeTimer: number;
  /** Segundos que queda de dash. >0 = dasheando: no puedes disparar. */
  dashTimer: number;
  dashCooldown: number;
  /** Dirección congelada al arrancar: el dash no se corrige a media carrera. */
  dashDX: number;
  dashDY: number;
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
    ship: 'vulcan',
    weaponLevel: 0,
    cores: 0,
    fireCooldown: 0,
    missileCooldown: 0,
    missileLevel: 0,
    chargeTimer: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashDX: 0,
    dashDY: 0,
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
  return PLAYER_BASE_SPEED * SHIPS[p.ship].velocidad * (1 + p.speedLevel * 0.18);
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

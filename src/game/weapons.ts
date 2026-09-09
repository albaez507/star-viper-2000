/**
 * Armas y naves.
 *
 * Reemplaza al medidor de poder. La regla es simple y no hace falta
 * aprendérsela: empiezas con el arma básica, el primer Power Core **activa el
 * arma característica de tu nave**, y cada core siguiente la sube de nivel.
 * No hay cursor, no hay que decidir cuándo gastar, no hay botón que pulsar.
 *
 * Ver `docs/ARMAS.md` para el porqué del cambio.
 */

export type ShipId = 'vulcan' | 'lance';

/** 0 = arma básica (sin core todavía). 1-3 = arma característica por nivel. */
export type WeaponLevel = 0 | 1 | 2 | 3;

export const MAX_WEAPON_LEVEL: WeaponLevel = 3;

export type ShipDef = {
  id: ShipId;
  nombre: string;
  armaNombre: string;
  /** Descripción corta del trade-off, para la UI. */
  rasgo: string;
  /** Multiplicador sobre la velocidad base de la nave. */
  velocidad: number;
  vidasIniciales: number;
};

export const SHIPS: Record<ShipId, ShipDef> = {
  vulcan: {
    id: 'vulcan',
    nombre: 'VULCAN',
    armaNombre: 'RÁFAGA',
    rasgo: 'Equilibrada. Cadencia alta, daño bajo por disparo.',
    velocidad: 1,
    vidasIniciales: 3,
  },
  lance: {
    id: 'lance',
    nombre: 'LANCE',
    armaNombre: 'BUSCADOR',
    rasgo: 'Rápida y frágil. Los proyectiles persiguen, pero dispara poco.',
    velocidad: 1.18,
    vidasIniciales: 2,
  },
};

export const SHIP_ORDER: ShipId[] = ['vulcan', 'lance'];

/** Cadencia en segundos. El arma básica es igual para todos. */
export function fireCooldownFor(ship: ShipId, level: WeaponLevel): number {
  if (level === 0) return 0.14;
  if (ship === 'vulcan') return 0.09;
  return 0.34; // lance dispara poco, pero no falla
}

export type DisparoSpec = {
  /** Desplazamiento vertical respecto a la nave. */
  offsetY: number;
  vx: number;
  vy: number;
  dmg: number;
  homing: boolean;
};

/**
 * Qué proyectiles salen de un disparo, según nave y nivel.
 * El nivel se nota en **cantidad de proyectiles en pantalla**, que es lo que
 * se lee de un vistazo — no en un número escondido.
 */
export function disparosDe(ship: ShipId, level: WeaponLevel): DisparoSpec[] {
  if (level === 0) {
    return [{ offsetY: 0, vx: 560, vy: 0, dmg: 1, homing: false }];
  }

  if (ship === 'vulcan') {
    if (level === 1) return [{ offsetY: 0, vx: 640, vy: 0, dmg: 1, homing: false }];
    if (level === 2) {
      return [
        { offsetY: -6, vx: 640, vy: 0, dmg: 1, homing: false },
        { offsetY: 6, vx: 640, vy: 0, dmg: 1, homing: false },
      ];
    }
    return [
      { offsetY: -8, vx: 640, vy: -70, dmg: 1, homing: false },
      { offsetY: 0, vx: 640, vy: 0, dmg: 1, homing: false },
      { offsetY: 8, vx: 640, vy: 70, dmg: 1, homing: false },
    ];
  }

  // lance: buscadores, pocos y caros de fallar
  const n = level;
  const specs: DisparoSpec[] = [];
  for (let i = 0; i < n; i++) {
    specs.push({
      offsetY: (i - (n - 1) / 2) * 12,
      vx: 380,
      vy: 0,
      dmg: 2,
      homing: true,
    });
  }
  return specs;
}

/** Options que acompañan al nivel de arma. Subir de arma también engorda tu
 * escolta, así que cada core se nota dos veces. */
export function optionsPara(level: WeaponLevel): number {
  if (level >= 3) return 2;
  if (level >= 2) return 1;
  return 0;
}

export function nombreArma(ship: ShipId, level: WeaponLevel): string {
  if (level === 0) return 'BÁSICA';
  return `${SHIPS[ship].armaNombre} ${level}`;
}

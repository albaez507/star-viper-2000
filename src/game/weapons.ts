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

export type ShipId = 'vulcan' | 'lance' | 'pyre' | 'aegis';

/** 0 = arma básica (sin core todavía). 1-3 = arma característica por nivel. */
export type WeaponLevel = 0 | 1 | 2 | 3;

export const MAX_WEAPON_LEVEL: WeaponLevel = 3;

/**
 * Cuántos Power Cores cuesta cada nivel, acumulado.
 *
 * El primero sigue costando **uno solo**: activar el arma de tu nave es el
 * momento que engancha y no se debe hacer esperar. A partir de ahí cada nivel
 * cuesta dos, así que subir al máximo exige las cinco formaciones perfectas
 * de un sector. Antes bastaban tres cores y llegabas al tope a mitad de nivel,
 * con la otra mitad sin nada que ganar — de ahí que ganar se sintiera fácil.
 */
export const CORES_POR_NIVEL = [1, 3, 5];

export function nivelPorCores(cores: number): WeaponLevel {
  let nivel: WeaponLevel = 0;
  for (let i = 0; i < CORES_POR_NIVEL.length; i++) {
    if (cores >= CORES_POR_NIVEL[i]) nivel = (i + 1) as WeaponLevel;
  }
  return nivel;
}

/** Cores necesarios para volver a tener exactamente ese nivel. */
export function coresParaNivel(nivel: WeaponLevel): number {
  return nivel <= 0 ? 0 : CORES_POR_NIVEL[nivel - 1];
}

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
    armaNombre: 'LANZA',
    rasgo: 'Rápida y frágil. Sus disparos atraviesan, pero dispara poco.',
    velocidad: 1.18,
    vidasIniciales: 2,
  },
  pyre: {
    id: 'pyre',
    nombre: 'PYRE',
    armaNombre: 'CINDER',
    rasgo: 'Agresiva. Ráfaga frontal y aceleración alta, pero frágil.',
    velocidad: 1.06,
    vidasIniciales: 2,
  },
  aegis: {
    id: 'aegis',
    nombre: 'AEGIS',
    armaNombre: 'PULSE',
    rasgo: 'Pesada. Disparo ancho y resistente, pero más lenta.',
    velocidad: 0.88,
    vidasIniciales: 4,
  },
};

/**
 * Solo las dos naves originales, por decisión del usuario (2026-09-10).
 *
 * `pyre` y `aegis` siguen definidas más arriba pero NO se ofrecen: sacarlas
 * de aquí las quita del menú y además hace que una nave guardada en
 * localStorage que ya no esté en la lista caiga a VULCAN, así que nadie se
 * queda atrapado en una nave que ya no existe.
 */
export const SHIP_ORDER: ShipId[] = ['vulcan', 'lance'];

/**
 * Cadencia en segundos.
 *
 * El arma básica es **deliberadamente sosa y lenta**: es el estado del que
 * quieres salir. Si se parece al arma característica, activar la tuya no se
 * siente como nada — que es exactamente el error que tenía esto antes.
 */
export function fireCooldownFor(ship: ShipId, level: WeaponLevel): number {
  if (level === 0) return 0.22;
  if (ship === 'vulcan') return level >= 3 ? 0.10 : level === 2 ? 0.12 : 0.14;
  if (ship === 'pyre') return level >= 3 ? 0.11 : level === 2 ? 0.13 : 0.15;
  if (ship === 'aegis') return level >= 3 ? 0.22 : level === 2 ? 0.25 : 0.28;
  return level >= 3 ? 0.36 : 0.38;
}

export type DisparoSpec = {
  /** Desplazamiento vertical respecto a la nave. */
  offsetY: number;
  vx: number;
  vy: number;
  dmg: number;
  homing: boolean;
  /** Atraviesa al enemigo en vez de apagarse en el primero. */
  pierce: boolean;
};

/**
 * Qué proyectiles salen de un disparo, según nave y nivel.
 * El nivel se nota en **cantidad de proyectiles en pantalla**, que es lo que
 * se lee de un vistazo — no en un número escondido.
 */
export function disparosDe(ship: ShipId, level: WeaponLevel): DisparoSpec[] {
  // Básica: una bala lenta y sola. Tiene que verse pobre al lado de la tuya.
  if (level === 0) {
    return [{ offsetY: 0, vx: 500, vy: 0, dmg: 1, homing: false, pierce: false }];
  }

  if (ship === 'vulcan') {
    if (level === 1) {
      return [
        { offsetY: -5, vx: 620, vy: 0, dmg: 1, homing: false, pierce: false },
        { offsetY: 5, vx: 620, vy: 0, dmg: 1, homing: false, pierce: false },
      ];
    }
    return [
      { offsetY: -8, vx: 620, vy: 0, dmg: 1, homing: false, pierce: false },
      { offsetY: 0, vx: 620, vy: 0, dmg: 1, homing: false, pierce: false },
      { offsetY: 8, vx: 620, vy: 0, dmg: 1, homing: false, pierce: false },
    ];
  }

  if (ship === 'pyre') {
    if (level === 1) {
      return [
        { offsetY: -5, vx: 680, vy: 0, dmg: 1, homing: false, pierce: false },
        { offsetY: 5, vx: 680, vy: 0, dmg: 1, homing: false, pierce: false },
      ];
    }
    return [
      { offsetY: -9, vx: 700, vy: 0, dmg: 1, homing: false, pierce: false },
      { offsetY: 0, vx: 720, vy: 0, dmg: 1, homing: false, pierce: false },
      { offsetY: 9, vx: 700, vy: 0, dmg: 1, homing: false, pierce: false },
    ];
  }

  if (ship === 'aegis') {
    if (level === 1) {
      return [{ offsetY: 0, vx: 440, vy: 0, dmg: 2, homing: false, pierce: true }];
    }
    const damage = level >= 3 ? 2 : 1;
    return [
      { offsetY: -5, vx: 470, vy: -45, dmg: damage, homing: false, pierce: true },
      { offsetY: 0, vx: 500, vy: 0, dmg: damage, homing: false, pierce: true },
      { offsetY: 5, vx: 470, vy: 45, dmg: damage, homing: false, pierce: true },
    ];
  }

  // LANCE ya no persigue. Perseguir apuntaba por el jugador y volvía el juego
  // fácil: la puntería dejaba de importar. Ahora ATRAVIESA, que sigue siendo
  // un arma completamente distinta a la ráfaga de VULCAN pero premia alinear
  // los disparos en vez de sustituir el apuntar. El único que persigue en
  // todo el juego es el misil.
  const shots = level >= 3 ? 2 : 1;
  const specs: DisparoSpec[] = [];
  for (let i = 0; i < shots; i++) {
    specs.push({
      offsetY: shots === 1 ? 0 : (i === 0 ? -8 : 8),
      vx: 520,
      vy: 0,
      dmg: level >= 3 ? 2 : 1,
      homing: false,
      pierce: true,
    });
  }
  return specs;
}

/** Options que acompañan al nivel de arma. Subir de arma también engorda tu
 * escolta, así que cada core se nota dos veces. */
export function optionsPara(level: WeaponLevel): number {
  // Solo al máximo. Antes aparecían en el nivel 2 y confundían: parecía que
  // el juego regalaba un poder que no habías elegido.
  return level >= 3 ? 2 : 0;
}

export function nombreArma(ship: ShipId, level: WeaponLevel): string {
  if (level === 0) return 'BÁSICA';
  return `${SHIPS[ship].armaNombre} ${level}`;
}

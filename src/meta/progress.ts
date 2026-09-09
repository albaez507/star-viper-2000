/**
 * Progreso persistente entre partidas (hangar).
 *
 * Vive fuera de `src/game/` a propósito: la regla del proyecto es que la
 * simulación no toca DOM ni almacenamiento (ver `LOGIC.md` §12), porque ese
 * mismo código tiene que poder correr en el servidor el día del multijugador.
 * Aquí se lee/escribe `localStorage`, y `main.ts` traduce el resultado a
 * campos del jugador al crear el mundo.
 *
 * ⚠️ Para multijugador esto NO sirve tal cual: `localStorage` lo edita
 * cualquiera desde la consola del navegador. Cuando exista el servidor
 * autoritativo, el inventario y las mejoras tienen que vivir en el servidor
 * y validarse ahí; esta capa quedaría solo como caché local.
 */

const STORAGE_KEY = 'starviper.progress.v1';

export type UpgradeId = 'hull' | 'engines' | 'shield';

export type Progress = {
  items: number;
  upgrades: Record<UpgradeId, number>;
};

export type UpgradeDef = {
  id: UpgradeId;
  nombre: string;
  descripcion: string;
  costo: number;
  maxNivel: number;
};

export const UPGRADES: UpgradeDef[] = [
  { id: 'hull', nombre: 'CASCO REFORZADO', descripcion: '+1 vida al empezar', costo: 3, maxNivel: 2 },
  { id: 'engines', nombre: 'MOTORES', descripcion: '+18% velocidad de base', costo: 2, maxNivel: 2 },
  { id: 'shield', nombre: 'ESCUDO INICIAL', descripcion: 'Empiezas con el escudo cargado', costo: 4, maxNivel: 1 },
];

function vacio(): Progress {
  return { items: 0, upgrades: { hull: 0, engines: 0, shield: 0 } };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return vacio();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    const base = vacio();
    return {
      items: Number.isFinite(parsed.items) ? Math.max(0, Math.floor(parsed.items as number)) : 0,
      upgrades: { ...base.upgrades, ...(parsed.upgrades ?? {}) },
    };
  } catch {
    // Modo privado, almacenamiento bloqueado o JSON corrupto: se juega sin
    // progreso en vez de romper el arranque.
    return vacio();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* sin persistencia disponible; la partida sigue igual */
  }
}

export function nivelDe(p: Progress, id: UpgradeId): number {
  return p.upgrades[id] ?? 0;
}

export function puedeComprar(p: Progress, def: UpgradeDef): boolean {
  return nivelDe(p, def.id) < def.maxNivel && p.items >= def.costo;
}

export function comprar(p: Progress, def: UpgradeDef): Progress {
  if (!puedeComprar(p, def)) return p;
  const next: Progress = {
    items: p.items - def.costo,
    upgrades: { ...p.upgrades, [def.id]: nivelDe(p, def.id) + 1 },
  };
  saveProgress(next);
  return next;
}

export function banquearItems(p: Progress, ganados: number): Progress {
  if (ganados <= 0) return p;
  const next: Progress = { ...p, items: p.items + ganados };
  saveProgress(next);
  return next;
}

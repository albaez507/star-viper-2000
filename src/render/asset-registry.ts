export type ManagedEnemyFamily = 'scout' | 'diver' | 'formation';

export type EnemyAssetOption = {
  id: string;
  label: string;
  description: string;
  sheet: string;
  position: string;
  accent: string;
};

export const ENEMY_ASSET_OPTIONS: Record<ManagedEnemyFamily, EnemyAssetOption[]> = {
  scout: [
    { id: 'scout-v1', label: 'CRIMSON', description: 'Interceptor de ataque rápido', sheet: `${import.meta.env.BASE_URL}assets/sentinel/scout-variants.png`, position: '0%', accent: '#ff526d' },
    { id: 'scout-v2', label: 'SIGNAL', description: 'Blindaje oscuro · luces cyan', sheet: `${import.meta.env.BASE_URL}assets/sentinel/scout-variants.png`, position: '50%', accent: '#68f4ff' },
    { id: 'scout-v3', label: 'PROTOTYPE', description: 'Casco ivory · energía violeta', sheet: `${import.meta.env.BASE_URL}assets/sentinel/scout-variants.png`, position: '100%', accent: '#b66cff' },
  ],
  diver: [
    { id: 'diver-v1', label: 'EMBER', description: 'Picado naranja · motor caliente', sheet: `${import.meta.env.BASE_URL}assets/sentinel/diver-variants.png`, position: '0%', accent: '#ff943f' },
    { id: 'diver-v2', label: 'WARNING', description: 'Blindaje ivory · rojo alerta', sheet: `${import.meta.env.BASE_URL}assets/sentinel/diver-variants.png`, position: '50%', accent: '#ff526d' },
    { id: 'diver-v3', label: 'NOVA', description: 'Blindaje violeta · reactor magenta', sheet: `${import.meta.env.BASE_URL}assets/sentinel/diver-variants.png`, position: '100%', accent: '#ee62ff' },
  ],
  formation: [
    { id: 'formation-v1', label: 'LAVENDER', description: 'Dron de escuadrón · sensor violet', sheet: `${import.meta.env.BASE_URL}assets/sentinel/formation-variants.png`, position: '0%', accent: '#bfa6ff' },
    { id: 'formation-v2', label: 'GOLD', description: 'Dron de escuadrón · sensor cyan', sheet: `${import.meta.env.BASE_URL}assets/sentinel/formation-variants.png`, position: '50%', accent: '#ffd35c' },
    { id: 'formation-v3', label: 'NIGHT', description: 'Dron de escuadrón · sensor red', sheet: `${import.meta.env.BASE_URL}assets/sentinel/formation-variants.png`, position: '100%', accent: '#ff4c8c' },
  ],
};

export const MANAGED_ENEMY_FAMILIES: ManagedEnemyFamily[] = ['scout', 'diver', 'formation'];

export function findEnemyAsset(family: ManagedEnemyFamily, id: string): EnemyAssetOption {
  return ENEMY_ASSET_OPTIONS[family].find(option => option.id === id) ?? ENEMY_ASSET_OPTIONS[family][0];
}

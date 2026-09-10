/** Sprite sheets stay at native resolution. We scale once per display size. */
export type AnimatedShipId = 'pyre' | 'aegis';
export type ShipPose = -3 | -2 | -1 | 0 | 1 | 2 | 3;
export type AnimatedShipSprite = `${AnimatedShipId}-p${ShipPose}`;
export type SkySprite = 'vulcan' | 'lance' | 'option' | 'core' | 'scout' | 'sine' | 'diver' | 'formation' | 'swarm' | 'harasser' | 'rival' | 'item' | 'bolt' | 'orb' | 'missile' | 'explosion' | 'boss1' | 'boss2' | 'boss3' | ManagedEnemyVariant | AnimatedShipSprite;
const names: SkySprite[] = ['vulcan', 'lance', 'option', 'core', 'scout', 'sine', 'diver', 'formation', 'swarm', 'harasser', 'rival', 'item', 'bolt', 'orb', 'missile', 'explosion'];
const frames = new Map<SkySprite, HTMLCanvasElement>();

export type ManagedEnemyFamily = 'scout' | 'diver' | 'formation';
export type ManagedEnemyVariant = `${ManagedEnemyFamily}-v1` | `${ManagedEnemyFamily}-v2` | `${ManagedEnemyFamily}-v3`;
const MANAGED_FAMILIES: ManagedEnemyFamily[] = ['scout', 'diver', 'formation'];
const DEFAULT_ASSIGNMENTS: Record<ManagedEnemyFamily, ManagedEnemyVariant> = {
  scout: 'scout-v1', diver: 'diver-v1', formation: 'formation-v1',
};
const ASSIGNMENT_KEY = 'starviper.sentinel-assets.v1';
const ANIMATED_SHIPS: AnimatedShipId[] = ['pyre', 'aegis'];
const POSES: ShipPose[] = [-3, -2, -1, 0, 1, 2, 3];

function animatedShipKeys(ship: AnimatedShipId): AnimatedShipSprite[] {
  return POSES.map((pose) => `${ship}-p${pose}` as AnimatedShipSprite);
}

function loadAssignments(): Record<ManagedEnemyFamily, ManagedEnemyVariant> {
  const next = { ...DEFAULT_ASSIGNMENTS };
  try {
    const raw = JSON.parse(localStorage.getItem(ASSIGNMENT_KEY) ?? '{}') as Partial<Record<ManagedEnemyFamily, string>>;
    for (const family of MANAGED_FAMILIES) {
      const candidate = raw[family];
      if (candidate === `${family}-v1` || candidate === `${family}-v2` || candidate === `${family}-v3`) {
        next[family] = candidate as ManagedEnemyVariant;
      }
    }
  } catch {
    /* Storage unavailable: use the first variant for every family. */
  }
  return next;
}

const assignments = loadAssignments();

export function getEnemyVariant(family: ManagedEnemyFamily): ManagedEnemyVariant {
  return assignments[family];
}

export function setEnemyVariant(family: ManagedEnemyFamily, variant: ManagedEnemyVariant): void {
  assignments[family] = variant;
  const selected = frames.get(variant);
  if (selected) frames.set(family, selected);
  try { localStorage.setItem(ASSIGNMENT_KEY, JSON.stringify(assignments)); } catch { /* optional persistence */ }
}

function syncAssignmentsToFrames(): void {
  for (const family of MANAGED_FAMILIES) {
    const selected = frames.get(assignments[family]);
    if (selected) frames.set(family, selected);
  }
}

/**
 * Vacío a propósito. Antes volteaba `swarm`, `harasser` y `rival` "porque
 * estaban dibujados mirando a la derecha", pero el arte del atlas ya mira a
 * la izquierda: el volteo los ponía de espaldas y atacaban al jugador desde
 * atrás. Comprobado dibujando los frames con y sin el volteo.
 */
const FLIP_X = new Set<SkySprite>();

export let skyActive = false;
export function setSkyActive(active: boolean): void { skyActive = active; }

type Recorte = { left: number; top: number; right: number; bottom: number };

function recorteDe(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): Recorte | null {
  const data = ctx.getImageData(x, y, w, h).data;
  let left = w, top = h, right = 0, bottom = 0;
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    if (data[(py * w + px) * 4 + 3] < 80) continue;
    left = Math.min(left, px); right = Math.max(right, px);
    top = Math.min(top, py); bottom = Math.max(bottom, py);
  }
  return left > right ? null : { left, top, right, bottom };
}

/**
 * @param compartirRecorte  Recorta TODOS los fotogramas con la misma caja (la
 *   unión de las suyas) en vez de cada uno con la propia.
 *
 *   Es obligatorio para una animación y sale mal sin ello. Cada fotograma
 *   recortado por separado pierde su tamaño relativo, y como después se
 *   dibujan todos al mismo ancho y alto, cada pose se estira de forma
 *   distinta: medido en `pyre-poses.png`, la pose neutra ocupa 504 px de alto
 *   y la de picado 172, o sea que se dibujaban con 2.9x de diferencia de
 *   estiramiento. En pantalla la nave crecía, encogía y daba un salto lateral
 *   al cambiar de pose.
 *
 *   Para sprites independientes (enemigos, items) el recorte propio SÍ es lo
 *   correcto: no guardan ninguna relación entre ellos.
 */
async function loadSheet(file: string, columns: number, rows: number, keys: SkySprite[], folder = 'sky', compartirRecorte = false): Promise<void> {
  const img = new Image();
  img.src = `${import.meta.env.BASE_URL}assets/${folder}/${file}.png`;
  await img.decode();
  const source = document.createElement('canvas');
  source.width = img.naturalWidth; source.height = img.naturalHeight;
  const ctx = source.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);

  const celda = (i: number): { x: number; y: number; w: number; h: number } => {
    const x = Math.round((i % columns) * source.width / columns);
    const y = Math.round(Math.floor(i / columns) * source.height / rows);
    return {
      x, y,
      w: Math.round((i % columns + 1) * source.width / columns) - x,
      h: Math.round((Math.floor(i / columns) + 1) * source.height / rows) - y,
    };
  };

  const recortes = keys.map((name, i) => {
    const c = celda(i);
    const r = recorteDe(ctx, c.x, c.y, c.w, c.h);
    if (!r) throw new Error(`Empty sky sprite: ${name}`);
    return r;
  });

  let comun: Recorte | null = null;
  if (compartirRecorte) {
    comun = recortes.reduce((a, b) => ({
      left: Math.min(a.left, b.left),
      top: Math.min(a.top, b.top),
      right: Math.max(a.right, b.right),
      bottom: Math.max(a.bottom, b.bottom),
    }));
  }

  keys.forEach((name, i) => {
    const c = celda(i);
    const r = comun ?? recortes[i];
    const fw = r.right - r.left + 1;
    const fh = r.bottom - r.top + 1;
    const frame = document.createElement('canvas');
    frame.width = fw;
    frame.height = fh;
    const out = frame.getContext('2d')!;
    out.imageSmoothingEnabled = false;
    out.drawImage(source, c.x + r.left, c.y + r.top, fw, fh, 0, 0, fw, fh);
    frames.set(name, frame);
  });
}

export const skyAssetsReady = Promise.all([
  loadSheet('sprites', 4, 4, names),
  loadSheet('guardian', 3, 1, ['boss1', 'boss2', 'boss3']),
  loadSheet('scout-variants', 3, 1, ['scout-v1', 'scout-v2', 'scout-v3'], 'sentinel'),
  loadSheet('diver-variants', 3, 1, ['diver-v1', 'diver-v2', 'diver-v3'], 'sentinel'),
  loadSheet('formation-variants', 3, 1, ['formation-v1', 'formation-v2', 'formation-v3'], 'sentinel'),
  ...ANIMATED_SHIPS.map((ship) => loadSheet(`${ship}-poses`, 7, 1, animatedShipKeys(ship), 'ships', true)),
]).then(() => { syncAssignmentsToFrames(); });

/**
 * Los frames del atlas vienen a ~313 px y se dibujan a ~34 px: una reducción
 * de casi 9x. Hacerla en cada frame con `imageSmoothingEnabled = false` tira
 * el 99% de los píxeles y produce el aliasing que hacía que el juego se viera
 * en baja calidad pese a que el arte original es nítido.
 *
 * Aquí se reduce **una sola vez por tamaño**, con filtrado bueno, y a partir
 * de ahí se pinta 1:1. Los tamaños pedidos son constantes por tipo de enemigo,
 * así que la caché se queda en un puñado de entradas.
 */
const scaledFrames = new Map<string, HTMLCanvasElement>();

function scaledFrame(name: SkySprite, frame: HTMLCanvasElement, dw: number, dh: number): HTMLCanvasElement {
  const key = `${name}:${dw}x${dh}`;
  const cached = scaledFrames.get(key);
  if (cached) return cached;

  const out = document.createElement('canvas');
  out.width = dw;
  out.height = dh;
  const g = out.getContext('2d')!;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(frame, 0, 0, dw, dh);
  scaledFrames.set(key, out);
  return out;
}

export function drawSkySprite(ctx: CanvasRenderingContext2D, name: SkySprite, x: number, y: number, w: number, h: number, flash = false, angle = 0): boolean {
  const frame = frames.get(name);
  if (!frame) return false;
  const boxW = Math.max(1, Math.round(w));
  const boxH = Math.max(1, Math.round(h));
  const scale = Math.min(boxW / frame.width, boxH / frame.height);
  const dw = Math.max(1, Math.round(frame.width * scale));
  const dh = Math.max(1, Math.round(frame.height * scale));

  // Nitidez: el canvas puede tener más píxeles reales que unidades de mundo
  // (ver `fitCanvas`). Si reducimos el frame a unidades de mundo y luego la
  // transformación lo agranda, estamos tirando detalle y volviéndolo a
  // estirar. Reduciendo directamente a **píxeles de pantalla**, el dibujo
  // acaba siendo 1:1 y se ve todo lo nítido que el arte permite.
  const escalaPantalla = ctx.getTransform().a || 1;
  const pw = Math.max(1, Math.round(dw * escalaPantalla));
  const ph = Math.max(1, Math.round(dh * escalaPantalla));
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  if (FLIP_X.has(name)) ctx.scale(-1, 1);
  if (angle) ctx.rotate(angle);
  if (flash) ctx.filter = 'brightness(2.5)';
  ctx.drawImage(scaledFrame(name, frame, pw, ph), -Math.round(dw / 2), -Math.round(dh / 2), dw, dh);
  ctx.restore();
  return true;
}

/** Dibuja una nave de jugador con la pose arcade correspondiente. */
export function drawPlayerSkySprite(ctx: CanvasRenderingContext2D, ship: string, pose: number, x: number, y: number, w: number, h: number, flash = false): boolean {
  if (ship !== 'pyre' && ship !== 'aegis') return drawSkySprite(ctx, ship as SkySprite, x, y, w, h, flash);
  const safePose = Math.max(-3, Math.min(3, Math.round(pose))) as ShipPose;
  return drawSkySprite(ctx, `${ship}-p${safePose}` as AnimatedShipSprite, x, y, w, h, flash);
}

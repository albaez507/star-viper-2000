/** Sky sheets stay at native pixels. We scale once, nearest-neighbor, at draw time. */
export type SkySprite = 'vulcan' | 'lance' | 'option' | 'core' | 'scout' | 'sine' | 'diver' | 'formation' | 'swarm' | 'harasser' | 'rival' | 'item' | 'bolt' | 'orb' | 'missile' | 'explosion' | 'boss1' | 'boss2' | 'boss3';
const names: SkySprite[] = ['vulcan', 'lance', 'option', 'core', 'scout', 'sine', 'diver', 'formation', 'swarm', 'harasser', 'rival', 'item', 'bolt', 'orb', 'missile', 'explosion'];
const frames = new Map<SkySprite, HTMLCanvasElement>();

/** These three were drawn facing right. Everything hostile must face left. */
const FLIP_X = new Set<SkySprite>(['swarm', 'harasser', 'rival']);

export let skyActive = false;
export function setSkyActive(active: boolean): void { skyActive = active; }

async function loadSheet(file: string, columns: number, rows: number, keys: SkySprite[]): Promise<void> {
  const img = new Image();
  img.src = `/assets/sky/${file}.png`;
  await img.decode();
  const source = document.createElement('canvas');
  source.width = img.naturalWidth; source.height = img.naturalHeight;
  const ctx = source.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  keys.forEach((name, i) => {
    const x = Math.round((i % columns) * source.width / columns);
    const y = Math.round(Math.floor(i / columns) * source.height / rows);
    const w = Math.round((i % columns + 1) * source.width / columns) - x;
    const h = Math.round((Math.floor(i / columns) + 1) * source.height / rows) - y;
    const data = ctx.getImageData(x, y, w, h).data;
    let left = w, top = h, right = 0, bottom = 0;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      if (data[(py * w + px) * 4 + 3] < 80) continue;
      left = Math.min(left, px); right = Math.max(right, px);
      top = Math.min(top, py); bottom = Math.max(bottom, py);
    }
    if (left > right) throw new Error(`Empty sky sprite: ${name}`);
    const fw = right - left + 1;
    const fh = bottom - top + 1;
    const frame = document.createElement('canvas');
    frame.width = fw;
    frame.height = fh;
    const out = frame.getContext('2d')!;
    out.imageSmoothingEnabled = false;
    out.drawImage(source, x + left, y + top, fw, fh, 0, 0, fw, fh);
    frames.set(name, frame);
  });
}

export const skyAssetsReady = Promise.all([
  loadSheet('sprites', 4, 4, names),
  loadSheet('guardian', 3, 1, ['boss1', 'boss2', 'boss3']),
]);

export function drawSkySprite(ctx: CanvasRenderingContext2D, name: SkySprite, x: number, y: number, w: number, h: number, flash = false, angle = 0): boolean {
  const frame = frames.get(name);
  if (!frame) return false;
  const boxW = Math.max(1, Math.round(w));
  const boxH = Math.max(1, Math.round(h));
  const scale = Math.min(boxW / frame.width, boxH / frame.height);
  const dw = Math.max(1, Math.round(frame.width * scale));
  const dh = Math.max(1, Math.round(frame.height * scale));
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  if (FLIP_X.has(name)) ctx.scale(-1, 1);
  if (angle) ctx.rotate(angle);
  if (flash) ctx.filter = 'brightness(2.5)';
  ctx.drawImage(frame, -Math.round(dw / 2), -Math.round(dh / 2), dw, dh);
  ctx.restore();
  return true;
}

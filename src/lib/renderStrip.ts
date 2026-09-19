import { type Mode, type Layout, type PlacedSticker, type PlacedPolaroid, type Shot } from '../types';
import { findStickerDef } from '../stickerCatalog';
import { getFilterCss } from './filters';
import { getPoseMatchGrid } from './poseMatchGrid';
import { layoutPolaroidText } from './polaroidText';

/**
 * Canvas renderer that reproduces the on-screen strip/polaroid composition
 * and hands back a PNG blob. Sticker size is a PERCENT of the canvas width,
 * so the export at 2x+ resolution keeps the exact same relative layout as the
 * Editor and Done screens. Same-origin resources only (public/ assets and
 * blob: shot URLs), so the canvas never taints and toBlob always works.
 */

const FONT_STACK = 'Nunito, system-ui, sans-serif';

/** One drawable reference pose (photo or pastel fallback). */
type PoseDraw = { label: string; src?: string; color?: string };

/** SVG sticker glyph serialized from the live preview, so hand-drawn SVGs export identically. */
type StickerDraw = { kind: 'image'; src: string; size: number } | { kind: 'emoji'; char: string; size: number };

export interface RenderStripOptions {
  mode: Mode;
  layout: Layout;
  shots: Shot[];
  bgColor: string;
  bgImage: string | null;
  stickers: PlacedSticker[];
  /** stickerId -> serialized data URL (SVG stickers) resolved by the caller. */
  stickerImages: Map<string, string>;
  caption: string;
  showDate: boolean;
  /** ONE session-wide filter, drawn onto the USER's shots only. */
  filterId: string;
  poseRefs: PoseDraw[];
  /**
   * pose-match: THE authoritative pose count. Deriving the grid from
   * poseRefs.length is a fallback only; callers pass poseCount so the export
   * always matches the Editor/Done/Setup layout exactly (no phantom rows).
   */
  poseCount?: number;
  polaroids: PlacedPolaroid[];
  /** Render scale; 2 gives a crisp 2x export. */
  scale?: number;
}

export function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function loadImageSafe(src: string): Promise<HTMLImageElement> {
  return loadImage(src);
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Shared preload cache for sticker images (data URLs and same-origin paths). */
const preloaded = new Map<string, HTMLImageElement>();

async function preload(src: string): Promise<void> {
  if (preloaded.has(src)) return;
  preloaded.set(src, await loadImage(src));
}

/** Draw a user shot with the session filter; filter is reset right after. */
function drawShotFiltered(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  filterId: string,
) {
  ctx.save();
  ctx.filter = getFilterCss(filterId);
  drawCover(ctx, img, x, y, w, h);
  ctx.restore(); // restores filter to 'none' before anything else is drawn
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bgColor: string,
  bgImg: HTMLImageElement | null,
) {
  ctx.fillStyle = bgColor || '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  if (bgImg) drawCover(ctx, bgImg, 0, 0, w, h);
}

const PASTELS = ['#FFD6E8', '#E8D5FF', '#C8F5E3', '#FFF3C4', '#C8E8FF', '#FFE5D0'];

/** Classic/pose strip export. */
async function drawStrip(
  ctx: CanvasRenderingContext2D,
  opts: RenderStripOptions,
  W: number,
  H: number,
) {
  const scale = opts.scale ?? 2;
  const isPose = opts.mode === 'pose-match';
  const landscape = opts.layout === '4-landscape' && !isPose;
  // pose-match layout comes from THE source of truth (1 pose = portrait:
  // reference on top, user's shot below — matches StripPreview exactly).
  const poseGrid = isPose
    ? getPoseMatchGrid(opts.poseCount ?? Math.max(1, opts.poseRefs.length))
    : null;
  const frameW = Math.round((isPose ? poseGrid!.cellW : landscape ? 90 : 160) * scale);
  const frameH = Math.round((isPose ? poseGrid!.cellH : landscape ? 68 : 120) * scale);
  const cols = isPose ? poseGrid!.cols : landscape ? 2 : 1;
  const rows = isPose
    ? poseGrid!.rows
    : landscape
    ? 2
    : opts.layout === '3-portrait'
    ? 3
    : 4;
  const pad = Math.round(10 * scale);
  const gap = Math.round(4 * scale);
  const captionH = Math.round(44 * scale);
  const bgImg = opts.bgImage
    ? await loadImageSafe(`${import.meta.env.BASE_URL}${opts.bgImage}`).catch(() => null)
    : null;

  drawBackground(ctx, W, H, opts.bgColor, bgImg);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = pad + col * (frameW + gap);
      const y = pad + row * (frameH + gap);
      const index = row * cols + col;
      // Reference cell: right column for 2-4 poses, TOP cell for 1 pose.
      const isRef = isPose && (poseGrid!.referenceFirst ? row === 0 : col === 1);
      // User shot index for the cell: rows map 1:1 to shots for both layouts
      // (1-pose portrait clamps to the single capture; never a phantom index).
      const shotIndex = isPose
        ? poseGrid!.referenceFirst
          ? Math.min(row, Math.max(0, opts.shots.length - 1))
          : row
        : index;
      ctx.save();
      roundRect(ctx, x, y, frameW, frameH, 2 * scale);
      ctx.clip();
      if (isRef) {
        // Reference photo: NEVER filtered.
        const ref = opts.poseRefs[row];
        if (ref?.src) {
          try {
            const img = await loadImageSafe(`${import.meta.env.BASE_URL}${ref.src}`);
            drawCover(ctx, img, x, y, frameW, frameH);
          } catch {
            ctx.fillStyle = PASTELS[row % PASTELS.length];
            ctx.fillRect(x, y, frameW, frameH);
          }
        } else {
          ctx.fillStyle = ref?.color ?? PASTELS[row % PASTELS.length];
          ctx.fillRect(x, y, frameW, frameH);
        }
      } else {
        // USER's shot: drawn with the session filter, then filter reset.
        const shot = opts.shots[shotIndex];
        if (shot) {
          try {
            const img = await loadImage(shot.url);
            drawShotFiltered(ctx, img, x, y, frameW, frameH, opts.filterId);
          } catch {
            ctx.filter = 'none';
            ctx.fillStyle = PASTELS[shotIndex % PASTELS.length];
            ctx.fillRect(x, y, frameW, frameH);
          }
        } else {
          ctx.fillStyle = PASTELS[shotIndex % PASTELS.length];
          ctx.fillRect(x, y, frameW, frameH);
        }
      }
      ctx.restore();
    }
  }

  // Caption block
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const bottom = pad * 2 + rows * frameH + (rows - 1) * gap;
  const centerY = bottom + (captionH - Math.round(6 * scale)) / 2;
  if (opts.caption) {
    ctx.font = `700 ${Math.round(9 * scale)}px ${FONT_STACK}`;
    ctx.fillStyle = opts.bgColor === '#2A1A2A' ? '#EEEEEE' : '#3A2A3A';
    ctx.fillText(ellipsize(ctx, opts.caption, W - pad * 2), W / 2, centerY - (opts.showDate ? Math.round(5 * scale) : 0));
  }
  if (opts.showDate) {
    ctx.font = `italic 400 ${Math.round(8 * scale)}px ${FONT_STACK}`;
    ctx.fillStyle = opts.bgColor === '#2A1A2A' ? '#AAAAAA' : '#9A8A9A';
    ctx.fillText(todayLabel(), W / 2, centerY + (opts.caption ? Math.round(6 * scale) : 0));
  }
  if (isPose) {
    ctx.font = `400 ${Math.round(7 * scale)}px ${FONT_STACK}`;
    ctx.fillStyle = opts.bgColor === '#2A1A2A' ? '#888888' : '#B0A0B0';
    ctx.fillText('FOXTALE STUDIO', W / 2, centerY + (opts.caption || opts.showDate ? Math.round(15 * scale) : 0));
  }
  ctx.restore();
}

/** Polaroid canvas export. */
async function drawPolaroid(
  ctx: CanvasRenderingContext2D,
  opts: RenderStripOptions,
  W: number,
  H: number,
) {
  const bgImg = opts.bgImage
    ? await loadImageSafe(`${import.meta.env.BASE_URL}${opts.bgImage}`).catch(() => null)
    : null;
  drawBackground(ctx, W, H, opts.bgColor, bgImg);

  for (const p of opts.polaroids) {
    const cardW = (p.width / 100) * W;
    const shot = opts.shots[p.shotIndex];
    ctx.save();
    ctx.translate(W * (p.x / 100), H * (p.y / 100));
    ctx.rotate((p.rotation * Math.PI) / 180);
    // White card frame — SAME text layout as PolaroidCard (shared module).
    const padPx = Math.round(cardW * 0.06);
    const photoSize = cardW - padPx * 2;
    const today = todayLabel();
    const textLayout = layoutPolaroidText(cardW, opts.caption, opts.showDate, today);
    const bandH = textLayout.bandH;
    const cardH = padPx + photoSize + bandH;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(58,42,58,0.18)';
    ctx.shadowBlur = 20;
    roundRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 3);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.save();
    roundRect(ctx, -cardW / 2 + padPx, -cardH / 2 + padPx, photoSize, photoSize, 2);
    ctx.clip();
    if (shot) {
      try {
        const img = await loadImage(shot.url);
        drawShotFiltered(ctx, img, -cardW / 2 + padPx, -cardH / 2 + padPx, photoSize, photoSize, opts.filterId);
      } catch {
        ctx.filter = 'none';
        ctx.fillStyle = PASTELS[p.shotIndex % PASTELS.length];
        ctx.fillRect(-cardW / 2 + padPx, -cardH / 2 + padPx, photoSize, photoSize);
      }
    } else {
      ctx.fillStyle = PASTELS[p.shotIndex % PASTELS.length];
      ctx.fillRect(-cardW / 2 + padPx, -cardH / 2 + padPx, photoSize, photoSize);
    }
    ctx.restore();
    // Caption + date in the bottom band — identical to the DOM card layout.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const bandTop = -cardH / 2 + padPx + photoSize;
    const contentH =
      textLayout.lines.length * textLayout.capLineH +
      (textLayout.lines.length > 0 && opts.showDate ? 2 : 0) +
      textLayout.dateH;
    let y = bandTop + (bandH - contentH) / 2 + textLayout.capLineH / 2;
    for (const line of textLayout.lines) {
      ctx.font = `700 ${textLayout.capSize}px ${FONT_STACK}`;
      ctx.letterSpacing = '0.05em'; // same as the DOM caption spans
      ctx.fillStyle = '#3A2A3A';
      ctx.fillText(line, 0, y);
      ctx.letterSpacing = '0px';
      y += textLayout.capLineH + 2;
    }
    if (opts.showDate && textLayout.dateSize > 0) {
      ctx.font = `italic 400 ${textLayout.dateSize}px ${FONT_STACK}`;
      ctx.fillStyle = '#9A8A9A';
      ctx.fillText(today, 0, bandTop + bandH - textLayout.dateH / 2 - Math.max(2, bandH * 0.06));
    }
    ctx.restore();
  }
}

/** Sticker px size at export resolution: sizePct of the EXPORT canvas width. */
function stickerDraw(
  s: PlacedSticker,
  opts: RenderStripOptions,
  canvasW: number,
): StickerDraw {
  const size = (canvasW * s.sizePct) / 100;
  const dataUrl = opts.stickerImages.get(s.stickerId);
  if (dataUrl) return { kind: 'image', src: dataUrl, size };
  const def = findStickerDef(s.stickerId);
  if (def?.src) return { kind: 'image', src: `${import.meta.env.BASE_URL}${def.src}`, size };
  return { kind: 'emoji', char: def?.emoji ?? '✨', size: size * 0.9 };
}

function drawStickerGlyph(
  ctx: CanvasRenderingContext2D,
  draw: StickerDraw,
  cx: number,
  cy: number,
  rotation: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (draw.kind === 'emoji') {
    ctx.font = `${draw.size}px ${FONT_STACK}`;
    ctx.fillText(draw.char, 0, 0);
  } else {
    const img = preloaded.get(draw.src);
    if (img) {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const s = Math.min(draw.size / iw, draw.size / ih);
      ctx.drawImage(img, -(iw * s) / 2, -(ih * s) / 2, iw * s, ih * s);
    }
  }
  ctx.restore();
}

/**
 * Render the composition to a canvas and resolve a PNG blob.
 * The export canvas is `scale` x the on-screen composition; stickers are
 * sized as % of the EXPORT width so they land exactly where they appear
 * in the Editor/Done preview.
 */
export async function renderStripToBlob(opts: RenderStripOptions): Promise<Blob> {
  const scale = opts.scale ?? 2;
  const isPolaroid = opts.mode === 'polaroid';

  // On-screen base dimensions (match StripPreview / PolaroidCanvas at scale 1).
  const baseW = isPolaroid
    ? Math.round(520 * (9 / 16))
    : (() => {
        const isPose = opts.mode === 'pose-match';
        const landscape = opts.layout === '4-landscape' && !isPose;
        const grid = isPose
          ? getPoseMatchGrid(opts.poseCount ?? Math.max(1, opts.poseRefs.length))
          : null;
        const frameW = isPose ? grid!.cellW : landscape ? 90 : 160;
        const cols = isPose ? grid!.cols : landscape ? 2 : 1;
        return Math.round(10 * scale) * 2 + Math.round(frameW * scale) * cols + Math.round(4 * scale) * (cols - 1);
      })();
  const baseH = isPolaroid
    ? 520
    : (() => {
        const isPose = opts.mode === 'pose-match';
        const landscape = opts.layout === '4-landscape' && !isPose;
        const grid = isPose
          ? getPoseMatchGrid(opts.poseCount ?? Math.max(1, opts.poseRefs.length))
          : null;
        const frameH = isPose ? grid!.cellH : landscape ? 68 : 120;
        const rows = isPose ? grid!.rows : landscape ? 2 : opts.layout === '3-portrait' ? 3 : 4;
        return Math.round(10 * scale) * 2 + Math.round(frameH * scale) * rows + Math.round(4 * scale) * (rows - 1) + Math.round(44 * scale);
      })();

  // Editor strips use scale 1.6; 2x that keeps the export at >= 2x the
  // on-screen width. Polaroid renders at height 520 on-screen (W=292);
  // scale 2 gives 584 >= 2x292. Classic at scale 3.2 gives W >= 2x(1.6*scale).
  const effScale = isPolaroid ? Math.max(scale, 2) : Math.max(scale, 3.2);
  const W = Math.round(baseW * (effScale / scale));
  const H = Math.round(baseH * (effScale / scale));

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is unavailable');
  ctx.imageSmoothingQuality = 'high';
  // drawStrip/drawPolaroid derive their frame metrics from opts.scale; run
  // them at the effective (higher) scale so the whole sheet scales together.
  const drawOpts = { ...opts, scale: effScale };

  // Preload sticker images (data URLs from the live preview + same-origin).
  for (const s of drawOpts.stickers) {
    const draw = stickerDraw(s, drawOpts, W);
    if (draw.kind === 'image') await preload(draw.src).catch(() => undefined);
  }

  if (isPolaroid) {
    await drawPolaroid(ctx, drawOpts, W, H);
  } else {
    await drawStrip(ctx, drawOpts, W, H);
  }

  // Stickers on top, percent coords -> px. Filter state is 'none' here.
  for (const s of drawOpts.stickers) {
    const draw = stickerDraw(s, drawOpts, W);
    drawStickerGlyph(ctx, draw, W * (s.x / 100), H * (s.y / 100), s.rotation);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to encode PNG'));
    }, 'image/png');
  });
}

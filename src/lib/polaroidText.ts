/**
 * Polaroid card text layout — the SINGLE source of truth used by BOTH the
 * DOM card (PolaroidCard) and the PNG export (renderStrip.drawPolaroid), so
 * the caption/date always fit and look identical everywhere.
 *
 * All metrics derive from the card width W (never fixed px):
 * - Side/top borders: 6% of W; bottom border >= 24% of W.
 * - Caption: 6.5% of W, wraps to at most 2 centered lines; if it can't fit,
 *   shrinks toward 4.5% of W, then truncates with an ellipsis.
 * - Date: 4.5% of W, one line, shrinks to fit if needed.
 * - Bottom border = max(24% of W, text height + 4% of W).
 */

const FONT_STACK = 'Nunito, system-ui, sans-serif';

let measureCtx: CanvasRenderingContext2D | null = null;

function measure(text: string, font: string, letterSpacing = ''): number {
  if (!measureCtx) {
    const c = document.createElement('canvas');
    measureCtx = c.getContext('2d');
  }
  if (!measureCtx) return 0;
  measureCtx.font = font;
  // Match the DOM exactly: the caption spans render with letter-spacing,
  // which measureText ignores unless set on the context.
  measureCtx.letterSpacing = letterSpacing;
  return measureCtx.measureText(text).width;
}

/** Break text into at most 2 lines that fit maxWidth, or return it unwrapped. */
function wrap2(text: string, maxWidth: number, font: string, ls = ''): string[] {
  if (measure(text, font, ls) <= maxWidth) return [text];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 1) return [text];
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    if (measure(a, font, ls) <= maxWidth && measure(b, font, ls) <= maxWidth) return [a, b];
  }
  return [text];
}

/** Truncate with an ellipsis so text fits maxWidth at `font`. */
function truncate(text: string, maxWidth: number, font: string, ls = ''): string {
  if (measure(text, font, ls) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && measure(`${t}…`, font, ls) > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

export interface PolaroidTextLayout {
  /** Caption font size in px (0 when there is no caption). */
  capSize: number;
  /** Caption lines (1-2, already wrapped/shrunk/truncated to fit). */
  lines: string[];
  /** Date font size in px (0 when the date is hidden). */
  dateSize: number;
  /** Bottom border height in px. */
  bandH: number;
  capLineH: number;
  dateH: number;
}

export function layoutPolaroidText(
  W: number,
  caption: string,
  showDate: boolean,
  dateLabel: string,
): PolaroidTextLayout {
  const innerW = Math.max(1, W - Math.round(W * 0.06) * 2);

  // Caption: start at 6.5% of W, shrink toward 4.5% if 2 lines can't fit.
  let capSize = 0;
  let lines: string[] = [];
  if (caption) {
    const CAP_LS = '0.05em'; // matches the DOM caption spans
    let pct = 6.5;
    const minPct = 4.5;
    while (pct >= minPct - 0.001) {
      const font = `700 ${(W * pct) / 100}px ${FONT_STACK}`;
      const ls = wrap2(caption, innerW, font, CAP_LS);
      if (ls.length <= 2 && ls.every(l => measure(l, font, CAP_LS) <= innerW)) {
        capSize = (W * pct) / 100;
        lines = ls;
        break;
      }
      pct -= 0.25;
    }
    if (lines.length === 0) {
      const font = `700 ${(W * minPct) / 100}px ${FONT_STACK}`;
      lines = wrap2(caption, innerW, font, CAP_LS).map(l => truncate(l, innerW, font, CAP_LS));
      capSize = (W * minPct) / 100;
    }
  }

  // Date: 4.5% of W, one line, shrink to fit if needed.
  const dateBase = (W * 4.5) / 100;
  let dateSize = 0;
  if (showDate) {
    const font = `italic 400 ${dateBase}px ${FONT_STACK}`;
    const w = measure(dateLabel, font);
    dateSize = w <= innerW ? dateBase : dateBase * (innerW / Math.max(1, w));
  }

  const capLineH = capSize * 1.15;
  const dateH = dateSize * 1.25;
  const textH =
    lines.length * capLineH + (lines.length > 0 && showDate ? 2 : 0) + dateH;
  const bandH = Math.max(W * 0.24, textH + W * 0.04);

  return {
    capSize: Math.max(6, capSize),
    lines,
    dateSize: Math.max(5, dateSize),
    bandH: Math.round(bandH),
    capLineH,
    dateH,
  };
}

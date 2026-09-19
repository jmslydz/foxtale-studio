import type { Layout } from '../types';

/**
 * Capture/preview aspect ratios (width / height) — the ONE source of truth.
 * The CaptureScreen preview box and captureFrame's crop both read from here,
 * so what the user sees is exactly what gets saved.
 * Values mirror the frame dimensions used by StripPreview:
 * - classic '3-portrait' / '4-portrait': 160x120 -> 4:3
 * - classic '4-landscape':               90x68  -> 45:34
 * - pose-match cells:                    landscape 4:3
 * - polaroid cards:                      square 1:1
 */
export const SHOT_ASPECT: Record<Layout | 'pose-match' | 'polaroid', number> = {
  '3-portrait': 4 / 3,
  '4-portrait': 4 / 3,
  '4-landscape': 90 / 68,
  'pose-match': 4 / 3,
  polaroid: 1,
};

/** Aspect (w/h) for the capture preview and saved shot of the current mode. */
export function getShotAspect(mode: 'classic' | 'pose-match' | 'polaroid', layout: Layout): number {
  return SHOT_ASPECT[mode === 'classic' ? layout : mode];
}

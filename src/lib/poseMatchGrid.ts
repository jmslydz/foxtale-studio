/**
 * THE single source of truth for pose-match strip layouts.
 *
 * - 1 pose  -> PORTRAIT strip: one column, TWO stacked cells of equal size,
 *              reference photo on TOP and the user's shot BELOW.
 * - 2-4     -> 2 columns x N rows: user's shot LEFT, reference RIGHT.
 *
 * Consumed by StripPreview (Setup previews, Editor, Done) and the PNG export
 * (renderStrip) so every surface renders the identical arrangement.
 */
export interface PoseMatchGrid {
  cols: number;
  rows: number;
  /** Intrinsic cell size at strip scale 1. */
  cellW: number;
  cellH: number;
  /** 1-pose portrait: the reference occupies the FIRST (top) cell. */
  referenceFirst: boolean;
}

export function getPoseMatchGrid(poseCount: number): PoseMatchGrid {
  const n = Math.max(1, Math.min(4, Math.round(poseCount) || 1));
  if (n === 1) {
    return { cols: 1, rows: 2, cellW: 160, cellH: 120, referenceFirst: true };
  }
  return { cols: 2, rows: n, cellW: 120, cellH: 90, referenceFirst: false };
}

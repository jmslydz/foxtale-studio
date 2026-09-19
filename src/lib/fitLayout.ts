export interface Box {
  width: number;
  height: number;
}

/** Largest {width, height} with width / height = aspect that fits inside availW x availH. */
export function fitBox(aspect: number, availW: number, availH: number): Box {
  if (!(aspect > 0) || !(availW > 0) || !(availH > 0)) return { width: 0, height: 0 };
  const width = Math.min(availW, availH * aspect);
  return { width, height: width / aspect };
}

export interface FitGridOptions {
  count: number;
  /** Cell aspect (width / height). */
  aspect: number;
  availW: number;
  availH: number;
  /** Gap BETWEEN cells. */
  gap: number;
  /** Extra fixed height under each cell (e.g. a Retake button + its margin). */
  extraH: number;
  /**
   * Force an exact column count instead of searching 1..count for the largest
   * cellW. Used where the arrangement is mandated (e.g. pose-match review
   * cards: 1 pose = 1 column, 2-4 poses = 2 columns).
   */
  cols?: number;
}

export interface FitGrid {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
}

const CELL_W_CAP = 720;

/**
 * Fit `count` cells of the given aspect into availW x availH.
 * Tries every column count from 1 to count; for each, rows = ceil(count/cols)
 * and cellW = min((availW - gap*(cols-1)) / cols,
 *                 ((availH - gap*(rows-1)) / rows - extraH) * aspect),
 * capped at 720px. Picks the column count with the largest cellW.
 */
export function fitGrid({ count, aspect, availW, availH, gap, extraH, cols: forcedCols }: FitGridOptions): FitGrid {
  const safeCount = Math.max(1, Math.floor(count) || 1);
  const startCols = forcedCols && forcedCols >= 1 ? Math.floor(forcedCols) : 1;
  if (!(aspect > 0) || !(availW > 0) || !(availH > 0)) {
    return { cols: startCols, rows: Math.ceil(safeCount / startCols), cellW: 0, cellH: 0 };
  }

  let best: FitGrid = { cols: startCols, rows: Math.ceil(safeCount / startCols), cellW: 0, cellH: 0 };
  const evaluate = (c: number) => {
    const rows = Math.ceil(safeCount / c);
    const cellW = Math.max(
      0,
      Math.min(
        (availW - gap * (c - 1)) / c,
        ((availH - gap * (rows - 1)) / rows - extraH) * aspect,
        CELL_W_CAP,
      ),
    );
    if (cellW > best.cellW) best = { cols: c, rows, cellW, cellH: cellW / aspect };
  };

  if (forcedCols && forcedCols >= 1) {
    evaluate(Math.floor(forcedCols));
  } else {
    for (let c = 1; c <= safeCount; c++) evaluate(c);
  }
  return best;
}

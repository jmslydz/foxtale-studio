import { useCallback } from 'react';

/**
 * Shared pointer gestures for stickers and polaroid cards.
 * All drags use pointer events + setPointerCapture so they continue when the
 * cursor leaves the element, and work identically with mouse and touch.
 */

type PointerOpts = {
  canvas: HTMLElement;
};

export function canvasRect(canvas: HTMLElement) {
  return canvas.getBoundingClientRect();
}

/** Start a pointer drag that only moves an item (percent units, clamped to the canvas). */
export function startMove(
  e: React.PointerEvent,
  opts: {
    canvas: HTMLElement;
    initialX: number;
    initialY: number;
    /** Percent bounds for the item's CENTER (default 0..100). */
    clampX?: [number, number];
    clampY?: [number, number];
    onMove: (x: number, y: number, ev: PointerEvent) => void;
    /** Called on release; receives the final pointer event (for drop targets like the bin). */
    onEnd?: (ev?: PointerEvent) => void;
  },
) {
  const rect = opts.canvas.getBoundingClientRect();
  const target = e.currentTarget as HTMLElement;
  const startX = e.clientX;
  const startY = e.clientY;
  let moved = false;

  const handleMove = (ev: PointerEvent) => {
    moved = true;
    const dx = ((ev.clientX - startX) / rect.width) * 100;
    const dy = ((ev.clientY - startY) / rect.height) * 100;
    const [minX, maxX] = opts.clampX ?? [0, 100];
    const [minY, maxY] = opts.clampY ?? [0, 100];
    const nx = Math.max(minX, Math.min(maxX, opts.initialX + dx));
    const ny = Math.max(minY, Math.min(maxY, opts.initialY + dy));
    opts.onMove(nx, ny, ev);
  };

  const handleUp = (ev: PointerEvent) => {
    target.removeEventListener('pointermove', handleMove);
    target.removeEventListener('pointerup', handleUp);
    target.removeEventListener('pointercancel', handleUp);
    if (!moved) {
      // A click without movement: let the normal click select. Nothing to do —
      // selection is handled by the mousedown/click handlers already in place.
    }
    opts.onEnd?.(ev);
  };

  target.setPointerCapture(e.pointerId);
  target.addEventListener('pointermove', handleMove);
  target.addEventListener('pointerup', handleUp);
  target.addEventListener('pointercancel', handleUp);
}

/** Start a pointer drag that uniformly resizes the item from its center. */
export function startResize(
  e: React.PointerEvent,
  opts: {
    center: { x: number; y: number };
    initialSize: number;
    min: number;
    max: number;
    onResize: (size: number) => void;
  },
) {
  const target = e.currentTarget as HTMLElement;
  const startDist = Math.hypot(e.clientX - opts.center.x, e.clientY - opts.center.y);
  if (startDist < 1) return;

  const handleMove = (ev: PointerEvent) => {
    const dist = Math.hypot(ev.clientX - opts.center.x, ev.clientY - opts.center.y);
    const next = Math.max(opts.min, Math.min(opts.max, opts.initialSize * (dist / startDist)));
    opts.onResize(next);
  };

  const handleUp = () => {
    target.removeEventListener('pointermove', handleMove);
    target.removeEventListener('pointerup', handleUp);
    target.removeEventListener('pointercancel', handleUp);
  };

  target.setPointerCapture(e.pointerId);
  target.addEventListener('pointermove', handleMove);
  target.addEventListener('pointerup', handleUp);
  target.addEventListener('pointercancel', handleUp);
}

/** Start a pointer drag that rotates the item to follow the pointer (atan2). */
export function startRotate(
  e: React.PointerEvent,
  opts: {
    center: { x: number; y: number };
    initialRotation: number;
    onRotate: (rotation: number) => void;
  },
) {
  const target = e.currentTarget as HTMLElement;
  const startAngle = Math.atan2(e.clientY - opts.center.y, e.clientX - opts.center.x);
  const startRot = opts.initialRotation;

  const handleMove = (ev: PointerEvent) => {
    const angle = Math.atan2(ev.clientY - opts.center.y, ev.clientX - opts.center.x);
    // Continue from the item's current rotation, not snap to the pointer.
    opts.onRotate(startRot + ((angle - startAngle) * 180) / Math.PI);
  };

  const handleUp = () => {
    target.removeEventListener('pointermove', handleMove);
    target.removeEventListener('pointerup', handleUp);
    target.removeEventListener('pointercancel', handleUp);
  };

  target.setPointerCapture(e.pointerId);
  target.addEventListener('pointermove', handleMove);
  target.addEventListener('pointerup', handleUp);
  target.addEventListener('pointercancel', handleUp);
}

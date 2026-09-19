import { type PlacedPolaroid } from '../types';

/** Staggered default placements: alternating tilt (3–6°), 1 centered, 2/3 stacked. */
export function defaultPolaroids(count: 1 | 2 | 3): PlacedPolaroid[] {
  if (count === 1) {
    return [
      { id: 'polaroid-1', shotIndex: 0, x: 50, y: 50, width: 62, rotation: -4 },
    ];
  }

  if (count === 2) {
    return [
      { id: 'polaroid-1', shotIndex: 0, x: 50, y: 32, width: 58, rotation: -4 },
      { id: 'polaroid-2', shotIndex: 1, x: 50, y: 71, width: 58, rotation: 5 },
    ];
  }

  return [
    { id: 'polaroid-1', shotIndex: 0, x: 44, y: 22, width: 52, rotation: -6 },
    { id: 'polaroid-2', shotIndex: 1, x: 56, y: 50, width: 52, rotation: 4 },
    { id: 'polaroid-3', shotIndex: 2, x: 47, y: 78, width: 52, rotation: -3 },
  ];
}

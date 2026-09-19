// Shared pastel palette for hand-drawn SVG stickers.
// Values come from the app's existing pastel palette in src/types.ts.
export const STICKER_COLORS = {
  pink: '#FFD6E8',
  pinkDeep: '#FFB3C8',
  lavender: '#E8D5FF',
  lavenderDeep: '#FF8A3D',
  mint: '#C8F5E3',
  mintDeep: '#9EDFC4',
  yellow: '#FFF3C4',
  yellowDeep: '#FFE87A',
  sky: '#C8E8FF',
  skyDeep: '#93CCFF',
  peach: '#FFE5D0',
  peachDeep: '#FFBFA3',
  ink: '#3A2A3A',
} as const;

/**
 * Thin lighter outline used on every SVG sticker: rounded joins/caps give the
 * soft hand-drawn look. Applied as stroke on the shapes themselves.
 */
export const OUTLINE = {
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;

/**
 * Session-wide photo filters. Applied at render time to the USER's shots
 * only — reference photos, stickers and backgrounds are never filtered,
 * and the stored original photos are never modified.
 */
export interface FilterDef {
  id: string;
  label: string;
  css: string;
}

export const FILTERS: FilterDef[] = [
  { id: 'original', label: 'Original', css: 'none' },
  { id: 'soft', label: 'Soft', css: 'brightness(1.08) contrast(0.92) saturate(1.1)' },
  { id: 'pastel', label: 'Pastel', css: 'brightness(1.1) contrast(0.88) saturate(0.9)' },
  { id: 'warm', label: 'Warm', css: 'sepia(0.25) saturate(1.2) brightness(1.05) hue-rotate(-8deg)' },
  { id: 'cool', label: 'Cool', css: 'saturate(1.05) brightness(1.03) hue-rotate(12deg)' },
  { id: 'film', label: 'Film', css: 'contrast(1.1) saturate(0.9) sepia(0.15) brightness(1.02)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.5) contrast(0.95) saturate(0.85) brightness(1.05)' },
  { id: 'bw', label: 'B&W', css: 'grayscale(1) contrast(1.1)' },
];

/** CSS filter string for a filter id; unknown ids render unfiltered. */
export function getFilterCss(id: string): string {
  return FILTERS.find(f => f.id === id)?.css ?? 'none';
}

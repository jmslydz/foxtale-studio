import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Thick pastel squiggle line with rounded ends. */
export default function Squiggle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M5 30C8 24 11 24 14 28C17 32 20 32 23 28C26 24 29 24 32 28C35 32 38 32 41 28C43.5 24.8 44 22 43 18"
        stroke={C.lavenderDeep}
        strokeWidth={5}
        {...OUTLINE}
        fill="none"
      />
      <path
        d="M5 30C8 24 11 24 14 28C17 32 20 32 23 28C26 24 29 24 32 28C35 32 38 32 41 28C43.5 24.8 44 22 43 18"
        stroke={C.lavender}
        strokeWidth={2.4}
        {...OUTLINE}
        fill="none"
      />
    </svg>
  );
}

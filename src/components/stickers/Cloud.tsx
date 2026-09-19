import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Soft puffy cloud with a lighter outline. */
export default function Cloud({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M13 34C9.1 34 6 30.9 6 27C6 23.5 8.5 20.7 11.9 20.1C12.6 15 16.9 11 22.2 11C26.6 11 30.4 13.7 31.9 17.6C32.6 17.4 33.3 17.3 34 17.3C38.4 17.3 42 20.9 42 25.3C42 29.7 38.4 33.2 34 33.2L13 34Z"
        fill={C.sky}
        stroke={C.skyDeep}
        strokeWidth={1.5}
        {...OUTLINE}
      />
      <path
        d="M17 27.5C18.5 27.5 18.5 27.5 20 27.5"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        opacity={0.8}
        {...OUTLINE}
      />
    </svg>
  );
}

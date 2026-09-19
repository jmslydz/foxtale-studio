import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Crescent moon with a lighter outline and a tiny sparkle. */
export default function Moon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M29.5 6.5C22.5 8.6 17.5 15 17.5 22.5C17.5 31.6 24.9 39 34 39C36.2 39 38.3 38.6 40.2 37.8C36.7 41.9 31.5 44.5 25.7 44.5C15.1 44.5 6.5 35.9 6.5 25.3C6.5 15.9 13.3 8.1 22.2 6.4C24.6 5.9 27.1 5.9 29.5 6.5Z"
        fill={C.yellow}
        stroke={C.yellowDeep}
        strokeWidth={1.5}
        {...OUTLINE}
      />
      <path
        d="M37 14C37.4 16.8 37.9 17.6 40.4 18.1C40.8 18.2 40.8 18.6 40.4 18.7C37.9 19.2 37.4 20 37 22.8C36.6 20 36.1 19.2 33.6 18.7C33.2 18.6 33.2 18.2 33.6 18.1C36.1 17.6 36.6 16.8 37 14Z"
        fill="#FFFFFF"
        stroke={C.yellowDeep}
        strokeWidth={1.2}
        {...OUTLINE}
      />
    </svg>
  );
}

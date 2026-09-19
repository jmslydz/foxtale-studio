import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Small moon with two companion stars. */
export default function MoonAndStars({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      {/* moon */}
      <path
        d="M25 7C18.5 9 14 15 14 22C14 30.3 20.7 37 29 37C31.5 37 33.9 36.4 36 35.3C33 39.2 28.3 41.7 23 41.7C13.9 41.7 6.5 34.3 6.5 25.2C6.5 16.7 13 9.7 21.3 8.7C22.5 8.6 23.8 7.5 25 7Z"
        fill={C.lavender}
        stroke={C.lavenderDeep}
        strokeWidth={1.5}
        {...OUTLINE}
      />
      {/* star 1 */}
      <path
        d="M36 13L37.6 17.4L42 19L37.6 20.6L36 25L34.4 20.6L30 19L34.4 17.4L36 13Z"
        fill={C.yellow}
        stroke={C.yellowDeep}
        strokeWidth={1.3}
        {...OUTLINE}
      />
      {/* star 2 */}
      <path
        d="M40 27L41 29.8L43.8 30.8L41 31.8L40 34.6L39 31.8L36.2 30.8L39 29.8L40 27Z"
        fill={C.pink}
        stroke={C.pinkDeep}
        strokeWidth={1.2}
        {...OUTLINE}
      />
    </svg>
  );
}

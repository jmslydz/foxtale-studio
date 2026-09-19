import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Five-point star with soft rounded points and a lighter outline. */
export default function Star5({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M24 5C24.9 5 25.7 5.6 26 6.4L29.9 16.5C30.1 17.1 30.7 17.5 31.3 17.5L42.1 18.1C43.7 18.2 44.4 20.2 43.1 21.2L34.7 27.7C34.2 28.1 34 28.8 34.2 29.4L37.5 39.7C38 41.2 36.4 42.5 35 41.7L25.7 36.1C25.3 35.9 24.7 35.9 24.3 36.1L15 41.7C13.6 42.5 12 41.2 12.5 39.7L15.8 29.4C16 28.8 15.8 28.1 15.3 27.7L6.9 21.2C5.6 20.2 6.3 18.2 7.9 18.1L18.7 17.5C19.3 17.5 19.9 17.1 20.1 16.5L24 6.4C24.3 5.6 25.1 5 24 5Z"
        fill={C.pink}
        stroke={C.pinkDeep}
        strokeWidth={1.5}
        {...OUTLINE}
      />
    </svg>
  );
}

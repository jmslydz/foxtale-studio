import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Small sparkle cluster: one big four-point sparkle with two little ones. */
export default function SparkleCluster({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      {/* big sparkle */}
      <path
        d="M20 8C21.2 16.5 22.4 18.6 30 20C30.9 20.2 30.9 20.8 30 21C22.4 22.4 21.2 24.5 20 33C18.8 24.5 17.6 22.4 10 21C9.1 20.8 9.1 20.2 10 20C17.6 18.6 18.8 16.5 20 8Z"
        fill={C.lavender}
        stroke={C.lavenderDeep}
        strokeWidth={1.5}
        {...OUTLINE}
      />
      {/* small sparkle top-right */}
      <path
        d="M36 22C36.7 26.7 37.4 27.9 41.5 28.7C42 28.8 42 29.2 41.5 29.3C37.4 30.1 36.7 31.3 36 36C35.3 31.3 34.6 30.1 30.5 29.3C30 29.2 30 28.8 30.5 28.7C34.6 27.9 35.3 26.7 36 22Z"
        fill={C.yellow}
        stroke={C.yellowDeep}
        strokeWidth={1.4}
        {...OUTLINE}
      />
      {/* tiny sparkle bottom-right */}
      <path
        d="M31 36C31.5 39.3 32 40.2 34.7 40.7C35.1 40.8 35.1 41.2 34.7 41.3C32 41.8 31.5 42.7 31 46C30.5 42.7 30 41.8 27.3 41.3C26.9 41.2 26.9 40.8 27.3 40.7C30 40.2 30.5 39.3 31 36Z"
        fill={C.mint}
        stroke={C.mintDeep}
        strokeWidth={1.3}
        {...OUTLINE}
      />
    </svg>
  );
}

import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Chunky pastel crown with rounded points and gem dots. */
export default function Crown({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M9 34L7 16C6.9 14.6 8.6 13.8 9.6 14.8L15.6 20.8C16.4 21.6 17.7 21.4 18.3 20.4L22.6 13.7C23.3 12.6 24.7 12.6 25.4 13.7L29.7 20.4C30.3 21.4 31.6 21.6 32.4 20.8L38.4 14.8C39.4 13.8 41.1 14.6 41 16L39 34C38.9 35.1 38 36 36.9 36L11.1 36C10 36 9.1 35.1 9 34Z"
        fill={C.yellow}
        stroke={C.yellowDeep}
        strokeWidth={1.5}
        {...OUTLINE}
      />
      {/* gems */}
      <circle cx="16" cy="29" r="2" fill={C.pinkDeep} />
      <circle cx="24" cy="29" r="2" fill={C.lavenderDeep} />
      <circle cx="32" cy="29" r="2" fill={C.mintDeep} />
    </svg>
  );
}

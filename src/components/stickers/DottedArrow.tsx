import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Dotted curved arrow ending in a soft rounded head. */
export default function DottedArrow({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      {/* dotted curve */}
      <path
        d="M6 38C12 38 14 34 18 28C21.5 22.7 26 18 34 14"
        stroke={C.pinkDeep}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="0.5 7"
        fill="none"
      />
      {/* arrow head */}
      <path
        d="M30 11.5C31.7 12.4 33.5 13.3 36.5 13.6C35.9 16.5 36.2 18.3 36.6 20.4"
        stroke={C.pinkDeep}
        strokeWidth={3.4}
        {...OUTLINE}
        fill="none"
      />
      {/* start dot */}
      <circle cx="6" cy="38" r="2.4" fill={C.pinkDeep} />
    </svg>
  );
}

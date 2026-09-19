import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Chunky pastel rainbow arc on a small cloud base. */
export default function Rainbow({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      {/* rainbow bands */}
      <path d="M8 32C8 22.1 16.1 14 26 14C35.9 14 44 22.1 44 32" stroke={C.pink} strokeWidth={4.6} {...OUTLINE} fill="none" />
      <path d="M13.4 32C13.4 25.1 19 19.5 26 19.5C33 19.5 38.6 25.1 38.6 32" stroke={C.yellow} strokeWidth={4.6} {...OUTLINE} fill="none" />
      <path d="M18.8 32C18.8 28 21.9 24.9 26 24.9C30.1 24.9 33.2 28 33.2 32" stroke={C.mint} strokeWidth={4.6} {...OUTLINE} fill="none" />
      {/* cloud puffs at both ends */}
      <circle cx="9" cy="33" r="5" fill={C.sky} stroke={C.skyDeep} strokeWidth={1.4} {...OUTLINE} />
      <circle cx="16" cy="34.5" r="4" fill={C.sky} stroke={C.skyDeep} strokeWidth={1.4} {...OUTLINE} />
      <circle cx="43" cy="33" r="5" fill={C.sky} stroke={C.skyDeep} strokeWidth={1.4} {...OUTLINE} />
      <circle cx="36" cy="34.5" r="4" fill={C.sky} stroke={C.skyDeep} strokeWidth={1.4} {...OUTLINE} />
    </svg>
  );
}

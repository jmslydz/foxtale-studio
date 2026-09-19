import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Tiny pastel camera with rounded body and lens. */
export default function SmallCamera({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      {/* body */}
      <rect x="6" y="14" width="36" height="24" rx="6" fill={C.sky} stroke={C.skyDeep} strokeWidth={1.5} {...OUTLINE} />
      {/* top hump + shutter button */}
      <path d="M17 14L19 9.5C19.3 8.9 19.9 8.5 20.6 8.5L27.4 8.5C28.1 8.5 28.7 8.9 29 9.5L31 14" fill={C.sky} stroke={C.skyDeep} strokeWidth={1.5} {...OUTLINE} />
      <rect x="34" y="9.5" width="6" height="4" rx="2" fill={C.pinkDeep} />
      {/* lens */}
      <circle cx="24" cy="26" r="7.5" fill="#FFFFFF" stroke={C.skyDeep} strokeWidth={1.5} {...OUTLINE} />
      <circle cx="24" cy="26" r="4.2" fill={C.lavenderDeep} />
      <circle cx="22.2" cy="24.2" r="1.4" fill="#FFFFFF" opacity={0.9} />
      {/* flash dot */}
      <circle cx="11.5" cy="19" r="1.6" fill={C.yellowDeep} />
    </svg>
  );
}

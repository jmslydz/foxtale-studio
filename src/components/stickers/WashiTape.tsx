import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Diagonal washi tape strip with zigzag torn ends. */
export default function WashiTape({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <g transform="rotate(-12 24 24)">
        <path
          d="M8 17L40 17L42 20L40 23L40 31L8 31L6 28L8 25L8 17Z"
          fill={C.peach}
          stroke={C.peachDeep}
          strokeWidth={1.5}
          {...OUTLINE}
        />
        {/* little pattern dots */}
        <circle cx="14" cy="24" r="1.6" fill={C.pinkDeep} />
        <circle cx="24" cy="21" r="1.6" fill={C.lavenderDeep} />
        <circle cx="24" cy="27" r="1.6" fill={C.mintDeep} />
        <circle cx="34" cy="24" r="1.6" fill={C.yellowDeep} />
        <circle cx="19" cy="24" r="1.2" fill="#FFFFFF" />
        <circle cx="29" cy="24" r="1.2" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

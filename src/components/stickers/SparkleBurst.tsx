import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Sparkle burst: central gem with rays bursting outward. */
export default function SparkleBurst({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      {/* burst rays */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 360) / 8;
        return (
          <g key={i} transform={`rotate(${angle} 24 24)`}>
            <path
              d="M24 4C24.7 9.5 25.5 11 30 12C30.5 12.1 30.5 12.9 30 13C25.5 14 24.7 15.5 24 21C23.3 15.5 22.5 14 18 13C17.5 12.9 17.5 12.1 18 12C22.5 11 23.3 9.5 24 4Z"
              fill={i % 2 === 0 ? C.pink : C.lavender}
              stroke={i % 2 === 0 ? C.pinkDeep : C.lavenderDeep}
              strokeWidth={1.3}
              {...OUTLINE}
            />
          </g>
        );
      })}
      {/* center gem */}
      <circle cx="24" cy="24" r="5.5" fill={C.yellow} stroke={C.yellowDeep} strokeWidth={1.5} {...OUTLINE} />
      <circle cx="24" cy="24" r="2.2" fill="#FFFFFF" opacity={0.9} />
    </svg>
  );
}

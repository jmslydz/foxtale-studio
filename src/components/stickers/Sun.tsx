import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Smiling-free flat sun: rounded core with soft rounded rays. */
export default function Sun({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      {/* rays */}
      {[
        { x: 24, y: 5, r: 0 },
        { x: 37.5, y: 10.5, r: 45 },
        { x: 43, y: 24, r: 90 },
        { x: 37.5, y: 37.5, r: 135 },
        { x: 24, y: 43, r: 180 },
        { x: 10.5, y: 37.5, r: 225 },
        { x: 5, y: 24, r: 270 },
        { x: 10.5, y: 10.5, r: 315 },
      ].map((ray, i) => (
        <rect
          key={i}
          x={ray.x - 1.6}
          y={ray.y - 5.4}
          width={3.2}
          height={6.4}
          rx={1.6}
          fill={C.yellowDeep}
          transform={`rotate(${ray.r} ${ray.x} ${ray.y})`}
        />
      ))}
      <circle cx="24" cy="24" r="11" fill={C.yellow} stroke={C.yellowDeep} strokeWidth={1.5} {...OUTLINE} />
      <circle cx="20.5" cy="22" r="1.6" fill={C.peachDeep} />
      <circle cx="27.5" cy="22" r="1.6" fill={C.peachDeep} />
      <path
        d="M21 27C22 28.2 26 28.2 27 27"
        stroke={C.peachDeep}
        strokeWidth={1.5}
        {...OUTLINE}
      />
    </svg>
  );
}

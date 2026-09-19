import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Four-point sparkle — rounded diamond star with a lighter outline. */
export default function Sparkle4({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M24 4C25.5 15 27 17.5 38 19.5C39.5 19.8 39.5 20.2 38 20.5C27 22.5 25.5 25 24 36C22.5 25 21 22.5 10 20.5C8.5 20.2 8.5 19.8 10 19.5C21 17.5 22.5 15 24 4Z"
        fill={C.yellow}
        stroke={C.peachDeep}
        strokeWidth={1.5}
        {...OUTLINE}
      />
      <circle cx="24" cy="20" r="3.2" fill="#FFFFFF" opacity={0.85} />
    </svg>
  );
}

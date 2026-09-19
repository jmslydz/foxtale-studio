import { STICKER_COLORS as C, OUTLINE } from './colors';

/** Rounded speech bubble with a curled tail. */
export default function SpeechBubble({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M24 7C34 7 42 12.8 42 20C42 27.2 34 33 24 33C21.9 33 19.9 32.8 18 32.4C15.5 34.4 12.2 36.3 8.5 36.8C10.1 34.9 11.3 32.4 11.7 30.2C8 27.7 6 24 6 20C6 12.8 14 7 24 7Z"
        fill={C.mint}
        stroke={C.mintDeep}
        strokeWidth={1.5}
        {...OUTLINE}
      />
      {/* doodle dots inside */}
      <circle cx="17" cy="20" r="2" fill={C.mintDeep} />
      <circle cx="24" cy="20" r="2" fill={C.mintDeep} />
      <circle cx="31" cy="20" r="2" fill={C.mintDeep} />
    </svg>
  );
}

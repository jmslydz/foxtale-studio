import { findStickerDef } from '../../stickerCatalog';
import { type StickerDef } from '../../types';

/** Find a sticker definition by its id across all categories. */
export function getStickerDef(stickerId: string): StickerDef | undefined {
  return findStickerDef(stickerId);
}

interface StickerGlyphProps {
  id: string;
  size: number;
  /** Emoji font size; defaults to 0.9 * size (the %-of-canvas sizing rule). */
  emojiFontSize?: number;
}

/**
 * Renders one sticker by id: hand-drawn SVG, image src, or emoji.
 * The single place any sticker is drawn.
 */
export default function StickerGlyph({ id, size, emojiFontSize }: StickerGlyphProps) {
  const def = getStickerDef(id);
  if (!def) return null;
  if (def.Svg) {
    const Svg = def.Svg;
    return <Svg size={size} />;
  }
  if (def.src) {
    return (
      <img
        src={import.meta.env.BASE_URL + def.src}
        alt={def.label}
        draggable={false}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          pointerEvents: 'none',
        }}
      />
    );
  }
  return (
    <span
      style={{
        fontSize: emojiFontSize ?? size * 0.9,
        lineHeight: 1,
        display: 'inline-block',
        width: size,
        height: size,
        textAlign: 'center',
      }}
    >
      {def.emoji}
    </span>
  );
}

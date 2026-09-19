import StickerGlyph from './stickers/StickerGlyph';
import type { StickerDef } from '../types';

interface StickerTileProps {
  sticker: StickerDef;
  onClick: () => void;
}

export default function StickerTile({ sticker, onClick }: StickerTileProps) {
  return (
    <button
      onClick={onClick}
      title={`Add ${sticker.label}`}
      className="w-12 h-12 rounded-xl bg-booth-bg border border-booth-border flex items-center justify-center transition-all duration-150 hover:scale-110 hover:bg-booth-lavender hover:border-booth-violet hover:shadow-sm focus:outline-none active:scale-95"
    >
      <StickerGlyph id={sticker.id} size={24} />
    </button>
  );
}

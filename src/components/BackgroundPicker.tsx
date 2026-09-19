import { BG_COLORS } from '../types';
import { IMAGE_BACKGROUNDS } from '../stickerCatalog';
import ColorSwatch from './ColorSwatch';

interface BackgroundPickerProps {
  bgColor: string;
  bgImage: string | null;
  onSetBgColor: (c: string) => void;
  onSetBgImage: (src: string) => void;
  /** Compact mode (Editor tab): 32px swatches, 4-column image grid. */
  compact?: boolean;
}

/** Background panel: color swatches + manifest image grid (reused by Setup + Editor). */
export default function BackgroundPicker({
  bgColor,
  bgImage,
  onSetBgColor,
  onSetBgImage,
  compact = false,
}: BackgroundPickerProps) {
  return (
    <>
      <p className="text-xs font-black text-booth-text uppercase tracking-wider mb-3">Strip Color</p>
      <div className="grid grid-cols-4 gap-2">
        {BG_COLORS.map(c => (
          <ColorSwatch
            key={c.value}
            color={c.value}
            label={c.label}
            compact={compact}
            selected={bgColor === c.value && !bgImage}
            onClick={() => onSetBgColor(c.value)}
          />
        ))}
      </div>

      {IMAGE_BACKGROUNDS.length > 0 && (
        <>
          <p className="text-xs font-black text-booth-text uppercase tracking-wider mt-5 mb-3">
            Strip Image
          </p>
          <div className={compact ? 'grid grid-cols-4 gap-2' : 'grid grid-cols-3 gap-2'}>
            {IMAGE_BACKGROUNDS.map(bg => (
              <button
                key={bg.id}
                title={bg.label}
                onClick={() => onSetBgImage(bg.src)}
                className={[
                  'h-14 rounded-lg overflow-hidden border-2 transition-all duration-150 bg-booth-bg',
                  bgImage === bg.src
                    ? 'border-booth-violet shadow-md shadow-booth-lavender/60'
                    : 'border-booth-border hover:border-booth-lavender',
                ].join(' ')}
              >
                <img
                  src={import.meta.env.BASE_URL + bg.src}
                  alt={bg.label}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

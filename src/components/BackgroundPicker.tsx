import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { BG_COLORS } from '../types';
import { getAllBackgrounds, addCustomBackgrounds, getCustomBackgrounds, resolvePublicSrc } from '../stickerCatalog';
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
  // Re-render when uploads land (registry is module-level).
  const [, bumpCustom] = useState(0);
  const uploadRef = useRef<HTMLInputElement>(null);
  const backgrounds = getAllBackgrounds();

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imgs.length === 0) return;
    const created = addCustomBackgrounds(
      imgs.map(f => ({
        src: URL.createObjectURL(f),
        label: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'My background',
      })),
    );
    if (created.length > 0) onSetBgImage(created[0].src);
    bumpCustom(n => n + 1);
  };

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

      {backgrounds.length > 0 && (
        <>
          <p className="text-xs font-black text-booth-text uppercase tracking-wider mt-5 mb-3">
            Strip Image
          </p>
          <div className={compact ? 'grid grid-cols-4 gap-2' : 'grid grid-cols-3 gap-2'}>
            <button
              onClick={() => uploadRef.current?.click()}
              title="Upload your own background"
              className="h-14 rounded-lg overflow-hidden border-2 border-dashed border-booth-lavender text-booth-violet flex flex-col items-center justify-center gap-0.5 hover:border-booth-violet hover:bg-booth-lavender/30 transition-all duration-150"
            >
              <Upload size={14} strokeWidth={2.5} />
              <span className="text-[9px] font-bold leading-none">Upload</span>
            </button>
            {backgrounds.map(bg => (
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
                  src={resolvePublicSrc(bg.src)}
                  alt={bg.label}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          {getCustomBackgrounds().length > 0 && (
            <p className="text-[11px] text-booth-muted mt-1.5">
              Your uploads last for this visit
            </p>
          )}
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => {
              handleUpload(e.target.files);
              e.target.value = '';
            }}
          />
        </>
      )}
    </>
  );
}

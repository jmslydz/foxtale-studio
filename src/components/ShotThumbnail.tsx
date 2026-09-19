import { type Shot, PASTEL_PHOTO_COLORS } from '../types';
import { getFilterCss } from '../lib/filters';

interface ShotThumbnailProps {
  shot?: Shot;
  index: number;
  total: number;
  /** Real capture aspect (w/h) so the photo shows uncropped. */
  aspect?: number;
  /** Cell width in px, computed by fitGrid (defaults to natural grid width). */
  width?: number;
  /** Session filter for the USER's shot. */
  filterId?: string;
  onRetake: () => void;
}

export default function ShotThumbnail({
  shot,
  index,
  total,
  aspect = 4 / 3,
  width,
  filterId = 'original',
  onRetake,
}: ShotThumbnailProps) {
  const palette = PASTEL_PHOTO_COLORS[index % PASTEL_PHOTO_COLORS.length];
  const bg = `linear-gradient(135deg, ${palette.from}, ${palette.to})`;

  return (
    <div className="flex flex-col items-center gap-2 group" style={width ? { width } : undefined}>
      <div
        className="relative w-full rounded-xl overflow-hidden border-2 border-booth-border shadow-sm"
        style={{ aspectRatio: `${aspect}` }}
      >
        {/* Real captured photo, or the pastel fallback when empty */}
        {shot ? (
          <img
            src={shot.url}
            alt={`Shot ${index + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            style={{ filter: getFilterCss(filterId) }}
          />
        ) : (
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{ background: bg }}
          />
        )}
        <div className="absolute bottom-1.5 left-0 right-0 flex justify-center">
          <span className="bg-white/80 text-booth-text text-[10px] font-bold px-2 py-0.5 rounded-full">
            Shot {index + 1}/{total}
          </span>
        </div>
      </div>
      <button
        onClick={onRetake}
        className="w-full text-xs font-bold text-booth-violet bg-booth-lavender hover:bg-booth-violet hover:text-white px-3 py-1.5 rounded-full transition-all duration-150"
      >
        Retake
      </button>
    </div>
  );
}

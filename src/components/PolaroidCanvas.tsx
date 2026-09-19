import { type PlacedSticker, type PlacedPolaroid, type Shot, STICKER_SIZE_MIN, STICKER_SIZE_MAX } from '../types';
import useElementWidth from '../hooks/useElementWidth';
import PolaroidCard from './PolaroidCard';
import StickerGlyph from './stickers/StickerGlyph';
import SelectionBox from './SelectionBox';

interface PolaroidCanvasProps {
  polaroids: PlacedPolaroid[];
  shots: Shot[];
  bgColor: string;
  bgImage?: string | null;
  stickers?: PlacedSticker[];
  caption?: string;
  showDate?: boolean;
  /** Session filter, applied to the USER's shots only. */
  filterId?: string;
  /** Rendered canvas height in pixels; width follows the 9:16 ratio. */
  height: number;
  interactive?: boolean;
  selectedPolaroidId?: string | null;
  selectedStickerId?: string | null;
  /** Pointer-based move-only drag for cards. */
  onPolaroidPointerDown?: (e: React.PointerEvent, id: string) => void;
  /** Corner-handle uniform resize: new width in % of canvas width. */
  onPolaroidResize?: (id: string, width: number) => void;
  /** Rotate-handle absolute rotation in degrees. */
  onPolaroidRotateAbs?: (id: string, rotation: number) => void;
  onStickerPointerDown?: (e: React.PointerEvent, id: string) => void;
  /** Absolute resize from the corner-handle gesture, in % of canvas width. */
  onStickerResizePct?: (id: string, sizePct: number) => void;
  /** Absolute rotation from the rotate-handle gesture (degrees). */
  onStickerRotateAbs?: (id: string, rotation: number) => void;
  onStickerDelete?: (id: string) => void;
  onCanvasClick?: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  /** Drag-to-bin: shown while a sticker or card is being dragged. */
  onStickerDragStateChange?: (dragging: boolean) => void;
}

const PASTELS = ['#FFD6E8', '#E8D5FF', '#C8F5E3', '#FFF3C4', '#C8E8FF', '#FFE5D0'];

/** The 9:16 polaroid canvas: background, then cards, then stickers on top. */
export default function PolaroidCanvas({
  polaroids,
  shots,
  bgColor,
  bgImage = null,
  stickers = [],
  caption = '',
  showDate = true,
  filterId = 'original',
  height,
  interactive = false,
  selectedPolaroidId,
  selectedStickerId,
  onPolaroidPointerDown,
  onPolaroidResize,
  onPolaroidRotateAbs,
  onStickerPointerDown,
  onStickerResizePct,
  onStickerRotateAbs,
  onStickerDelete,
  onCanvasClick,
  containerRef,
  onStickerDragStateChange,
}: PolaroidCanvasProps) {
  const canvasW = Math.round(height * (9 / 16));
  // Measured width of the rendered canvas (sticker sizePct -> px uses this).
  const { ref: widthRef, width: measuredW } = useElementWidth<HTMLDivElement>();

  return (
    <div
      ref={el => {
        containerRef && (containerRef.current = el);
        widthRef.current = el;
      }}
      data-testid="strip-canvas"
      onClick={onCanvasClick}
      style={{
        width: canvasW,
        height,
        background: bgColor || '#FFFFFF',
        backgroundImage: bgImage
          ? `url(${import.meta.env.BASE_URL + bgImage})`
          : undefined,
        backgroundSize: bgImage ? 'cover' : undefined,
        backgroundPosition: bgImage ? 'center' : undefined,
        position: 'relative',
        boxShadow: '0 4px 24px rgba(58,42,58,0.12)',
        borderRadius: Math.round(height * 0.02),
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Cards, in array order (selection re-orders to top) */}
      {polaroids.map(p => {
        const cardW = (p.width / 100) * canvasW;
        const isSelected = interactive && p.id === selectedPolaroidId;
        const shot = shots[p.shotIndex];
        return (
          <div
            key={p.id}
            onPointerDown={e => {
              if (!interactive) return;
              // Move only. Selection + top-of-order handled in the parent's handler.
              e.stopPropagation();
              onPolaroidPointerDown?.(e, p.id);
            }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: cardW,
              transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
              cursor: interactive ? 'grab' : 'default',
              userSelect: 'none',
              touchAction: 'none',
              borderRadius: 3,
            }}
          >
            <PolaroidCard
              width={cardW}
              photoUrl={shot?.url}
              filterId={filterId}
              placeholder={PASTELS[p.shotIndex % PASTELS.length]}
              caption={caption}
              showDate={showDate}
            />

            {/* Selection box: dashed outline + 4 corner resize handles + rotate handle */}
            {isSelected && (
              <SelectionBox
                rotation={p.rotation}
                minSize={(25 / 100) * canvasW}
                maxSize={(90 / 100) * canvasW}
                onResize={px => onPolaroidResize?.(p.id, (px / canvasW) * 100)}
                onRotate={deg => onPolaroidRotateAbs?.(p.id, deg)}
              />
            )}
          </div>
        );
      })}

      {/* Stickers render on top of the cards */}
      {stickers.map(sticker => {
        const isSelected = interactive && sticker.id === selectedStickerId;
        const sizePx = (measuredW * sticker.sizePct) / 100;
        return (
          <div
            key={sticker.id}
            onPointerDown={e => {
              if (!interactive) return;
              e.stopPropagation();
              onStickerDragStateChange?.(true);
              onStickerPointerDown?.(e, sticker.id);
            }}
            style={{
              position: 'absolute',
              left: `${sticker.x}%`,
              top: `${sticker.y}%`,
              // Fixed px box: never sized in % of the canvas, so the glyph can't
              // shrink near the edges while dragging.
              width: sizePx,
              height: sizePx,
              maxWidth: 'none',
              flexShrink: 0,
              transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
              cursor: interactive ? 'grab' : 'default',
              userSelect: 'none',
              zIndex: 10,
              borderRadius: 4,
              lineHeight: 1,
              touchAction: 'none',
            }}
          >
            <StickerGlyph id={sticker.stickerId} size={sizePx} emojiFontSize={sizePx * 0.9} />

            {isSelected && (
              <SelectionBox
                rotation={sticker.rotation}
                minSize={STICKER_SIZE_MIN * (measuredW / 100)}
                maxSize={STICKER_SIZE_MAX * (measuredW / 100)}
                onResize={px => onStickerResizePct?.(sticker.id, (px / (measuredW || 1)) * 100)}
                onRotate={deg => onStickerRotateAbs?.(sticker.id, deg)}
              />
            )}

            {isSelected && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: 30,
                  zIndex: 20,
                }}
              >
                <button
                  title="Delete"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onStickerDelete?.(sticker.id); }}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#FFB3C8',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#3A2A3A',
                    lineHeight: 1,
                    padding: 0,
                    touchAction: 'none',
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

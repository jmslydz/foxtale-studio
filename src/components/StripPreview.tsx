import { type Layout, type Mode, type PlacedSticker, type Shot, PASTEL_PHOTO_COLORS, STICKER_SIZE_MIN, STICKER_SIZE_MAX } from '../types';
import { getFilterCss } from '../lib/filters';
import { getPoseMatchGrid } from '../lib/poseMatchGrid';
import useElementWidth from '../hooks/useElementWidth';
import StickerGlyph from './stickers/StickerGlyph';
import SelectionBox from './SelectionBox';

interface StripPreviewProps {
  layout: Layout | 'pose-match';
  shots: Shot[];
  bgColor: string;
  bgImage?: string | null;
  stickers?: PlacedSticker[];
  caption?: string;
  showDate?: boolean;
  tilted?: boolean;
  /** Session filter, applied to the USER's shots only. */
  filterId?: string;
  /** pose-match: resolved reference for each row (samples carry a color instead of src). */
  poseRefs?: { label: string; src?: string; color?: string }[];
  /**
   * pose-match: THE authoritative pose count. When given, the grid derives
   * from it — never from poseRefs.length (which must equal poseCount anyway).
   * Setup previews pass poseCount with full-length poseRefs; Editor/Done pass
   * it with exactly one ref per pose so no placeholder rows can appear.
   */
  poseCount?: number;
  scale?: number;
  interactive?: boolean;
  selectedStickerId?: string | null;
  /** Pointer-based move-only drag (replaces mousedown drag). */
  onStickerPointerDown?: (e: React.PointerEvent, id: string) => void;
  /** Absolute resize from the corner-handle gesture, in % of canvas width. */
  onStickerResizePct?: (id: string, sizePct: number) => void;
  /** Absolute rotation from the rotate-handle gesture (degrees). */
  onStickerRotateAbs?: (id: string, rotation: number) => void;
  onStickerDelete?: (id: string) => void;
  onCanvasClick?: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  /** Drag-to-bin: shown while a sticker is being dragged. */
  onStickerDragStateChange?: (dragging: boolean) => void;
}

const TILT_ANGLES = [-1.5, 1.0, -0.8, 1.3, -1.1];
const STICKER_SIZE_MIN_PCT_LOCAL = STICKER_SIZE_MIN;
const STICKER_SIZE_MAX_PCT_LOCAL = STICKER_SIZE_MAX;

/** One pose-match reference cell: manifest photo or pastel fallback. */
function PoseReferenceCell({
  row,
  poseRefs,
  width,
  height,
}: {
  row: number;
  poseRefs: { label: string; src?: string; color?: string }[];
  width: number;
  height: number;
}) {
  const ref = poseRefs[row];
  return (
    <div
      data-cell
      style={{
        width,
        height,
        borderRadius: 2,
        overflow: 'hidden',
        flexShrink: 0,
        background: ref?.src
          ? undefined
          : ref?.color ??
            `linear-gradient(135deg, ${
              PASTEL_PHOTO_COLORS[row % PASTEL_PHOTO_COLORS.length].from
            }, ${PASTEL_PHOTO_COLORS[row % PASTEL_PHOTO_COLORS.length].to})`,
      }}
    >
      {ref?.src && (
        <img
          src={import.meta.env.BASE_URL + ref.src}
          alt={ref.label}
          className="w-full h-full object-cover"
          draggable={false}
        />
      )}
    </div>
  );
}

function PhotoFrame({
  colorIndex,
  shot,
  width,
  height,
  tilt,
  filterId,
  className,
}: {
  colorIndex: number;
  shot?: Shot;
  width: number;
  height: number;
  tilt?: number;
  /** Filter applies to the USER's shot only, never to references. */
  filterId?: string;
  className?: string;
}) {
  const palette = PASTEL_PHOTO_COLORS[colorIndex % PASTEL_PHOTO_COLORS.length];
  const bg = `linear-gradient(135deg, ${palette.from}, ${palette.to})`;
  return (
    <div
      data-cell
      className={['rounded-sm overflow-hidden flex-shrink-0', className].join(' ')}
      style={{
        width,
        height,
        background: bg,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
      }}
    >
      {/* Real captured photo over the pastel fallback */}
      {shot && (
        <img
          src={shot.url}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: getFilterCss(filterId ?? 'original') }}
        />
      )}
    </div>
  );
}

export default function StripPreview({
  layout,
  shots,
  bgColor,
  bgImage = null,
  stickers = [],
  caption = '',
  showDate = true,
  tilted = false,
  filterId = 'original',
  poseRefs = [],
  poseCount,
  scale = 1,
  interactive = false,
  selectedStickerId,
  onStickerPointerDown,
  onStickerResizePct,
  onStickerRotateAbs,
  onStickerDelete,
  onCanvasClick,
  containerRef,
  onStickerDragStateChange,
}: StripPreviewProps) {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Measure the strip's own width: sticker sizePct -> px uses THIS width, so
  // Editor, Done and export stay identical at any window size.
  const { ref: widthRef, width: stripWidth } = useElementWidth<HTMLDivElement>();

  // pose-match: THE layout source of truth (1 pose = portrait column with the
  // reference on TOP; 2-4 = 2 columns, user LEFT / reference RIGHT). The count
  // comes from the `poseCount` prop when provided, NEVER from array lengths —
  // array lengths may include display extras and would mint phantom cells.
  const poseGrid = getPoseMatchGrid(poseCount ?? Math.max(1, poseRefs.length || 1));

  const pad = Math.round(10 * scale);
  const gap = Math.round(4 * scale);
  const captionH = Math.round(44 * scale);

  let stripW: number;
  let stripH: number;
  let frameW: number;
  let frameH: number;

  if (layout === '4-landscape') {
    frameW = Math.round(90 * scale);
    frameH = Math.round(68 * scale);
    stripW = pad * 2 + frameW * 2 + gap;
    const rows = 2;
    stripH = pad * 2 + frameH * rows + gap * (rows - 1) + captionH;
  } else if (layout === 'pose-match') {
    frameW = Math.round(poseGrid.cellW * scale);
    frameH = Math.round(poseGrid.cellH * scale);
    stripW = pad * 2 + frameW * poseGrid.cols + gap * (poseGrid.cols - 1);
    stripH = pad * 2 + frameH * poseGrid.rows + gap * (poseGrid.rows - 1) + captionH;
  } else {
    frameW = Math.round(160 * scale);
    frameH = Math.round(120 * scale);
    const count = layout === '3-portrait' ? 3 : 4;
    stripW = pad * 2 + frameW;
    stripH = pad * 2 + frameH * count + gap * (count - 1) + captionH;
  }

  const renderFrames = () => {
    if (layout === 'pose-match') {
      if (poseGrid.referenceFirst) {
        // 1 pose: PORTRAIT column — reference on TOP, user's shot BELOW.
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            <PoseReferenceCell row={0} poseRefs={poseRefs} width={frameW} height={frameH} />
            <PhotoFrame colorIndex={0} shot={shots[0]} width={frameW} height={frameH} filterId={filterId} />
          </div>
        );
      }
      // 2-4 poses: left cell = user's shot, right cell = their reference.
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
          {Array.from({ length: poseGrid.rows }).map((_, row) => (
            <div key={row} style={{ display: 'flex', gap }}>
              <PhotoFrame
                colorIndex={row}
                shot={shots[row]}
                width={frameW}
                height={frameH}
                filterId={filterId}
              />
              <PoseReferenceCell row={row} poseRefs={poseRefs} width={frameW} height={frameH} />
            </div>
          ))}
        </div>
      );
    }

    if (layout === '4-landscape') {
      const indices = [0, 1, 2, 3];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
          {[0, 1].map(row => (
            <div key={row} style={{ display: 'flex', gap }}>
              {indices.slice(row * 2, row * 2 + 2).map(i => (
                <PhotoFrame
                  key={i}
                  colorIndex={i}
                  shot={shots[i]}
                  width={frameW}
                  height={frameH}
                  tilt={tilted ? TILT_ANGLES[i] : undefined}
                  filterId={filterId}
                />
              ))}
            </div>
          ))}
        </div>
      );
    }

    const count = layout === '3-portrait' ? 3 : 4;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {Array.from({ length: count }).map((_, i) => (
          <PhotoFrame
            key={i}
            colorIndex={i}
            shot={shots[i]}
            width={frameW}
            height={frameH}
            tilt={tilted ? TILT_ANGLES[i] : undefined}
            filterId={filterId}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      ref={el => {
        containerRef && (containerRef.current = el);
        widthRef.current = el;
      }}
      data-testid="strip-canvas"
      onClick={onCanvasClick}
      style={{
        width: stripW,
        height: stripH,
        background: bgColor || '#FFFFFF',
        backgroundImage: bgImage
          ? `url(${import.meta.env.BASE_URL + bgImage})`
          : undefined,
        backgroundSize: bgImage ? 'cover' : undefined,
        backgroundPosition: bgImage ? 'center' : undefined,
        position: 'relative',
        boxShadow: '0 4px 24px rgba(58,42,58,0.12)',
        borderRadius: Math.round(6 * scale),
        maxWidth: '100%',
        overflow: 'visible',
        cursor: interactive ? 'default' : undefined,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: pad,
          left: pad,
          right: pad,
        }}
      >
        {renderFrames()}
      </div>

      {/* Caption area */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: captionH,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          paddingBottom: Math.round(6 * scale),
        }}
      >
        {caption && (
          <span
            style={{
              fontSize: Math.round(9 * scale),
              fontWeight: 700,
              color: bgColor === '#2A1A2A' ? '#EEE' : '#3A2A3A',
              letterSpacing: '0.05em',
              textAlign: 'center',
              maxWidth: stripW - pad * 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {caption}
          </span>
        )}
        {showDate && (
          <span
            style={{
              fontSize: Math.round(8 * scale),
              color: bgColor === '#2A1A2A' ? '#AAA' : '#9A8A9A',
              fontStyle: 'italic',
            }}
          >
            {today}
          </span>
        )}
        {layout === 'pose-match' && (
          <span
            style={{
              fontSize: Math.round(7 * scale),
              // Fox orange — matches the printed footer in the PNG export
              // (renderStrip.ts draws the same color for pose strips).
              color: '#FF8A3D',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Foxtale Studio
          </span>
        )}
      </div>

      {/* Stickers */}
      {stickers.map(sticker => {
        const isSelected = interactive && sticker.id === selectedStickerId;
        // sizePct of the MEASURED strip width — identical rule as the export.
        const sizePx = (stripWidth * sticker.sizePct) / 100;
        return (
          <div
            key={sticker.id}
            onPointerDown={e => {
              if (!interactive) return;
              // Move only — no size change. Pointer capture keeps the drag alive
              // even when the cursor leaves the sticker or the pane edge.
              e.stopPropagation();
              onStickerDragStateChange?.(true);
              onStickerPointerDown?.(e, sticker.id);
            }}
            onClick={e => e.stopPropagation()}
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

            {/* Selection box: dashed outline + 4 corner resize handles + rotate handle */}
            {isSelected && (
              <SelectionBox
                rotation={sticker.rotation}
                minSize={STICKER_SIZE_MIN_PCT_LOCAL * (stripWidth / 100)}
                maxSize={STICKER_SIZE_MAX_PCT_LOCAL * (stripWidth / 100)}
                onResize={px => onStickerResizePct?.(sticker.id, (px / (stripWidth || 1)) * 100)}
                onRotate={deg => onStickerRotateAbs?.(sticker.id, deg)}
              />
            )}

            {/* Delete is the only per-sticker button */}
            {isSelected && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 3,
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

import { useRef, useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { type Mode, type Layout, type PlacedSticker, type PlacedPolaroid, type Shot, PASTEL_PHOTO_COLORS } from '../types';
import { ALL_STICKER_CATEGORIES, POSES } from '../stickerCatalog';
import { startMove } from '../hooks/useTransformGestures';
import useElementSize from '../hooks/useElementSize';
import { fitBox } from '../lib/fitLayout';
import { getPoseMatchGrid } from '../lib/poseMatchGrid';
import BottomBar from '../components/BottomBar';
import BackgroundPicker from '../components/BackgroundPicker';
import FilterPicker from '../components/FilterPicker';
import PolaroidCanvas from '../components/PolaroidCanvas';
import StickerTile from '../components/StickerTile';
import StripPreview from '../components/StripPreview';
import StickerGlyph from '../components/stickers/StickerGlyph';

interface EditorScreenProps {
  mode: Mode;
  layout: Layout;
  /** pose-match: manifest pose ids in pick order (empty when samples are used). */
  poseIds: string[];
  shots: Shot[];
  bgColor: string;
  bgImage: string | null;
  stickers: PlacedSticker[];
  caption: string;
  showDate: boolean;
  /** ONE session-wide filter for the user's shots. */
  filterId: string;
  selectedStickerId: string | null;
  polaroids: PlacedPolaroid[];
  selectedPolaroidId: string | null;
  onSetBgColor: (c: string) => void;
  onSetBgImage: (src: string) => void;
  onAddSticker: (stickerId: string) => void;
  onMoveSticker: (id: string, x: number, y: number) => void;
  onDeleteSticker: (id: string) => void;
  /** Absolute resize (% of canvas width) from the corner-handle gesture. */
  onResizeStickerPct: (id: string, sizePct: number) => void;
  /** Absolute rotation (deg) from the rotate-handle gesture. */
  onRotateStickerAbs: (id: string, rotation: number) => void;
  onSelectSticker: (id: string | null) => void;
  onSetCaption: (t: string) => void;
  onSetShowDate: (v: boolean) => void;
  onSetFilterId: (id: string) => void;
  onSelectPolaroid: (id: string | null) => void;
  onMovePolaroid: (id: string, x: number, y: number) => void;
  onResizePolaroid: (id: string, width: number) => void;
  /** Absolute rotation (deg) for cards from the rotate-handle gesture. */
  onRotatePolaroidAbs: (id: string, rotation: number) => void;
  onResetPolaroids: () => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function EditorScreen({
  mode,
  layout,
  poseIds,
  shots,
  bgColor,
  bgImage,
  stickers,
  caption,
  showDate,
  filterId,
  selectedStickerId,
  polaroids,
  selectedPolaroidId,
  onSetBgColor,
  onSetBgImage,
  onAddSticker,
  onMoveSticker,
  onDeleteSticker,
  onResizeStickerPct,
  onRotateStickerAbs,
  onSelectSticker,
  onSetCaption,
  onSetShowDate,
  onSetFilterId,
  onSelectPolaroid,
  onMovePolaroid,
  onResizePolaroid,
  onRotatePolaroidAbs,
  onResetPolaroids,
  onBack,
  onContinue,
}: EditorScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Center-pane size: fitBox sizes the strip as large as the pane allows.
  const { ref: paneRef, width: paneW, height: paneH } = useElementSize<HTMLDivElement>();
  // Set when a pointer drag just ended, so the trailing click doesn't deselect.
  const justDraggedRef = useRef(false);
  const [activeStickerCategory, setActiveStickerCategory] = useState(0);
  // While a sticker/card drag is live the bin fades in over the canvas.
  const [dragging, setDragging] = useState(false);
  const [binHover, setBinHover] = useState(false);
  const binRef = useRef<HTMLDivElement>(null);

  /** True when a move drag ends over the bin (pointer position vs bin rect). */
  const overBin = (e: PointerEvent) => {
    const bin = binRef.current;
    if (!bin) return false;
    const r = bin.getBoundingClientRect();
    return (
      e.clientX >= r.left && e.clientX <= r.right &&
      e.clientY >= r.top && e.clientY <= r.bottom
    );
  };

  const clearSelections = useCallback(() => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    onSelectSticker(null);
    onSelectPolaroid(null);
  }, [onSelectSticker, onSelectPolaroid]);

  /** Pointer-based move-only drag for stickers (capture keeps it alive past pane edges). */
  const handleStickerPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      const sticker = stickers.find(s => s.id === id);
      if (!sticker || !containerRef.current) return;
      onSelectSticker(id);
      onSelectPolaroid(null);
      startMove(e, {
        canvas: containerRef.current,
        initialX: sticker.x,
        initialY: sticker.y,
        clampX: [2, 98],
        clampY: [2, 98],
        onMove: (x, y, ev) => {
          onMoveSticker(id, x, y);
          // Hover highlight is driven from the drag pointer (bin ignores events).
          setBinHover(overBin(ev));
        },
        onEnd: (ev?: PointerEvent) => {
          setDragging(false);
          setBinHover(false);
          justDraggedRef.current = true;
          // Dropped on the bin deletes the sticker; anywhere else just drops it.
          if (ev && overBin(ev)) onDeleteSticker(id);
        },
      });
    },
    [stickers, onSelectSticker, onSelectPolaroid, onMoveSticker, onDeleteSticker],
  );

  /** Pointer-based move-only drag for polaroid cards (center stays inside the canvas). */
  const handlePolaroidPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      const card = polaroids.find(p => p.id === id);
      if (!card || !containerRef.current) return;
      onSelectPolaroid(id);
      onSelectSticker(null);
      startMove(e, {
        canvas: containerRef.current,
        initialX: card.x,
        initialY: card.y,
        clampX: [0, 100],
        clampY: [0, 100],
        onMove: (x, y) => onMovePolaroid(id, x, y),
        onEnd: () => {
          justDraggedRef.current = true;
          setDragging(false);
          setBinHover(false);
        },
      });
    },
    [polaroids, onSelectPolaroid, onSelectSticker, onMovePolaroid],
  );

  // pose-match: resolve the picked reference ids to manifest entries for the strip.
  const poseCount = mode === 'pose-match' ? Math.max(1, poseIds.length || 1) : 1;
  const poseGrid = getPoseMatchGrid(poseCount);
  const poseRefs =
    mode === 'pose-match'
      ? Array.from({ length: poseCount }).map((_, i) => {
          const pose = POSES.find(p => p.id === poseIds[i]);
          if (pose) return { label: pose.label, src: pose.src };
          const c = PASTEL_PHOTO_COLORS[i % PASTEL_PHOTO_COLORS.length];
          return { label: `Sample ${i + 1}`, color: `linear-gradient(135deg, ${c.from}, ${c.to})` };
        }).slice(0, poseCount)
      : [];

  // Intrinsic canvas aspect (width / height) of the current composition at
  // scale 1 — identical math to StripPreview / PolaroidCanvas / renderStrip.
  const canvasAspect =
    mode === 'polaroid'
      ? 9 / 16
      : mode === 'pose-match'
      ? (() => {
          const pad = 10, gap = 4, captionH = 44;
          const w = pad * 2 + poseGrid.cellW * poseGrid.cols + gap * (poseGrid.cols - 1);
          const h = pad * 2 + poseGrid.cellH * poseGrid.rows + gap * (poseGrid.rows - 1) + captionH;
          return w / h;
        })()
      : layout === '4-landscape'
      ? (() => {
          const w = 10 * 2 + 90 * 2 + 4;
          const h = 10 * 2 + 68 * 2 + 4 + 44;
          return w / h;
        })()
      : (() => {
          const count = layout === '3-portrait' ? 3 : 4;
          const w = 10 * 2 + 160;
          const h = 10 * 2 + 120 * count + 4 * (count - 1) + 44;
          return w / h;
        })();

  // Intrinsic strip width at scale 1 (same math as StripPreview), per mode.
  // StripPreview derives its px size from `scale`, so scale = target / intrinsic.
  const intrinsicW =
    mode === 'pose-match'
      ? 10 * 2 + poseGrid.cellW * poseGrid.cols + 4 * (poseGrid.cols - 1)
      : layout === '4-landscape'
      ? 10 * 2 + 90 * 2 + 4
      : 10 * 2 + 160;

  // fitBox: the strip is as large as the center pane allows (48px breathing room).
  const box = fitBox(canvasAspect, paneW - 48, paneH - 48);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
      {/* Left panel: stacked sections in one column; scrolls inside itself if tall */}
      <div className="w-full lg:w-60 shrink-0 border-b lg:border-b-0 lg:border-r border-booth-border bg-white flex flex-col overflow-y-auto">
        <div className="shrink-0 p-4 flex flex-col gap-5">
          {/* Strip color + Strip image */}
          <BackgroundPicker
            bgColor={bgColor}
            bgImage={bgImage}
            compact
            onSetBgColor={onSetBgColor}
            onSetBgImage={onSetBgImage}
          />

          {/* Filter */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-black text-booth-text uppercase tracking-wider">Filter</p>
            <FilterPicker value={filterId} onChange={onSetFilterId} />
          </div>

          {/* Reset positions (polaroid cards) */}
          <div className="flex flex-col gap-3">
            {mode === 'polaroid' ? (
              <button
                onClick={onResetPolaroids}
                className="w-full px-4 py-2 rounded-xl border-2 border-booth-border text-booth-muted font-bold text-xs hover:border-booth-violet hover:text-booth-violet transition-all duration-150"
              >
                Reset positions
              </button>
            ) : (
              <p className="text-xs text-booth-muted">
                {mode === 'pose-match'
                  ? 'Pose strips arrange themselves — pick poses in Setup.'
                  : 'Strip layout is chosen in Setup.'}
              </p>
            )}
          </div>

          {/* Caption (with the date toggle) */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-black text-booth-text uppercase tracking-wider">Caption</p>
            <input
              type="text"
              value={caption}
              onChange={e => onSetCaption(e.target.value)}
              maxLength={40}
              placeholder="Add a caption…"
              className="w-full border border-booth-border rounded-xl px-3 py-2 text-sm text-booth-text placeholder-booth-muted focus:outline-none focus:border-booth-violet bg-booth-bg"
            />
            <button
              onClick={() => onSetShowDate(!showDate)}
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-xl border transition-all duration-150',
                showDate ? 'border-booth-violet bg-booth-lavender/40' : 'border-booth-border',
              ].join(' ')}
            >
              <div
                className={[
                  'w-8 h-4 rounded-full relative transition-all duration-200',
                  showDate ? 'bg-booth-violet' : 'bg-booth-border',
                ].join(' ')}
              >
                <div
                  className={[
                    'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-200',
                    showDate ? 'left-4' : 'left-0.5',
                  ].join(' ')}
                />
              </div>
              <span className="text-xs font-bold text-booth-text">{showDate ? 'Show date' : 'Hide date'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Center: strip canvas, fitBox-sized */}
      <div
        ref={paneRef}
        className="flex-1 min-w-0 min-h-[320px] lg:min-h-0 flex items-center justify-center bg-[#F7F0F7] overflow-hidden relative"
        onClick={clearSelections}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle, #FF8A3D 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Drag-to-bin: fades in while a sticker is being dragged. */}
        <div
          ref={binRef}
          style={{
            position: 'absolute',
            bottom: 18,
            left: '50%',
            transform: `translateX(-50%) scale(${binHover ? 1.12 : 1})`,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: binHover ? '#FF8FA8' : '#FFB3C8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: dragging ? 1 : 0,
            pointerEvents: 'none',
            transition: 'opacity 200ms ease, transform 150ms ease, background 150ms ease',
            boxShadow: '0 4px 16px rgba(58,42,58,0.18)',
            zIndex: 40,
          }}
        >
          <Trash2 size={24} strokeWidth={1.75} color="#3A2A3A" />
        </div>

        {/* Strip at fitBox size — stickers are % of canvas width, so they scale too */}
        {box.width > 0 && (
          <div className="relative z-10">
            {mode === 'polaroid' ? (
              <PolaroidCanvas
                polaroids={polaroids}
                shots={shots}
                bgColor={bgColor}
                bgImage={bgImage}
                stickers={stickers}
                caption={caption}
                showDate={showDate}
                filterId={filterId}
                height={box.height}
                interactive
                selectedPolaroidId={selectedPolaroidId}
                selectedStickerId={selectedStickerId}
                onPolaroidPointerDown={handlePolaroidPointerDown}
                onPolaroidResize={onResizePolaroid}
                onPolaroidRotateAbs={onRotatePolaroidAbs}
                onStickerPointerDown={handleStickerPointerDown}
                onStickerResizePct={onResizeStickerPct}
                onStickerRotateAbs={onRotateStickerAbs}
                onStickerDelete={onDeleteSticker}
                onCanvasClick={clearSelections}
                containerRef={containerRef}
                onStickerDragStateChange={setDragging}
              />
            ) : (
              <StripPreview
                layout={mode === 'pose-match' ? 'pose-match' : layout}
                shots={shots}
                bgColor={bgColor}
                bgImage={bgImage}
                stickers={stickers}
                caption={caption}
                showDate={showDate}
                filterId={filterId}
                poseRefs={poseRefs}
                // THE authoritative pose count: never derive the grid from
                // array lengths (that minted phantom rows for 1 pose).
                poseCount={poseCount}
                // Render at the fitBox width: StripPreview derives strip px
                // from `scale`, so scale = target width / intrinsic width.
                scale={box.width / intrinsicW}
                interactive
                selectedStickerId={selectedStickerId}
                onStickerPointerDown={handleStickerPointerDown}
                onStickerResizePct={onResizeStickerPct}
                onStickerRotateAbs={onRotateStickerAbs}
                onStickerDelete={onDeleteSticker}
                onCanvasClick={clearSelections}
                containerRef={containerRef}
                onStickerDragStateChange={setDragging}
              />
            )}
          </div>
        )}
      </div>

      {/* Right panel: one vertical column — wraps; scrolls inside itself if tall */}
      <div data-testid="sticker-panel" className="w-full lg:w-64 shrink-0 border-t lg:border-t-0 lg:border-l border-booth-border bg-white flex flex-col overflow-y-auto">
        {/* Categories: wrapping pills */}
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-booth-border">
          <p className="text-xs font-black text-booth-text uppercase tracking-wider mb-2">Stickers</p>
          <div className="flex flex-wrap gap-2">
            {ALL_STICKER_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setActiveStickerCategory(i)}
                className={[
                  'px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap',
                  activeStickerCategory === i
                    ? 'bg-booth-violet text-white'
                    : 'bg-booth-bg border border-booth-border text-booth-muted hover:border-booth-violet hover:text-booth-violet',
                ].join(' ')}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tile grid: fills remaining height, scrolls inside itself if needed */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          <p className="text-xs font-bold text-booth-muted uppercase tracking-wider mb-2">
            {ALL_STICKER_CATEGORIES[activeStickerCategory]?.name}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {ALL_STICKER_CATEGORIES[activeStickerCategory]?.stickers.map(s => (
              <StickerTile
                key={s.id}
                sticker={s}
                onClick={() => onAddSticker(s.id)}
              />
            ))}
          </div>
        </div>

        {/* "On strip (N)": same thumbnail size, row wraps; pinned at bottom */}
        <div className="shrink-0 border-t border-booth-border px-4 py-3">
          <p className="text-xs font-bold text-booth-muted mb-1.5">On strip ({stickers.length})</p>
          {stickers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {stickers.map(s => (
                <button
                  key={s.id}
                  onClick={() => onSelectSticker(s.id)}
                  className={[
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-100',
                    selectedStickerId === s.id
                      ? 'bg-booth-lavender border border-booth-violet'
                      : 'bg-booth-bg border border-booth-border hover:border-booth-lavender',
                  ].join(' ')}
                >
                  <StickerGlyph id={s.stickerId} size={24} />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-booth-muted">No stickers yet — click one to add it.</p>
          )}
        </div>
      </div>
      </div>

      {/* Pinned full-width bottom bar: Back + Continue always visible */}
      <BottomBar>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-full border-2 border-booth-border text-booth-muted font-bold text-sm hover:border-booth-lavender hover:text-booth-violet transition-all duration-150"
        >
          Back to Review
        </button>
        <button
          onClick={onContinue}
          className="px-8 py-2.5 rounded-full bg-booth-violet text-white font-bold text-sm hover:scale-105 hover:shadow-lg hover:shadow-booth-lavender/50 transition-all duration-150"
        >
          Done
        </button>
      </BottomBar>
    </div>
  );
}

import { useRef, useState, useCallback, useEffect } from "react"
import { Trash2, ZoomIn, ZoomOut, Maximize2, X, Upload } from "lucide-react"
import {
  type Mode,
  type Layout,
  type PlacedSticker,
  type PlacedPolaroid,
  type Shot,
  PASTEL_PHOTO_COLORS,
} from "../types"
import {
  getAllStickerCategories,
  addCustomStickers,
  findPose,
  findStickerDef,
} from "../stickerCatalog"
import { startMove } from "../hooks/useTransformGestures"
import useElementSize from "../hooks/useElementSize"
import { fitBox } from "../lib/fitLayout"
import { getPoseMatchGrid } from "../lib/poseMatchGrid"
import BottomBar from "../components/BottomBar"
import CollapsiblePanel from "../components/CollapsiblePanel"
import BackgroundPicker from "../components/BackgroundPicker"
import { BRAND_SWATCHES, BRAND_AUTO } from "../lib/brandColor"
import FilterPicker from "../components/FilterPicker"
import PolaroidCanvas from "../components/PolaroidCanvas"
import StickerTile from "../components/StickerTile"
import StripPreview from "../components/StripPreview"
import StickerGlyph from "../components/stickers/StickerGlyph"

interface EditorScreenProps {
  mode: Mode
  layout: Layout
  /** pose-match: manifest pose ids in pick order (empty when samples are used). */
  poseIds: string[]
  shots: Shot[]
  bgColor: string
  bgImage: string | null
  stickers: PlacedSticker[]
  caption: string
  showDate: boolean
  /** ONE session-wide filter for the user's shots. */
  filterId: string
  /** Studio brand footer: 'auto' or hex (picker), plus the resolved color. */
  brandSetting: string
  brandColor: string
  selectedStickerId: string | null
  polaroids: PlacedPolaroid[]
  selectedPolaroidId: string | null
  onSetBgColor: (c: string) => void
  onSetBgImage: (src: string) => void
  onAddSticker: (stickerId: string) => void
  onMoveSticker: (id: string, x: number, y: number) => void
  onDeleteSticker: (id: string) => void
  /** Absolute resize (% of canvas width) from the corner-handle gesture. */
  onResizeStickerPct: (id: string, sizePct: number) => void
  /** Absolute rotation (deg) from the rotate-handle gesture. */
  onRotateStickerAbs: (id: string, rotation: number) => void
  onSelectSticker: (id: string | null) => void
  onSetCaption: (t: string) => void
  onSetShowDate: (v: boolean) => void
  onSetFilterId: (id: string) => void
  onSetBrandSetting: (v: string) => void
  onSelectPolaroid: (id: string | null) => void
  onMovePolaroid: (id: string, x: number, y: number) => void
  onResizePolaroid: (id: string, width: number) => void
  /** Absolute rotation (deg) for cards from the rotate-handle gesture. */
  onRotatePolaroidAbs: (id: string, rotation: number) => void
  onResetPolaroids: () => void
  onBack: () => void
  onContinue: () => void
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
  brandSetting,
  brandColor,
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
  onSetBrandSetting,
  onSelectPolaroid,
  onMovePolaroid,
  onResizePolaroid,
  onRotatePolaroidAbs,
  onResetPolaroids,
  onBack,
  onContinue,
}: EditorScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Center-pane size: fitBox sizes the strip as large as the pane allows.
  const {
    ref: paneRef,
    width: paneW,
    height: paneH,
  } = useElementSize<HTMLDivElement>()
  // Set when a pointer drag just ended, so the trailing click doesn't deselect.
  const justDraggedRef = useRef(false)
  const [activeStickerCategory, setActiveStickerCategory] = useState(0)
  // Compact layouts collapse settings by default so the canvas stays prominent.
  const compactViewport = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1280px)").matches
  const [panelOpen, setPanelOpen] = useState(compactViewport)
  const [stickerPanelOpen, setStickerPanelOpen] = useState(compactViewport)
  const stickerCats = getAllStickerCategories()
  const stickerUploadRef = useRef<HTMLInputElement>(null)

  /** Save → upload: image files become session stickers in "My Stickers". */
  const handleStickerUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (imgs.length === 0) return
    addCustomStickers(
      imgs.map((f) => ({
        src: URL.createObjectURL(f),
        label:
          f.name
            .replace(/\.[^.]+$/, "")
            .replace(/[-_]+/g, " ")
            .trim() || "My sticker",
      })),
    )
    const cats = getAllStickerCategories()
    const mine = cats.findIndex((c) => c.name === "My Stickers")
    if (mine !== -1) setActiveStickerCategory(mine)
  }
  // Canvas zoom (1 = fit): enlarges the strip so small stickers get bigger
  // touch targets and finer drags. Positions stay in % units, so zoom never
  // affects the export — it only changes the on-screen size.
  const [zoom, setZoom] = useState(1)
  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(3, Math.round((z + 0.5) * 10) / 10)),
    [],
  )
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10)),
    [],
  )
  const zoomReset = useCallback(() => setZoom(1), [])
  // Fullscreen popup editor: tap the expand button to edit big, pinch-free.
  // Only ONE canvas is ever mounted (main xor modal), so the shared
  // container/bin refs always point at the visible one.
  const [zoomOpen, setZoomOpen] = useState(false)
  const zoomDialogRef = useRef<HTMLDivElement>(null)
  const zoomCloseRef = useRef<HTMLButtonElement>(null)
  const {
    ref: modalPaneRef,
    width: modalW,
    height: modalH,
  } = useElementSize<HTMLDivElement>()
  const openZoom = useCallback(() => {
    setZoom(1)
    setZoomOpen(true)
  }, [])
  const closeZoom = useCallback(() => setZoomOpen(false), [])
  useEffect(() => {
    if (!zoomOpen) return
    const prev = document.body.style.overflow
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    document.body.style.overflow = "hidden"
    const frame = window.requestAnimationFrame(() =>
      zoomCloseRef.current?.focus(),
    )
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setZoomOpen(false)
        return
      }
      if (e.key !== "Tab") return
      const controls = zoomDialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )
      if (!controls?.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
      window.cancelAnimationFrame(frame)
      previousFocus?.focus()
    }
  }, [zoomOpen])
  // While a sticker/card drag is live the bin fades in over the canvas.
  const [dragging, setDragging] = useState(false)
  const [binHover, setBinHover] = useState(false)
  const binRef = useRef<HTMLDivElement>(null)

  /** True when a move drag ends over the bin (pointer position vs bin rect). */
  const overBin = (e: PointerEvent) => {
    const bin = binRef.current
    if (!bin) return false
    const r = bin.getBoundingClientRect()
    return (
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom
    )
  }

  const clearSelections = useCallback(() => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false
      return
    }
    onSelectSticker(null)
    onSelectPolaroid(null)
  }, [onSelectSticker, onSelectPolaroid])

  /** Pointer-based move-only drag for stickers (capture keeps it alive past pane edges). */
  const handleStickerPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      const sticker = stickers.find((s) => s.id === id)
      if (!sticker || !containerRef.current) return
      onSelectSticker(id)
      onSelectPolaroid(null)
      startMove(e, {
        canvas: containerRef.current,
        initialX: sticker.x,
        initialY: sticker.y,
        clampX: [2, 98],
        clampY: [2, 98],
        onMove: (x, y, ev) => {
          onMoveSticker(id, x, y)
          // Hover highlight is driven from the drag pointer (bin ignores events).
          setBinHover(overBin(ev))
        },
        onEnd: (ev?: PointerEvent) => {
          setDragging(false)
          setBinHover(false)
          justDraggedRef.current = true
          // Dropped on the bin deletes the sticker; anywhere else just drops it.
          if (ev && overBin(ev)) onDeleteSticker(id)
        },
      })
    },
    [
      stickers,
      onSelectSticker,
      onSelectPolaroid,
      onMoveSticker,
      onDeleteSticker,
    ],
  )

  /** Pointer-based move-only drag for polaroid cards (center stays inside the canvas). */
  const handlePolaroidPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      const card = polaroids.find((p) => p.id === id)
      if (!card || !containerRef.current) return
      onSelectPolaroid(id)
      onSelectSticker(null)
      startMove(e, {
        canvas: containerRef.current,
        initialX: card.x,
        initialY: card.y,
        clampX: [0, 100],
        clampY: [0, 100],
        onMove: (x, y) => onMovePolaroid(id, x, y),
        onEnd: () => {
          justDraggedRef.current = true
          setDragging(false)
          setBinHover(false)
        },
      })
    },
    [polaroids, onSelectPolaroid, onSelectSticker, onMovePolaroid],
  )

  const handleCanvasKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    const sticker = stickers.find((item) => item.id === selectedStickerId)
    const polaroid = polaroids.find((item) => item.id === selectedPolaroidId)
    if (!sticker && !polaroid) return

    const step = event.shiftKey ? 2 : 0.5
    if (event.key.startsWith("Arrow")) {
      event.preventDefault()
      if (sticker) {
        const x =
          sticker.x +
          (event.key === "ArrowLeft"
            ? -step
            : event.key === "ArrowRight"
              ? step
              : 0)
        const y =
          sticker.y +
          (event.key === "ArrowUp"
            ? -step
            : event.key === "ArrowDown"
              ? step
              : 0)
        onMoveSticker(
          sticker.id,
          Math.max(2, Math.min(98, x)),
          Math.max(2, Math.min(98, y)),
        )
      } else if (polaroid) {
        const x =
          polaroid.x +
          (event.key === "ArrowLeft"
            ? -step
            : event.key === "ArrowRight"
              ? step
              : 0)
        const y =
          polaroid.y +
          (event.key === "ArrowUp"
            ? -step
            : event.key === "ArrowDown"
              ? step
              : 0)
        onMovePolaroid(
          polaroid.id,
          Math.max(0, Math.min(100, x)),
          Math.max(0, Math.min(100, y)),
        )
      }
      return
    }

    if (event.key === "+" || event.key === "=") {
      event.preventDefault()
      if (sticker)
        onResizeStickerPct(
          sticker.id,
          sticker.sizePct + (event.shiftKey ? 5 : 2),
        )
      if (polaroid)
        onResizePolaroid(polaroid.id, polaroid.width + (event.shiftKey ? 5 : 2))
      return
    }
    if (event.key === "-") {
      event.preventDefault()
      if (sticker)
        onResizeStickerPct(
          sticker.id,
          sticker.sizePct - (event.shiftKey ? 5 : 2),
        )
      if (polaroid)
        onResizePolaroid(polaroid.id, polaroid.width - (event.shiftKey ? 5 : 2))
      return
    }
    if (event.key === "[" || event.key === "]") {
      event.preventDefault()
      const turn = event.key === "[" ? -5 : 5
      if (sticker) onRotateStickerAbs(sticker.id, sticker.rotation + turn)
      if (polaroid) onRotatePolaroidAbs(polaroid.id, polaroid.rotation + turn)
      return
    }
    if ((event.key === "Delete" || event.key === "Backspace") && sticker) {
      event.preventDefault()
      onDeleteSticker(sticker.id)
    }
  }

  // pose-match: resolve the picked reference ids to manifest entries for the strip.
  const poseCount = mode === "pose-match" ? Math.max(1, poseIds.length || 1) : 1
  const poseGrid = getPoseMatchGrid(poseCount)
  const poseRefs =
    mode === "pose-match"
      ? Array.from({ length: poseCount })
          .map((_, i) => {
            const pose = findPose(poseIds[i])
            if (pose) return { label: pose.label, src: pose.src }
            const c = PASTEL_PHOTO_COLORS[i % PASTEL_PHOTO_COLORS.length]
            return {
              label: `Sample ${i + 1}`,
              color: `linear-gradient(135deg, ${c.from}, ${c.to})`,
            }
          })
          .slice(0, poseCount)
      : []

  // Intrinsic canvas aspect (width / height) of the current composition at
  // scale 1 — identical math to StripPreview / PolaroidCanvas / renderStrip.
  const canvasAspect =
    mode === "polaroid"
      ? 9 / 16
      : mode === "pose-match"
        ? (() => {
            const pad = 10,
              gap = 4,
              captionH = 44
            const w =
              pad * 2 +
              poseGrid.cellW * poseGrid.cols +
              gap * (poseGrid.cols - 1)
            const h =
              pad * 2 +
              poseGrid.cellH * poseGrid.rows +
              gap * (poseGrid.rows - 1) +
              captionH
            return w / h
          })()
        : layout === "4-landscape"
          ? (() => {
              const w = 10 * 2 + 90 * 2 + 4
              const h = 10 * 2 + 68 * 2 + 4 + 44
              return w / h
            })()
          : (() => {
              const count = layout === "3-portrait" ? 3 : 4
              const w = 10 * 2 + 160
              const h = 10 * 2 + 120 * count + 4 * (count - 1) + 44
              return w / h
            })()

  // Intrinsic strip width at scale 1 (same math as StripPreview), per mode.
  // StripPreview derives its px size from `scale`, so scale = target / intrinsic.
  const intrinsicW =
    mode === "pose-match"
      ? 10 * 2 + poseGrid.cellW * poseGrid.cols + 4 * (poseGrid.cols - 1)
      : layout === "4-landscape"
        ? 10 * 2 + 90 * 2 + 4
        : 10 * 2 + 160

  // fitBox: the strip is as large as the center pane allows (48px breathing room).
  const box = fitBox(canvasAspect, paneW - 48, paneH - 48)
  // Same fit inside the fullscreen popup (48px breathing room for the p-6 frame).
  const modalBox = fitBox(
    canvasAspect,
    Math.max(0, modalW - 48),
    Math.max(0, modalH - 48),
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col animate-screen-in">
      <div className="flex-1 min-h-0 flex flex-col xl:flex-row pb-20 xl:pb-0">
        {/* Left panel: stacked sections in one column; scrolls inside itself if tall */}
        <div className="w-full xl:w-60 shrink-0 border-b xl:border-b-0 xl:border-r border-booth-border bg-white flex flex-col overflow-y-auto order-2 xl:order-none">
          <CollapsiblePanel
            title="Canvas settings"
            open={panelOpen}
            onToggle={() => setPanelOpen((o) => !o)}
          >
            <div className="shrink-0 p-4 flex flex-col gap-5">
              {/* Strip color + Strip image */}
              <BackgroundPicker
                bgColor={bgColor}
                bgImage={bgImage}
                compact
                onSetBgColor={onSetBgColor}
                onSetBgImage={onSetBgImage}
              />

              {/* Studio brand footer color (Auto reads the background) */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-black text-booth-text uppercase tracking-wider">
                  Brand
                </p>
                <div className="flex flex-wrap gap-2">
                  {BRAND_SWATCHES.map((s) => {
                    const selected = brandSetting === s.value
                    const dotColor =
                      s.value === BRAND_AUTO ? brandColor : s.value
                    return (
                      <button
                        key={s.value}
                        onClick={() => onSetBrandSetting(s.value)}
                        title={
                          s.label === "Auto"
                            ? "Auto (matches the background)"
                            : s.label
                        }
                        className={[
                          "flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-xs font-bold transition-all duration-150 border",
                          selected
                            ? "border-booth-violet bg-booth-lavender/40 text-booth-violet"
                            : "border-booth-border text-booth-muted hover:border-booth-lavender hover:text-booth-violet",
                        ].join(" ")}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-black/10"
                          style={{ background: dotColor }}
                        />
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Filter */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-black text-booth-text uppercase tracking-wider">
                  Filter
                </p>
                <FilterPicker value={filterId} onChange={onSetFilterId} />
              </div>

              {/* Reset positions (polaroid cards) */}
              <div className="flex flex-col gap-3">
                {mode === "polaroid" ? (
                  <button
                    onClick={onResetPolaroids}
                    className="w-full px-4 py-2 rounded-xl border-2 border-booth-border text-booth-muted font-bold text-xs hover:border-booth-violet hover:text-booth-violet transition-all duration-150"
                  >
                    Reset positions
                  </button>
                ) : (
                  <p className="text-xs text-booth-muted">
                    {mode === "pose-match"
                      ? "Pose strips arrange themselves — pick poses in Setup."
                      : "Strip layout is chosen in Setup."}
                  </p>
                )}
              </div>

              {/* Caption (with the date toggle) */}
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="photo-caption"
                  className="text-sm font-bold text-booth-text"
                >
                  Caption
                </label>
                <input
                  id="photo-caption"
                  type="text"
                  value={caption}
                  onChange={(e) => onSetCaption(e.target.value)}
                  maxLength={40}
                  placeholder="Add a caption…"
                  aria-describedby="photo-caption-help"
                  className="w-full min-h-11 border border-booth-border rounded-xl px-3 py-2 text-sm text-booth-text placeholder-booth-muted focus:outline-none focus:border-booth-violet bg-booth-bg"
                />
                <p
                  id="photo-caption-help"
                  className="flex justify-between gap-2 text-xs text-booth-muted"
                >
                  <span>Printed on your photo.</span>
                  <span>{caption.length}/40</span>
                </p>
                <button
                  onClick={() => onSetShowDate(!showDate)}
                  aria-label="Include the date on the photo"
                  aria-pressed={showDate}
                  className={[
                    "flex min-h-11 items-center gap-3 px-3 py-2 rounded-xl border transition-all duration-150",
                    showDate
                      ? "border-booth-violet bg-booth-lavender/40"
                      : "border-booth-border",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "w-8 h-4 rounded-full relative transition-all duration-200",
                      showDate ? "bg-booth-violet" : "bg-booth-border",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-200",
                        showDate ? "left-4" : "left-0.5",
                      ].join(" ")}
                    />
                  </div>
                  <span className="text-sm font-bold text-booth-text">
                    Date on photo
                  </span>
                  <span className="ml-auto text-xs text-booth-muted">
                    {showDate ? "On" : "Off"}
                  </span>
                </button>
              </div>
            </div>
          </CollapsiblePanel>
        </div>

        {/* Center: strip canvas, fitBox-sized (× zoom). Scrolls when zoomed in. */}
        <div
          ref={paneRef}
          className="flex-1 min-w-0 min-h-[360px] xl:min-h-0 bg-[#F7F0F7] relative focus:outline-none order-3 xl:order-none"
          role="region"
          aria-label="Photo canvas"
          aria-describedby="canvas-keyboard-help"
          tabIndex={0}
          onKeyDown={handleCanvasKeyDown}
          onClick={clearSelections}
        >
          <span id="canvas-keyboard-help" className="sr-only">
            Select an item using the controls in the sticker panel. Use arrow
            keys to move it, Shift plus arrow keys for larger moves, plus and
            minus to resize it, and left or right bracket to rotate it. Delete
            removes a selected sticker.
          </span>
          {/* Grid background (stays put while the zoomed canvas scrolls) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle, #FF8A3D 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Scrolls only when zoomed past fit — bars always hidden, pan by touch */}
          <div
            className={[
              "absolute inset-0 flex no-scrollbar",
              zoom === 1 ? "overflow-hidden" : "overflow-auto",
            ].join(" ")}
          >
            {!zoomOpen && (
              <>
                {/* Drag-to-bin: fades in while a sticker is being dragged. */}
                <div
                  ref={binRef}
                  style={{
                    position: "absolute",
                    bottom: 18,
                    left: "50%",
                    transform: `translateX(-50%) scale(${binHover ? 1.12 : 1})`,
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: binHover ? "#FF8FA8" : "#FFB3C8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: dragging ? 1 : 0,
                    pointerEvents: "none",
                    transition:
                      "opacity 200ms ease, transform 150ms ease, background 150ms ease",
                    boxShadow: "0 4px 16px rgba(58,42,58,0.18)",
                    zIndex: 40,
                  }}
                >
                  <Trash2 size={24} strokeWidth={1.75} color="#3A2A3A" />
                </div>

                {/* Strip at fitBox size × zoom — stickers are % of canvas width, so they scale too.
            m-auto centers when it fits and scrolls correctly when zoomed. */}
                {box.width > 0 && (
                  <div className="relative z-10 m-auto p-6">
                    {mode === "polaroid" ? (
                      <PolaroidCanvas
                        polaroids={polaroids}
                        shots={shots}
                        bgColor={bgColor}
                        bgImage={bgImage}
                        stickers={stickers}
                        caption={caption}
                        showDate={showDate}
                        filterId={filterId}
                        height={box.height * zoom}
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
                        layout={mode === "pose-match" ? "pose-match" : layout}
                        shots={shots}
                        bgColor={bgColor}
                        bgImage={bgImage}
                        stickers={stickers}
                        caption={caption}
                        showDate={showDate}
                        filterId={filterId}
                        brandColor={brandColor}
                        poseRefs={poseRefs}
                        // THE authoritative pose count: never derive the grid from
                        // array lengths (that minted phantom rows for 1 pose).
                        poseCount={poseCount}
                        // Render at the fitBox width × zoom: StripPreview derives strip px
                        // from `scale`, so scale = target width / intrinsic width.
                        scale={(box.width / intrinsicW) * zoom}
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
              </>
            )}
            {zoomOpen && (
              <div className="relative m-auto p-6">
                <p className="text-sm font-bold text-booth-muted bg-white/80 rounded-full px-5 py-2.5">
                  Editing fullscreen…
                </p>
              </div>
            )}
          </div>

          {/* Expand button: opens the fullscreen popup editor. */}
          {!zoomOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                openZoom()
              }}
              aria-label="Open fullscreen editor"
              className="absolute bottom-3 right-3 z-40 w-11 h-11 rounded-full border border-booth-border bg-white/95 shadow-lg flex items-center justify-center text-booth-text hover:scale-105 transition-all duration-150"
            >
              <Maximize2 size={18} strokeWidth={2} />
            </button>
          )}

          {/* Fullscreen popup editor: big canvas, zoom controls, same stickers. */}
          {zoomOpen && (
            <div
              ref={zoomDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="fullscreen-editor-title"
              className="fixed inset-0 z-50 flex flex-col bg-[#2A1F2E]/90 backdrop-blur-sm"
            >
              <div className="shrink-0 flex items-center justify-between px-4 py-3">
                <h2
                  id="fullscreen-editor-title"
                  className="font-black text-white"
                >
                  Edit canvas
                </h2>
                <button
                  ref={zoomCloseRef}
                  onClick={closeZoom}
                  aria-label="Close fullscreen editor"
                  className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all duration-150"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>

              <div
                ref={modalPaneRef}
                className="flex-1 min-h-0 overflow-auto no-scrollbar flex relative"
                role="region"
                aria-label="Fullscreen photo canvas"
                aria-describedby="canvas-keyboard-help"
                tabIndex={0}
                onKeyDown={handleCanvasKeyDown}
                onClick={clearSelections}
              >
                {/* Drag-to-bin for the popup canvas */}
                <div
                  ref={binRef}
                  style={{
                    position: "absolute",
                    bottom: 18,
                    left: "50%",
                    transform: `translateX(-50%) scale(${binHover ? 1.12 : 1})`,
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: binHover ? "#FF8FA8" : "#FFB3C8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: dragging ? 1 : 0,
                    pointerEvents: "none",
                    transition:
                      "opacity 200ms ease, transform 150ms ease, background 150ms ease",
                    boxShadow: "0 4px 16px rgba(58,42,58,0.18)",
                    zIndex: 40,
                  }}
                >
                  <Trash2 size={24} strokeWidth={1.75} color="#3A2A3A" />
                </div>

                {modalBox.width > 0 && (
                  <div className="relative m-auto p-6">
                    {mode === "polaroid" ? (
                      <PolaroidCanvas
                        polaroids={polaroids}
                        shots={shots}
                        bgColor={bgColor}
                        bgImage={bgImage}
                        stickers={stickers}
                        caption={caption}
                        showDate={showDate}
                        filterId={filterId}
                        height={modalBox.height * zoom}
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
                        layout={mode === "pose-match" ? "pose-match" : layout}
                        shots={shots}
                        bgColor={bgColor}
                        bgImage={bgImage}
                        stickers={stickers}
                        caption={caption}
                        showDate={showDate}
                        filterId={filterId}
                        brandColor={brandColor}
                        poseRefs={poseRefs}
                        poseCount={poseCount}
                        scale={(modalBox.width / intrinsicW) * zoom}
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

              <div className="shrink-0 flex items-center justify-center gap-3 px-4 py-3">
                <div className="flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-1">
                  <button
                    onClick={zoomOut}
                    disabled={zoom <= 1}
                    aria-label="Zoom out"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ZoomOut size={18} strokeWidth={2} />
                  </button>
                  <button
                    onClick={zoomReset}
                    aria-label="Reset zoom"
                    className="min-w-12 h-10 px-1 rounded-full text-xs font-black text-white hover:bg-white/10"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    onClick={zoomIn}
                    disabled={zoom >= 3}
                    aria-label="Zoom in"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ZoomIn size={18} strokeWidth={2} />
                  </button>
                </div>
                <button
                  onClick={closeZoom}
                  className="px-6 py-2.5 rounded-full bg-booth-violet text-white font-bold text-sm hover:scale-105 transition-all duration-150"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right panel: one vertical column — wraps; scrolls inside itself if tall */}
        <div
          data-testid="sticker-panel"
          className="w-full xl:w-64 shrink-0 border-t xl:border-t-0 xl:border-l border-booth-border bg-white flex flex-col overflow-y-auto order-first xl:order-none"
        >
          <CollapsiblePanel
            title="Sticker tools"
            meta={`${stickers.length} added`}
            open={stickerPanelOpen}
            onToggle={() => setStickerPanelOpen((open) => !open)}
            sticky
            scrollable
          >
            <div className="min-h-0 flex flex-col">
              {/* Categories: wrapping pills */}
              <div className="shrink-0 px-4 py-3 border-b border-booth-border">
                <p className="text-sm font-bold text-booth-text mb-2">
                  Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {stickerCats.map((cat, i) => (
                    <button
                      key={cat.name}
                      onClick={() => setActiveStickerCategory(i)}
                      aria-pressed={activeStickerCategory === i}
                      className={[
                        "min-h-10 px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-150 whitespace-nowrap",
                        activeStickerCategory === i
                          ? "bg-booth-violet text-white"
                          : "bg-booth-bg border border-booth-border text-booth-muted hover:border-booth-violet hover:text-booth-violet",
                      ].join(" ")}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tile grid: fills remaining height, scrolls inside itself if needed */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
                <p className="text-sm font-bold text-booth-text mb-2">
                  {(stickerCats[activeStickerCategory] ?? stickerCats[0])?.name}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => stickerUploadRef.current?.click()}
                    aria-label="Upload your own stickers"
                    className="aspect-square min-h-11 rounded-xl border-2 border-dashed border-booth-lavender text-booth-violet flex flex-col items-center justify-center gap-1 hover:border-booth-violet hover:bg-booth-lavender/30 transition-all duration-150"
                  >
                    <Upload size={16} strokeWidth={2.5} />
                    <span className="text-xs font-bold leading-none">
                      Upload
                    </span>
                  </button>
                  {(
                    stickerCats[activeStickerCategory] ?? stickerCats[0]
                  )?.stickers.map((s) => (
                    <StickerTile
                      key={s.id}
                      sticker={s}
                      onClick={() => onAddSticker(s.id)}
                    />
                  ))}
                </div>
                <input
                  ref={stickerUploadRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleStickerUpload(e.target.files)
                    e.target.value = ""
                  }}
                />
              </div>

              {mode === "polaroid" && (
                <div className="shrink-0 border-t border-booth-border px-4 py-3">
                  <p className="text-sm font-bold text-booth-text mb-2">
                    Photos on canvas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {polaroids.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => {
                          onSelectPolaroid(photo.id)
                          onSelectSticker(null)
                          paneRef.current?.focus()
                        }}
                        aria-label={`Select photo ${photo.shotIndex + 1}`}
                        aria-pressed={selectedPolaroidId === photo.id}
                        className={[
                          "min-h-10 px-3 rounded-xl border text-sm font-semibold transition-colors",
                          selectedPolaroidId === photo.id
                            ? "bg-booth-lavender border-booth-primary text-booth-primary"
                            : "bg-booth-bg border-booth-border text-booth-text hover:border-booth-primary",
                        ].join(" ")}
                      >
                        Photo {photo.shotIndex + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* "On strip (N)": same thumbnail size, row wraps, scrolls inside itself
            so piling on stickers never stretches the screen */}
              <div className="shrink-0 border-t border-booth-border px-4 py-3">
                <p className="text-sm font-bold text-booth-text mb-2">
                  On strip ({stickers.length})
                </p>
                {stickers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {stickers.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          onSelectSticker(s.id)
                          onSelectPolaroid(null)
                          paneRef.current?.focus()
                        }}
                        aria-label={`Select ${findStickerDef(s.stickerId)?.label ?? "sticker"}`}
                        aria-pressed={selectedStickerId === s.id}
                        className={[
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-100",
                          selectedStickerId === s.id
                            ? "bg-booth-lavender border border-booth-violet"
                            : "bg-booth-bg border border-booth-border hover:border-booth-lavender",
                        ].join(" ")}
                      >
                        <StickerGlyph id={s.stickerId} size={24} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-booth-muted">
                    No stickers yet. Choose one above to add it.
                  </p>
                )}
                {(selectedStickerId || selectedPolaroidId) && (
                  <p role="status" className="mt-2 text-xs text-booth-muted">
                    Selected {selectedStickerId ? "sticker" : "photo"}: use
                    arrow keys to move (Shift for larger steps), + / − to
                    resize, and [ / ] to rotate.
                    {selectedStickerId && " Press Delete to remove a sticker."}
                  </p>
                )}
              </div>
            </div>
          </CollapsiblePanel>
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
          Preview and download
        </button>
      </BottomBar>
    </div>
  )
}

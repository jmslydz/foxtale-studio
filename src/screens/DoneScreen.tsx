import { useState, useRef } from 'react';
import {
  PartyPopper,
  Check,
  Download,
  RotateCcw,
  Sparkles as SparkleIcon,
  Ribbon as RibbonIcon,
  Heart as HeartIcon,
} from 'lucide-react';
import { type Mode, type Layout, type PlacedSticker, type PlacedPolaroid, type Shot, PASTEL_PHOTO_COLORS } from '../types';
import { POSES, findStickerDef } from '../stickerCatalog';
import StripPreview from '../components/StripPreview';
import PolaroidCanvas from '../components/PolaroidCanvas';
import StickerGlyph from '../components/stickers/StickerGlyph';
import { renderStripToBlob } from '../lib/renderStrip';
import { fitBox } from '../lib/fitLayout';
import { getPoseMatchGrid } from '../lib/poseMatchGrid';
import useElementSize from '../hooks/useElementSize';
import BottomBar from '../components/BottomBar';

// Decorative icon aliases for the confetti background.
function SparkleDecor(props: { size: number; strokeWidth: number; color: string }) {
  return <SparkleIcon {...props} />;
}
function RibbonDecor(props: { size: number; strokeWidth: number; color: string }) {
  return <RibbonIcon {...props} />;
}
function HeartDecor(props: { size: number; strokeWidth: number; color: string }) {
  return <HeartIcon {...props} />;
}

interface DoneScreenProps {
  mode: Mode;
  layout: Layout;
  /** pose-match: manifest pose ids in pick order. */
  poseIds: string[];
  shots: Shot[];
  bgColor: string;
  bgImage: string | null;
  stickers: PlacedSticker[];
  caption: string;
  showDate: boolean;
  /** ONE session-wide filter for the user's shots (preview + export). */
  filterId: string;
  polaroids: PlacedPolaroid[];
  /** Back to the Editor — every edit is kept in App state. */
  onBack: () => void;
  onStartOver: () => void;
}

export default function DoneScreen({
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
  polaroids,
  onBack,
  onStartOver,
}: DoneScreenProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  // Hidden offscreen glyphs: SVG sticker defs are serialized from here so the
  // exported PNG draws them identically to the preview.
  const serializerRef = useRef<HTMLDivElement>(null);

  // Free area between the title and the pinned action bar.
  const { ref: areaRef, width: areaW, height: areaH } = useElementSize<HTMLDivElement>();

  // pose-match: resolve picked reference ids for the strip. poseRefs length
  // = poseCount (NOT rows) — no phantom rows for 1 pose anywhere.
  const poseCount = mode === 'pose-match' ? Math.max(1, poseIds.length) : 1;
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

  // Intrinsic composition aspect at scale 1 (same math as StripPreview /
  // PolaroidCanvas / renderStrip), so the final strip is fitBox-sized to the
  // available area and NEVER overflows on any desktop viewport.
  const isPolaroid = mode === 'polaroid';
  const composition = (() => {
    if (isPolaroid) {
      // PolaroidCanvas takes a height; the canvas is 9:16.
      return { w: 9 / 16, h: 1, kind: 'polaroid' as const };
    }
    if (mode === 'pose-match') {
      const w = 10 * 2 + poseGrid.cellW * poseGrid.cols + 4 * (poseGrid.cols - 1);
      const h = 10 * 2 + poseGrid.cellH * poseGrid.rows + 4 * (poseGrid.rows - 1) + 44;
      return { w, h, kind: 'strip' as const };
    }
    const landscape = layout === '4-landscape';
    const count = layout === '3-portrait' ? 3 : 4;
    const w = 10 * 2 + (landscape ? 90 * 2 + 4 : 160);
    const h = 10 * 2 + (landscape ? 68 * 2 + 4 : 120 * count + 4 * (count - 1)) + 44;
    return { w, h, kind: 'strip' as const };
  })();
  const aspect = composition.w / composition.h;
  const box = fitBox(aspect, areaW - 24, areaH - 24);

  const uniqueSvgStickerIds = [...new Set(stickers.map(s => s.stickerId))].filter(
    id => findStickerDef(id)?.Svg,
  );

  /** Serialize each hidden SVG glyph into a data URL for the canvas export. */
  const collectStickerImages = (): Map<string, string> => {
    const map = new Map<string, string>();
    const host = serializerRef.current;
    if (!host) return map;
    for (const el of host.querySelectorAll<HTMLElement>('[data-sticker-id]')) {
      const id = el.dataset.stickerId;
      const svg = el.querySelector('svg');
      if (!id || !svg) continue;
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      map.set(id, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`);
    }
    return map;
  };

  const handleDownload = async () => {
    try {
      const blob = await renderStripToBlob({
        mode,
        layout,
        shots,
        bgColor,
        bgImage,
        stickers,
        stickerImages: collectStickerImages(),
        caption,
        showDate,
        filterId,
        poseRefs,
        poseCount,
        polaroids,
        // 2x the on-screen composition: stickers scale with the export width
        // (sizePct of canvas width), so the file matches the Editor exactly.
        scale: 2,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foxtale-studio-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revoke a tick later so the download has started before the URL dies.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloadError(null);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error('Download failed:', err);
      setDownloadError('Could not save the image. Please try again.');
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col items-center relative overflow-hidden">
        {/* Confetti-ish decorations */}
        {[
          { Icon: PartyPopper, color: '#FF8A3D' },
          { Icon: SparkleDecor, color: '#FFB3C8' },
          { Icon: RibbonDecor, color: '#9EDFC4' },
          { Icon: HeartDecor, color: '#FFB3C8' },
          { Icon: SparkleDecor, color: '#FFE87A' },
          { Icon: PartyPopper, color: '#93CCFF' },
        ].map(({ Icon, color }, i) => (
          <span
            key={i}
            className="absolute select-none pointer-events-none"
            style={{
              left: `${5 + i * 16}%`,
              top: `${8 + (i % 3) * 28}%`,
              opacity: 0.35,
              transform: `rotate(${(i % 2 ? 1 : -1) * (12 + i * 7)}deg)`,
            }}
          >
            <Icon size={20 + (i % 3) * 10} strokeWidth={1.75} color={color} />
          </span>
        ))}

        <div className="shrink-0 text-center pt-4 pb-3 z-10">
          <h2 className="text-2xl font-black text-booth-text">Your strip is ready!</h2>
          <p className="text-booth-muted mt-1 text-sm">
            Looking cute! Download your strip or keep editing.
          </p>
        </div>

        {/* Final strip: fitBox-sized, never overflows */}
        <div ref={areaRef} className="flex-1 min-h-0 w-full flex items-center justify-center z-10">
          {box.width > 0 && (
            <div className="relative">
              <div
                className="absolute -inset-4 rounded-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, #FFE4CF55 0%, transparent 70%)',
                }}
              />
              {isPolaroid ? (
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
                  poseCount={poseCount}
                  scale={mode === 'pose-match'
                    ? box.width / (10 * 2 + poseGrid.cellW * poseGrid.cols + 4 * (poseGrid.cols - 1))
                    : box.width / (10 * 2 + (layout === '4-landscape' ? 90 * 2 + 4 : 160))}
                />
              )}
            </div>
          )}
        </div>

        {downloadError && (
          <p className="shrink-0 pb-1 text-xs font-bold text-booth-rose z-10">{downloadError}</p>
        )}

        {/* Hidden SVG sticker source for the PNG export */}
        <div
          ref={serializerRef}
          aria-hidden
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0 }}
        >
          {uniqueSvgStickerIds.map(id => (
            <div key={id} data-sticker-id={id}>
              <StickerGlyph id={id} size={64} />
            </div>
          ))}
        </div>
      </div>

      {/* Pinned actions: Download + Back (to Editor) + Start over */}
      <BottomBar>
        <button
          onClick={handleDownload}
          className={[
            'flex items-center gap-2 px-8 py-2.5 rounded-full font-black text-base transition-all duration-200',
            downloaded
              ? 'bg-booth-mint text-booth-text scale-95'
              : 'bg-booth-violet text-white hover:scale-105 hover:shadow-xl hover:shadow-booth-lavender/60',
          ].join(' ')}
        >
          {downloaded ? (
            <>
              <Check size={18} strokeWidth={2} /> Downloaded!
            </>
          ) : (
            <>
              <Download size={18} strokeWidth={2} /> Download PNG
            </>
          )}
        </button>

        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-full border-2 border-booth-border text-booth-muted font-bold text-sm hover:border-booth-violet hover:text-booth-violet transition-all duration-150"
        >
          Back to Editor
        </button>

        <button
          onClick={onStartOver}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-booth-border text-booth-muted font-bold text-sm hover:border-booth-rose hover:text-booth-rose transition-all duration-150"
        >
          <RotateCcw size={16} strokeWidth={2} /> Start Over
        </button>
      </BottomBar>
    </div>
  );
}

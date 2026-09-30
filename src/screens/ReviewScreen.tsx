import { type Mode, type Layout, type Shot, PASTEL_PHOTO_COLORS } from '../types';
import { POSES, getCustomPoses } from '../stickerCatalog';
import { type PoseRef } from '../types';
import { fitBox } from '../lib/fitLayout';
import { getPoseMatchGrid } from '../lib/poseMatchGrid';
import { defaultPolaroids } from '../lib/polaroidLayout';
import useElementSize from '../hooks/useElementSize';
import { useIsDesktop } from '../hooks/useIsDesktop';
import BottomBar from '../components/BottomBar';
import StripPreview from '../components/StripPreview';
import PolaroidCanvas from '../components/PolaroidCanvas';

interface ReviewScreenProps {
  mode: Mode;
  layout: Layout;
  poseCount: 1 | 2 | 3 | 4;
  selectedPoses: string[];
  polaroidCount: 1 | 2 | 3;
  shots: Shot[];
  /** ONE session-wide filter, applied to the USER's shots only. */
  filterId: string;
  onRetake: (i: number) => void;
  onBack: () => void;
  onContinue: () => void;
}

/** Sample tiles when public/poses/ has no images yet. */
const SAMPLE_POSES: (PoseRef & { color: string })[] = PASTEL_PHOTO_COLORS.slice(0, 6).map(
  (c, i) => ({
    id: `sample-pose-${i + 1}`,
    label: `Sample ${i + 1}`,
    category: 'Samples',
    src: '',
    color: `linear-gradient(135deg, ${c.from}, ${c.to})`,
  }),
);

export default function ReviewScreen({
  mode,
  layout,
  poseCount,
  selectedPoses,
  polaroidCount,
  shots,
  filterId,
  onRetake,
  onBack,
  onContinue,
}: ReviewScreenProps) {
  // pose-match: resolve picked reference ids (uploads first, then manifest).
  const poseSource = [...getCustomPoses(), ...POSES];
  const effectiveSource = poseSource.length > 0 ? poseSource : SAMPLE_POSES;
  const poseRefs =
    mode === 'pose-match'
      ? Array.from({ length: poseCount }).map((_, i) => {
          const pose = effectiveSource.find(p => p.id === selectedPoses[i]);
          if (pose) return { label: pose.label, src: (pose as { src: string }).src || undefined };
          const c = PASTEL_PHOTO_COLORS[i % PASTEL_PHOTO_COLORS.length];
          return { label: `Sample ${i + 1}`, color: `linear-gradient(135deg, ${c.from}, ${c.to})` };
        })
      : [];

  // Intrinsic strip size at scale 1 (same math as EditorScreen), per mode.
  const stripDims = (() => {
    if (mode === 'polaroid') return { w: 9 / 16, h: 1 };
    if (mode === 'pose-match') {
      const g = getPoseMatchGrid(poseCount);
      return {
        w: 10 * 2 + g.cellW * g.cols + 4 * (g.cols - 1),
        h: 10 * 2 + g.cellH * g.rows + 4 * (g.rows - 1) + 44,
      };
    }
    const landscape = layout === '4-landscape';
    const count = layout === '3-portrait' ? 3 : 4;
    return {
      w: 10 * 2 + (landscape ? 90 * 2 + 4 : 160),
      h: 10 * 2 + (landscape ? 68 * 2 + 4 : 120 * count + 4 * (count - 1)) + 44,
    };
  })();

  // Big strip area: fitBox-sized on desktop (never overflows); full-width and
  // scrollable on phones so it fills the space instead of squeezing.
  const { ref: areaRef, width: areaW, height: areaH } = useElementSize<HTMLDivElement>();
  const stripBox = fitBox(stripDims.w / stripDims.h, areaW - 32, areaH - 16);
  const { ref: wrapRef, width: wrapW } = useElementSize<HTMLDivElement>();
  const isDesktop = useIsDesktop();

  const heading = mode === 'pose-match' ? 'Review your poses' : 'Review your shots';
  const subheading =
    mode === 'pose-match'
      ? 'Tap a shot to retake it, or continue to decorate.'
      : 'Tap any photo to retake it, or continue to decorate.';

  return (
    <div className="flex-1 min-h-0 flex flex-col animate-screen-in">
      <div className="shrink-0 text-center pt-5 pb-2 px-4 sm:px-8">
        <h2 className="text-2xl font-black text-booth-text">{heading}</h2>
        <p className="text-booth-muted text-sm mt-1">{subheading}</p>
      </div>

      {/* Big finished strip on top — same arrangement as capture, plain (no decor yet).
          Desktop fits it exactly; phones go full-width and scroll. */}
      {isDesktop ? (
        <div ref={areaRef} className="flex-1 min-h-0 px-4 sm:px-8 flex items-center justify-center">
          {stripBox.width > 0 &&
            (mode === 'polaroid' ? (
              <PolaroidCanvas
                polaroids={defaultPolaroids(polaroidCount)}
                shots={shots}
                bgColor="#FFFFFF"
                bgImage={null}
                stickers={[]}
                caption=""
                showDate={false}
                filterId={filterId}
                height={stripBox.height}
                onShotTap={i => onRetake(i)}
              />
            ) : (
              <StripPreview
                layout={mode === 'pose-match' ? 'pose-match' : layout}
                shots={shots}
                bgColor="#FFFFFF"
                bgImage={null}
                stickers={[]}
                caption=""
                showDate={false}
                filterId={filterId}
                poseRefs={poseRefs}
                poseCount={poseCount}
                scale={stripBox.width / stripDims.w}
                onShotTap={i => onRetake(i)}
              />
            ))}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-4">
          <div ref={wrapRef} className="w-full max-w-[430px] mx-auto">
            {wrapW > 0 &&
              (mode === 'polaroid' ? (
                <PolaroidCanvas
                  polaroids={defaultPolaroids(polaroidCount)}
                  shots={shots}
                  bgColor="#FFFFFF"
                  bgImage={null}
                  stickers={[]}
                  caption=""
                  showDate={false}
                  filterId={filterId}
                  height={(wrapW * 16) / 9}
                  onShotTap={i => onRetake(i)}
                />
              ) : (
                <StripPreview
                  layout={mode === 'pose-match' ? 'pose-match' : layout}
                  shots={shots}
                  bgColor="#FFFFFF"
                  bgImage={null}
                  stickers={[]}
                  caption=""
                  showDate={false}
                  filterId={filterId}
                  poseRefs={poseRefs}
                  poseCount={poseCount}
                  scale={wrapW / stripDims.w}
                  onShotTap={i => onRetake(i)}
                />
              ))}
          </div>
        </div>
      )}

      <BottomBar>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-full border-2 border-booth-border text-booth-muted font-bold text-sm hover:border-booth-lavender hover:text-booth-violet transition-all duration-150"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          className="px-8 py-2.5 rounded-full bg-booth-violet text-white font-bold text-sm hover:scale-105 hover:shadow-lg hover:shadow-booth-lavender/50 transition-all duration-150"
        >
          Decorate Strip
        </button>
      </BottomBar>
    </div>
  );
}

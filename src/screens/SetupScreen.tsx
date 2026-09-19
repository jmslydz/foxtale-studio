import { type Mode, type Layout, type PlacedPolaroid, type Shot, PASTEL_PHOTO_COLORS } from '../types';
import { POSES } from '../stickerCatalog';
import { type PoseRef } from '../types';
import useElementSize from '../hooks/useElementSize';
import { fitBox } from '../lib/fitLayout';
import { getPoseMatchGrid } from '../lib/poseMatchGrid';
import BottomBar from '../components/BottomBar';
import LayoutOption from '../components/LayoutOption';
import PoseTile from '../components/PoseTile';
import BackgroundPicker from '../components/BackgroundPicker';
import PolaroidCanvas from '../components/PolaroidCanvas';
import StripPreview from '../components/StripPreview';

interface SetupScreenProps {
  mode: Mode;
  layout: Layout;
  poseCount: 1 | 2 | 3 | 4;
  selectedPoses: string[];
  polaroidCount: 1 | 2 | 3;
  polaroids: PlacedPolaroid[];
  bgColor: string;
  bgImage: string | null;
  shots: Shot[];
  onSetLayout: (l: Layout) => void;
  onSetPoseCount: (count: 1 | 2 | 3 | 4) => void;
  onTogglePose: (id: string, max: number) => void;
  onSetPolaroidCount: (count: 1 | 2 | 3) => void;
  onSetBgColor: (c: string) => void;
  onSetBgImage: (src: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

const LAYOUT_OPTIONS: { layout: Layout; label: string; description: string }[] = [
  { layout: '3-portrait', label: '3-Shot Strip', description: '3 portrait frames stacked' },
  { layout: '4-portrait', label: '4-Shot Strip', description: '4 portrait frames stacked' },
  { layout: '4-landscape', label: '2×2 Grid', description: '4 landscape frames in a grid' },
];

const POSE_COUNTS: { count: 1 | 2 | 3 | 4; label: string; description: string }[] = [
  { count: 1, label: '1 pose', description: 'One reference to copy' },
  { count: 2, label: '2 poses', description: 'Two references' },
  { count: 3, label: '3 poses', description: 'Three references' },
  { count: 4, label: '4 poses', description: 'Four references' },
];

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

export default function SetupScreen({
  mode,
  layout,
  poseCount,
  selectedPoses,
  polaroidCount,
  polaroids,
  bgColor,
  bgImage,
  shots,
  onSetLayout,
  onSetPoseCount,
  onTogglePose,
  onSetPolaroidCount,
  onSetBgColor,
  onSetBgImage,
  onBack,
  onContinue,
}: SetupScreenProps) {
  const heading =
    mode === 'classic'
      ? 'Choose your layout'
      : mode === 'polaroid'
      ? 'Design your polaroid'
      : 'Pick your poses';
  const subheading =
    mode === 'classic'
      ? 'Select how your photo strip will be arranged.'
      : mode === 'polaroid'
      ? '' // polaroid: descriptive line removed per request
      : `Choose ${poseCount} reference photo${poseCount > 1 ? 's' : ''} to copy, in order.`;

  const allPoses: (PoseRef & { color?: string })[] = POSES.length > 0 ? POSES : SAMPLE_POSES;
  const sampleMode = POSES.length === 0;

  // Group by category, preserving manifest (or sample) order.
  const categories: { name: string; poses: PoseRef[] }[] = [];
  for (const p of allPoses) {
    const cat = categories.find(c => c.name === p.category);
    if (cat) cat.poses.push(p);
    else categories.push({ name: p.category, poses: [p] });
  }

  const poseOrder = (id: string) => {
    const i = selectedPoses.indexOf(id);
    return i === -1 ? undefined : i + 1;
  };

  const ready = mode !== 'pose-match' || selectedPoses.length === poseCount;

  // Measured preview area: the live preview is fitBox-sized to fit exactly.
  const { ref: previewRef, width: previewW, height: previewH } = useElementSize<HTMLDivElement>();

  // Live preview size via fitBox against the preview area's intrinsic aspect.
  const previewBox = (() => {
    if (mode === 'polaroid') return fitBox(9 / 16, previewW, previewH);
    if (mode === 'pose-match') {
      const g = getPoseMatchGrid(poseCount);
      const w = 10 * 2 + g.cellW * g.cols + 4 * (g.cols - 1);
      const h = 10 * 2 + g.cellH * g.rows + 4 * (g.rows - 1) + 44;
      return fitBox(w / h, previewW, previewH);
    }
    const count = layout === '3-portrait' ? 3 : 4;
    const landscape = layout === '4-landscape';
    const w = 10 * 2 + (landscape ? 90 * 2 + 4 : 160);
    const h = 10 * 2 + (landscape ? 68 * 2 + 4 : 120 * count + 4 * (count - 1)) + 44;
    return fitBox(w / h, previewW, previewH);
  })();
  const previewScale = (() => {
    if (mode === 'polaroid') return 1; // PolaroidCanvas takes a height directly
    if (mode === 'pose-match') {
      const g = getPoseMatchGrid(poseCount);
      return previewBox.width / (10 * 2 + g.cellW * g.cols + 4 * (g.cols - 1));
    }
    const landscape = layout === '4-landscape';
    return previewBox.width / (10 * 2 + (landscape ? 90 * 2 + 4 : 160));
  })();

  // Pose-match preview references (first N chosen, samples otherwise).
  const previewPoseRefs =
    mode === 'pose-match'
      ? Array.from({ length: poseCount }).map((_, i) => {
          const pose = (POSES.length > 0 ? POSES : SAMPLE_POSES).find(p => p.id === selectedPoses[i]);
          if (pose) {
            return {
              label: pose.label,
              src: (pose as { src: string }).src || undefined,
              color: (pose as { color?: string }).color,
            };
          }
          const c = PASTEL_PHOTO_COLORS[i % PASTEL_PHOTO_COLORS.length];
          return { label: `Sample ${i + 1}`, color: `linear-gradient(135deg, ${c.from}, ${c.to})` };
        })
      : [];

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {mode !== 'polaroid' && (
        <div className="shrink-0 text-center pt-5 pb-3 px-8">
          <h2 className="text-2xl font-black text-booth-text">{heading}</h2>
          {subheading && <p className="text-booth-muted mt-1 text-sm">{subheading}</p>}
        </div>
      )}

      {/* Measured content area; grids scroll inside themselves on desktop */}
      <div className="flex-1 min-h-0 px-8 flex flex-col w-full">
        {mode === 'classic' && (
          <div className="flex-1 min-h-0 flex items-center justify-center gap-6 flex-wrap overflow-y-auto py-2">
            {LAYOUT_OPTIONS.map(opt => (
              <LayoutOption
                key={opt.layout}
                layout={opt.layout}
                label={opt.label}
                description={opt.description}
                selected={layout === opt.layout}
                onClick={() => onSetLayout(opt.layout)}
              />
            ))}
          </div>
        )}

        {mode === 'pose-match' && (
          <div className="flex-1 min-h-0 flex flex-col gap-4">
            {/* Count selector */}
            <div className="shrink-0 flex items-center gap-3 justify-center">
              <span className="text-xs font-black text-booth-text uppercase tracking-wider">
                How many
              </span>
              <div className="flex gap-2">
                {POSE_COUNTS.map(opt => (
                  <button
                    key={opt.count}
                    onClick={() => onSetPoseCount(opt.count)}
                    title={opt.description}
                    className={[
                      'w-12 h-10 rounded-xl border-2 font-black text-sm transition-all duration-150',
                      poseCount === opt.count
                        ? 'border-booth-violet bg-booth-lavender/40 text-booth-violet'
                        : 'border-booth-border text-booth-muted hover:border-booth-lavender hover:text-booth-violet',
                    ].join(' ')}
                  >
                    {opt.count}
                  </button>
                ))}
              </div>
              <span className="text-xs text-booth-muted font-semibold">
                {selectedPoses.length}/{poseCount} selected
              </span>
            </div>

            {/* Grid (scrolls inside) + live preview side by side */}
            <div className="flex-1 min-h-0 flex gap-6">
              <div className="flex-1 min-w-0 min-h-0 overflow-y-auto border border-booth-border rounded-2xl bg-white p-4">
                {sampleMode && (
                  <p className="text-xs text-booth-muted mb-3 bg-booth-lavender/30 border border-booth-border rounded-lg px-3 py-2">
                    Add images to public/poses/ and run pnpm manifest.
                  </p>
                )}
                {categories.map(cat => (
                  <div key={cat.name} className="mb-4 last:mb-0">
                    <p className="text-xs font-bold text-booth-muted uppercase tracking-wider mb-2">
                      {cat.name}
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {cat.poses.map(pose => (
                        <PoseTile
                          key={pose.id}
                          pose={pose}
                          order={poseOrder(pose.id)}
                          onClick={() => onTogglePose(pose.id, poseCount)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live strip preview (layout = getPoseMatchGrid) */}
              <div ref={previewRef} className="w-[300px] shrink-0 min-h-0 flex items-center justify-center">
                {previewBox.width > 0 &&
                  (mode === 'pose-match' ? (
                    <StripPreview
                      layout="pose-match"
                      shots={[]}
                      bgColor={bgColor}
                      bgImage={bgImage}
                      filterId="original"
                      poseRefs={previewPoseRefs}
                      poseCount={poseCount}
                      scale={previewScale}
                    />
                  ) : (
                    <StripPreview
                      layout={layout}
                      shots={[]}
                      bgColor={bgColor}
                      bgImage={bgImage}
                      filterId="original"
                      scale={previewScale}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'polaroid' && (
          <div className="flex-1 min-h-0 w-full flex items-stretch justify-center gap-10 lg:block lg:relative">
            {/* Left: count + background (background chosen FIRST) — scrollbar hidden.
                On lg it floats at the left edge while the preview group centers on the page. */}
            <div className="w-64 shrink-0 grow-0 basis-64 flex flex-col gap-6 overflow-y-auto no-scrollbar py-2 lg:absolute lg:left-0 lg:inset-y-0 lg:z-10">
              <div>
                <p className="text-xs font-black text-booth-text uppercase tracking-wider mb-3">
                  How many
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { count: 1 as const, label: '1 Polaroid', description: 'One big instant photo' },
                    { count: 2 as const, label: '2 Polaroids', description: 'Two stacked photos' },
                    { count: 3 as const, label: '3 Polaroids', description: 'Three overlapping photos' },
                  ].map(opt => (
                    <button
                      key={opt.count}
                      onClick={() => onSetPolaroidCount(opt.count)}
                      className={[
                        'px-4 py-2.5 rounded-xl border-2 text-left transition-all duration-150',
                        polaroidCount === opt.count
                          ? 'border-booth-violet bg-booth-lavender/40'
                          : 'border-booth-border hover:border-booth-lavender',
                      ].join(' ')}
                    >
                      <span className="block text-sm font-bold text-booth-text">{opt.label}</span>
                      <span className="block text-xs text-booth-muted">{opt.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-black text-booth-text uppercase tracking-wider mb-3">
                  Background
                </p>
                <BackgroundPicker
                  bgColor={bgColor}
                  bgImage={bgImage}
                  onSetBgColor={onSetBgColor}
                  onSetBgImage={onSetBgImage}
                />
              </div>
            </div>

            {/* Right: live preview, fitBox-sized — the title sits at the TOP of the
                box column, centered over the canvas; measured area excludes title
                and caption so nothing can overlap. On lg the group spans the full
                content width, so the box centers on the PAGE like the title. */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col items-center gap-2 lg:absolute lg:inset-0">
              <h2 className="shrink-0 pt-5 text-2xl font-black text-booth-text text-center">{heading}</h2>
              <div ref={previewRef} className="flex-1 min-h-0 w-full flex items-center justify-center">
                {previewBox.width > 0 && (
                  <PolaroidCanvas
                    polaroids={polaroids}
                    shots={shots}
                    bgColor={bgColor}
                    bgImage={bgImage}
                    height={previewBox.height}
                  />
                )}
              </div>
              <p className="shrink-0 text-xs text-booth-muted text-center max-w-[240px]">
                This is the default arrangement — you'll drag, resize and rotate each photo after
                capture.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Selected preview hint */}
      {mode === 'classic' && (
        <div className="shrink-0 flex justify-center py-3">
          <div className="bg-booth-lavender/40 border border-booth-border rounded-2xl px-6 py-2 text-sm text-booth-text font-medium flex items-center gap-2">
            <span className="text-booth-violet font-bold">
              {LAYOUT_OPTIONS.find(o => o.layout === layout)?.label}
            </span>
            <span className="text-booth-muted">—</span>
            <span>{LAYOUT_OPTIONS.find(o => o.layout === layout)?.description}</span>
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
          disabled={!ready}
          className={[
            'px-8 py-2.5 rounded-full font-bold text-sm transition-all duration-150',
            ready
              ? 'bg-booth-violet text-white hover:scale-105 hover:shadow-lg hover:shadow-booth-lavender/50'
              : 'bg-booth-border text-booth-muted cursor-not-allowed',
          ].join(' ')}
        >
          Continue
        </button>
      </BottomBar>
    </div>
  );
}

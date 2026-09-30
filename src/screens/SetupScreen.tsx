import { useState, useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import { type Mode, type Layout, type PlacedPolaroid, type Shot, PASTEL_PHOTO_COLORS } from '../types';
import { POSES, addCustomPoses, getCustomPoses } from '../stickerCatalog';
import { type PoseRef } from '../types';
import useElementSize from '../hooks/useElementSize';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { fitBox } from '../lib/fitLayout';
import { getPoseMatchGrid } from '../lib/poseMatchGrid';
import BottomBar from '../components/BottomBar';
import CollapsiblePanel from '../components/CollapsiblePanel';
import LayoutOption from '../components/LayoutOption';
import PoseTile from '../components/PoseTile';
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

  // Uploads first ("My Poses"), then the manifest; samples only when both are empty.
  const customPoses = getCustomPoses();
  const allPoses: (PoseRef & { color?: string })[] =
    customPoses.length > 0 || POSES.length > 0 ? [...customPoses, ...POSES] : SAMPLE_POSES;
  const sampleMode = POSES.length === 0 && customPoses.length === 0;
  // Re-render when uploads land (registry is module-level).
  const [, bumpCustom] = useState(0);
  const uploadRef = useRef<HTMLInputElement>(null);

  /** Save → upload: image files become session poses in "My Poses". */
  const handlePoseUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imgs.length === 0) return;
    addCustomPoses(
      imgs.map(f => ({
        src: URL.createObjectURL(f),
        label: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'My pose',
      })),
    );
    setPoseCatFilter('My Poses');
    setGridOpen(true);
    bumpCustom(n => n + 1);
  };

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

  // Phone: the pose grid minimizes so the preview gets the screen.
  const [gridOpen, setGridOpen] = useState(true);
  const isDesktop = useIsDesktop();

  // Phone confirmation popup: opens from Continue when picks are complete.
  // Change closes it; Continue inside it proceeds for real.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const handleSetupContinue = () => {
    if (ready) setConfirmOpen(true);
  };

  // Over-limit feedback: tapping a new photo at max shakes out a note
  // instead of silently ignoring the tap.
  const [limitNote, setLimitNote] = useState(false);
  const limitTimer = useRef<number | null>(null);
  const handlePoseClick = (id: string) => {
    if (!selectedPoses.includes(id) && selectedPoses.length >= poseCount) {
      setLimitNote(true);
      if (limitTimer.current) window.clearTimeout(limitTimer.current);
      limitTimer.current = window.setTimeout(() => setLimitNote(false), 2200);
      return;
    }
    setLimitNote(false);
    onTogglePose(id, poseCount);
  };
  useEffect(() => () => {
    if (limitTimer.current) window.clearTimeout(limitTimer.current);
  }, []);

  // Solo / Duo tabs: 'All' shows every category, otherwise just the one.
  const [poseCatFilter, setPoseCatFilter] = useState<string>('All');

  // Measured preview area: the live preview is fitBox-sized to fit exactly.
  const { ref: previewRef, width: previewW, height: previewH } = useElementSize<HTMLDivElement>();
  // Confirmation popup canvas width (same callback-ref hook, mounts with the popup).
  const { ref: confirmRef, width: confirmW } = useElementSize<HTMLDivElement>();
  // Intrinsic pose-strip width for the popup scale (same math as previewScale).
  const confirmGrid = getPoseMatchGrid(poseCount);
  const confirmIntrinsicW = 10 * 2 + confirmGrid.cellW * confirmGrid.cols + 4 * (confirmGrid.cols - 1);
  const confirmIntrinsicH = 10 * 2 + confirmGrid.cellH * confirmGrid.rows + 4 * (confirmGrid.rows - 1) + 44;
  // Popup strip scale: fit the width AND the screen height (title + buttons
  // reserve ~340px), so the popup never needs its own scroll.
  const confirmScale =
    confirmW > 0
      ? Math.min(confirmW / confirmIntrinsicW, Math.max(0, window.innerHeight - 340) / confirmIntrinsicH)
      : 0;

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
    <div className="flex-1 min-h-0 flex flex-col animate-screen-in">
      {mode !== 'polaroid' && (
        <div className="shrink-0 text-center pt-5 pb-3 px-8">
          <h2 className="text-2xl font-black text-booth-text">{heading}</h2>
          {subheading && <p className="text-booth-muted mt-1 text-sm">{subheading}</p>}
        </div>
      )}

      {/* Measured content area; grids scroll inside themselves on desktop */}
      <div className="flex-1 min-h-0 px-4 sm:px-8 flex flex-col w-full">
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
            {/* Grid (scrolls inside) + live preview side by side on desktop, stacked on mobile.
                The grid minimizes on phones so the preview gets the screen.
                All picking controls live inside Browse — the top stays clean. */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-6">
              <CollapsiblePanel
                title="Browse poses"
                meta={`${selectedPoses.length}/${poseCount}`}
                open={gridOpen}
                onToggle={() => setGridOpen(o => !o)}
              >
              <div className="flex-1 min-w-0 min-h-0 overflow-y-auto border border-booth-border rounded-2xl bg-white p-4 flex flex-col gap-4">
                {/* Count selector */}
                <div className="shrink-0 flex items-center gap-3 justify-center flex-wrap">
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
                          'w-12 h-11 rounded-xl border-2 font-black text-sm transition-all duration-150',
                          poseCount === opt.count
                            ? 'border-booth-violet bg-booth-lavender/40 text-booth-violet'
                            : 'border-booth-border text-booth-muted hover:border-booth-lavender hover:text-booth-violet',
                        ].join(' ')}
                      >
                        {opt.count}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-booth-muted font-semibold whitespace-nowrap">
                    {selectedPoses.length}/{poseCount} selected
                  </span>
                </div>

                {/* Category tabs: All / Solo / Duo — one view at a time */}
                <div className="shrink-0 flex items-center gap-2 justify-center flex-wrap">
                  {['All', ...categories.map(c => c.name)].map(name => {
                    const count = name === 'All'
                      ? allPoses.length
                      : categories.find(c => c.name === name)?.poses.length ?? 0;
                    const selected = poseCatFilter === name;
                    return (
                      <button
                        key={name}
                        onClick={() => setPoseCatFilter(name)}
                        className={[
                          'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 border whitespace-nowrap',
                          selected
                            ? 'bg-booth-violet text-white border-booth-violet shadow-sm shadow-booth-lavender/60'
                            : 'bg-white text-booth-muted border-booth-border hover:border-booth-lavender hover:text-booth-violet',
                        ].join(' ')}
                      >
                        {name} ({count})
                      </button>
                    );
                  })}
                </div>

                {sampleMode && (
                  <p className="text-xs text-booth-muted bg-booth-lavender/30 border border-booth-border rounded-lg px-3 py-2">
                    Add images to public/poses/ and run pnpm manifest.
                  </p>
                )}
                {/* Add your own: saved-from-browser photos become session poses */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <button
                    onClick={() => uploadRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed border-booth-lavender text-booth-violet font-bold text-xs hover:border-booth-violet hover:bg-booth-lavender/30 transition-all duration-150"
                  >
                    <Upload size={14} strokeWidth={2.5} /> Add your own poses
                  </button>
                  <p className="text-[11px] text-booth-muted">
                    {customPoses.length > 0
                      ? `${customPoses.length} added — lasts for this visit`
                      : 'Save any photo from your browser, then upload it here'}
                  </p>
                  <input
                    ref={uploadRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      handlePoseUpload(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </div>

                {/* Tiles scroll; count + tabs stay pinned at the top of Browse */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                {limitNote && (
                  <p role="alert" className="text-xs font-bold text-booth-rose text-center bg-booth-rose/10 border border-booth-rose/30 rounded-xl px-3 py-2 mb-2">
                    Already at {poseCount} — tap a picked photo to swap it.
                  </p>
                )}
                {(poseCatFilter === 'All'
                  ? categories
                  : categories.filter(c => c.name === poseCatFilter)
                ).map(cat => (
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
                          onClick={() => handlePoseClick(pose.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                </div>
              </div>
              </CollapsiblePanel>

              {/* Desktop: live strip preview. Phones: slim hint — confirmation
                  happens in the popup instead, so the screen stays clean. */}
              <div
                ref={previewRef}
                className={[
                  'w-full lg:w-[300px] shrink-0 min-h-0 lg:max-h-none overflow-hidden flex items-center justify-center',
                  selectedPoses.length === 0 || !isDesktop ? 'py-3' : 'h-[50dvh] lg:h-auto',
                ].join(' ')}
              >
                {selectedPoses.length === 0 || !isDesktop ? (
                  <div className="flex flex-col items-center gap-2 px-6">
                    <p className="text-xs text-booth-muted text-center">
                      Tap {poseCount} pose{poseCount > 1 ? 's' : ''} above, then Continue.
                    </p>
                  </div>
                ) : (
                  previewBox.width > 0 &&
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
                  )))}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation: "Is this your choice?" opens from Continue when picks
            are complete. Popup Continue proceeds, Change goes back to picking. */}
        {mode === 'pose-match' && confirmOpen && selectedPoses.length === poseCount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#2A1F2E]/85 backdrop-blur-sm">
            <div className="w-full max-w-[320px] bg-white rounded-3xl border border-booth-border shadow-2xl p-5 flex flex-col items-center gap-4 animate-pop">
              <div className="text-center">
                <h3 className="text-xl font-black text-booth-text">Is this your choice?</h3>
                <p className="text-xs text-booth-muted mt-1">
                  {poseCount} pose{poseCount > 1 ? 's' : ''} in order — continue or change {poseCount > 1 ? 'them' : 'it'}.
                </p>
              </div>
              <div ref={confirmRef} className="w-full flex items-center justify-center">
                {confirmScale > 0 && (
                  <StripPreview
                    layout="pose-match"
                    shots={[]}
                    bgColor={bgColor}
                    bgImage={bgImage}
                    filterId="original"
                    poseRefs={previewPoseRefs}
                    poseCount={poseCount}
                    scale={confirmScale}
                  />
                )}
              </div>
              <div className="w-full flex gap-2">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-full border-2 border-booth-border text-booth-muted font-bold text-sm hover:border-booth-violet hover:text-booth-violet transition-all duration-150"
                >
                  Change
                </button>
                <button
                  onClick={onContinue}
                  className="flex-1 px-4 py-2.5 rounded-full bg-booth-violet text-white font-bold text-sm hover:scale-105 transition-all duration-150"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === 'polaroid' && (
          <div className="flex-1 min-h-0 w-full flex flex-col lg:block lg:relative items-stretch justify-center gap-6 lg:gap-10">
            {/* Left: just How many — background and strip image are chosen in
                the Editor. On lg it floats at the left edge while the preview
                group centers on the page. */}
            <div className="w-full lg:w-64 shrink-0 lg:grow-0 lg:basis-64 flex flex-col gap-6 overflow-y-auto no-scrollbar py-2 lg:absolute lg:left-0 lg:inset-y-0 lg:z-10">
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
            </div>

            {/* Right: live preview, fitBox-sized — the title sits at the TOP of the
                box column, centered over the canvas; measured area excludes title
                and caption so nothing can overlap. On lg the group spans the full
                content width, so the box centers on the PAGE like the title. */}
            <div className="flex-1 min-w-0 min-h-[60dvh] lg:min-h-0 flex flex-col items-center gap-2 lg:absolute lg:inset-0">
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
          onClick={() => (mode === 'pose-match' ? handleSetupContinue() : onContinue())}
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

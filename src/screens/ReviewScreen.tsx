import { type Mode, type Layout, type Shot, SHOT_COUNTS, PASTEL_PHOTO_COLORS } from '../types';
import { POSES } from '../stickerCatalog';
import { getShotAspect } from '../lib/shotAspect';
import { getFilterCss } from '../lib/filters';
import { fitGrid } from '../lib/fitLayout';
import useElementSize from '../hooks/useElementSize';
import BottomBar from '../components/BottomBar';
import ShotThumbnail from '../components/ShotThumbnail';

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

/** Mirrors SetupScreen's samples so the flow works with an empty manifest. */
const SAMPLE_POSES = PASTEL_POSE_SAMPLES();

function PASTEL_POSE_SAMPLES() {
  return PASTEL_PHOTO_COLORS.slice(0, 6).map((c, i) => ({
    id: `sample-pose-${i + 1}`,
    label: `Sample ${i + 1}`,
    category: 'Samples',
    src: '',
    color: `linear-gradient(135deg, ${c.from}, ${c.to})`,
  }));
}

// Pose review card metrics (px): white card padding, inner photo gap and the
// retake/"Reference" row under the photo pair.
const CARD_PAD = 12;
const INNER_GAP = 10;
const UNDER_ROW_H = 32; // Retake button / Reference label + margin
const CARD_GAP = 16;

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
  const total =
    mode === 'polaroid'
      ? polaroidCount
      : mode === 'pose-match'
      ? poseCount
      : SHOT_COUNTS[layout];
  const aspect = getShotAspect(mode, layout);
  const filter = getFilterCss(filterId);

  // Free area under the title — every photo layout is computed to fit exactly.
  const { ref: areaRef, width: areaW, height: areaH } = useElementSize<HTMLDivElement>();

  if (mode === 'pose-match') {
    const poseSource = POSES.length > 0 ? POSES : SAMPLE_POSES;
    const poseFor = (i: number) => poseSource.find(p => p.id === selectedPoses[i]);

    // Card grid: 1 pose = 1 card, 2 poses = 2 side by side, 3-4 = 2 x 2.
    const forcedCols = poseCount === 1 ? 1 : 2;
    // Pass 1: card aspect ~= 2 shots side by side. Pass 2 refines with the
    // real inner metrics so both photos are exactly the same size.
    const g1 = fitGrid({
      count: total,
      aspect: 2 * aspect,
      availW: areaW,
      availH: areaH,
      gap: CARD_GAP,
      extraH: CARD_PAD * 2 + UNDER_ROW_H,
      cols: forcedCols,
    });
    const photoW1 = Math.max(0, (g1.cellW - CARD_PAD * 2 - INNER_GAP) / 2);
    const photoH1 = photoW1 / aspect;
    const cardH1 = photoH1 + CARD_PAD * 2 + UNDER_ROW_H;
    const g2 = fitGrid({
      count: total,
      aspect: g1.cellW > 0 ? g1.cellW / cardH1 : 2 * aspect,
      availW: areaW,
      availH: areaH,
      gap: CARD_GAP,
      extraH: CARD_PAD * 2 + UNDER_ROW_H,
      cols: forcedCols,
    });
    const cardW = g2.cellW;
    const photoW = Math.max(0, (cardW - CARD_PAD * 2 - INNER_GAP) / 2);
    const photoH = photoW / aspect;

    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="shrink-0 text-center pt-5 pb-2 px-8">
          <h2 className="text-2xl font-black text-booth-text">Review your poses</h2>
          <p className="text-booth-muted text-sm mt-1">
            Each shot beside the reference it was matched against. Retake any you want to redo.
          </p>
        </div>

        {/* Measured free area: the card grid always fits exactly */}
        <div ref={areaRef} className="flex-1 min-h-0 px-8 flex items-center justify-center">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${g2.cols}, ${cardW}px)`,
              gap: CARD_GAP,
            }}
          >
            {Array.from({ length: total }).map((_, i) => {
              const pose = poseFor(i);
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-booth-border flex flex-col"
                  style={{ width: cardW, padding: CARD_PAD, gap: 8 }}
                >
                  {/* Photo pair: user's shot LEFT, reference RIGHT — same size */}
                  <div className="flex" style={{ gap: INNER_GAP, height: photoH }}>
                    <div className="relative rounded-xl overflow-hidden border-2 border-booth-border shadow-sm flex-shrink-0" style={{ width: photoW, height: photoH }}>
                      {shots[i] ? (
                        <img
                          src={shots[i].url}
                          alt={`Shot ${i + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ filter }}
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(135deg, ${PASTEL_PHOTO_COLORS[i % PASTEL_PHOTO_COLORS.length].from}, ${PASTEL_PHOTO_COLORS[i % PASTEL_PHOTO_COLORS.length].to})`,
                          }}
                        />
                      )}
                      <span className="absolute top-2 left-2 bg-white/85 text-booth-text text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Shot {i + 1}
                      </span>
                    </div>

                    {/* Reference photo: NEVER filtered */}
                    <div className="rounded-xl overflow-hidden border border-booth-border flex-shrink-0" style={{ width: photoW, height: photoH }}>
                      {pose?.src ? (
                        <img
                          src={import.meta.env.BASE_URL + pose.src}
                          alt={pose.label}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            background:
                              (pose as { color?: string } | undefined)?.color ??
                              `linear-gradient(135deg, ${PASTEL_PHOTO_COLORS[i % PASTEL_PHOTO_COLORS.length].from}, ${PASTEL_PHOTO_COLORS[i % PASTEL_PHOTO_COLORS.length].to})`,
                          }}
                        >
                          <span className="text-xs text-booth-text/60 font-semibold">
                            {pose?.label ?? `Pose ${i + 1}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Under-row: Retake under the user's shot, label under the reference */}
                  <div className="flex" style={{ gap: INNER_GAP, height: UNDER_ROW_H - 8 }}>
                    <div style={{ width: photoW }} className="flex-shrink-0">
                      <button
                        onClick={() => onRetake(i)}
                        className="w-full text-xs font-bold text-booth-violet bg-booth-lavender hover:bg-booth-violet hover:text-white px-3 py-1.5 rounded-full transition-all duration-150"
                      >
                        Retake
                      </button>
                    </div>
                    <div style={{ width: photoW }} className="flex-shrink-0 flex items-start justify-center">
                      <p className="text-[11px] text-booth-muted font-semibold uppercase tracking-wider">
                        Reference
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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

  // Classic / polaroid: one thumbnail per shot at the real capture aspect.
  const extraH = 38; // Retake button (~30px) + gap-2 (8px)
  const g = fitGrid({
    count: total,
    aspect,
    availW: areaW,
    availH: areaH,
    gap: 24,
    extraH,
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 text-center pt-5 pb-2 px-8">
        <h2 className="text-2xl font-black text-booth-text">Review your shots</h2>
        <p className="text-booth-muted text-sm mt-1">
          Happy with them? Continue to decorate your strip, or retake any shot.
        </p>
      </div>

      {/* Measured free area: photos are sized by fitGrid so nothing overflows */}
      <div ref={areaRef} className="flex-1 min-h-0 px-8 flex items-center justify-center">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${g.cols}, ${g.cellW}px)`,
            gap: 24,
          }}
        >
          {Array.from({ length: total }).map((_, i) => (
            <ShotThumbnail
              key={i}
              shot={shots[i]}
              index={i}
              total={total}
              aspect={aspect}
              width={g.cellW}
              filterId={filterId}
              onRetake={() => onRetake(i)}
            />
          ))}
        </div>
      </div>

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

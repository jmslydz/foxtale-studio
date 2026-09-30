import { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, CircleCheck, Ban, CameraOff, Upload, SwitchCamera, ZoomIn, ZoomOut } from 'lucide-react';
import { type Mode, type Layout, type Shot, SHOT_COUNTS, PASTEL_PHOTO_COLORS } from '../types';
import { POSES, findPose, getCustomPoses, resolvePublicSrc } from '../stickerCatalog';
import { COUNTDOWN_SECONDS } from '../config';
import { getShotAspect } from '../lib/shotAspect';
import { fitBox } from '../lib/fitLayout';
import { useCamera } from '../features/booth/useCamera';
import { aliveRef } from '../features/booth/cameraLifecycle';
import { captureFrame } from '../features/booth/captureFrame';
import useElementSize from '../hooks/useElementSize';
import { useIsDesktop } from '../hooks/useIsDesktop';
import CountdownOverlay from '../components/CountdownOverlay';
import BottomBar from '../components/BottomBar';

/** Mirrors SetupScreen's samples so the flow works with an empty manifest. */
const SAMPLE_POSES = PASTEL_PHOTO_COLORS.slice(0, 6).map((c, i) => ({
  id: `sample-pose-${i + 1}`,
  label: `Sample ${i + 1}`,
  category: 'Samples',
  src: '',
}));

interface CaptureScreenProps {
  mode: Mode;
  layout: Layout;
  /** pose-match: number of reference poses (and shots). */
  poseCount: 1 | 2 | 3 | 4;
  /** pose-match: manifest pose ids in pick order (sample ids when empty manifest). */
  selectedPoses: string[];
  polaroidCount: 1 | 2 | 3;
  shots: Shot[];
  retakeIndex: number | null;
  /** ONE session-wide filter shown live on the preview. */
  filterId: string;
  onSetFilterId: (id: string) => void;
  onAddShot: (blob: Blob) => void;
  onBack: () => void;
  onDone: () => void;
}

type CaptureState = 'idle' | 'countdown' | 'snap' | 'complete';

export default function CaptureScreen({
  mode,
  layout,
  poseCount,
  selectedPoses,
  polaroidCount,
  shots,
  retakeIndex,
  filterId,
  onSetFilterId,
  onAddShot,
  onBack,
  onDone,
}: CaptureScreenProps) {
  const totalShots =
    mode === 'polaroid'
      ? polaroidCount
      : mode === 'pose-match'
      ? poseCount
      : SHOT_COUNTS[layout];
  const currentIndex = retakeIndex !== null ? retakeIndex : shots.length;
  const displayIndex = Math.min(currentIndex, totalShots - 1);

  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [countdown, setCountdown] = useState<number | 'snap' | null>(null);
  // Shown when a snap fails (previously silent) — includes the reason so a
  // screenshot tells us exactly which step broke on the device.
  const [captureError, setCaptureError] = useState<string | null>(null);

  // Real camera (front / wide / ultra-wide where the device has them).
  const {
    videoRef,
    status: cameraStatus,
    start: startCamera,
    mirrored,
    devices,
    cycleCamera,
    zoomRange,
    zoom,
    setZoomLevel,
  } = useCamera();
  const showFlip = cameraStatus === 'ready' && devices.length > 1;
  const showZoom = cameraStatus === 'ready' && zoomRange !== null;
  const zoomStep = zoomRange ? Math.max((zoomRange.max - zoomRange.min) / 8, 0.1) : 0.5;
  const cameraRequestedRef = useRef(false);
  // Upload fallback when the camera is blocked or missing.
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Import the SAME ref object useCamera reads: the permission-prompt race
    // (stream resolving after Back) is handled there.
    aliveRef.current = true;
    return () => {
      // Clear all timers/state effects on unmount (Back or navigation away).
      aliveRef.current = false;
    };
  }, []);

  // Ask for camera permission once when the screen mounts.
  useEffect(() => {
    if (cameraRequestedRef.current) return;
    cameraRequestedRef.current = true;
    startCamera();
  }, [startCamera]);

  const captureShot = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      setCaptureState('idle');
      setCountdown(null);
      return;
    }
    try {
      // The crop aspect always matches the on-screen preview (shotAspect.ts).
      const blob = await captureFrame(video, mode === 'classic' ? layout : mode, mirrored);
      if (!aliveRef.current) return; // user left the screen mid-capture
      onAddShot(blob);
      setCaptureError(null);
      setCaptureState('complete');
      setCountdown(null);
    } catch (err) {
      if (!aliveRef.current) return;
      console.error('Capture failed:', err);
      setCaptureError(
        err instanceof Error
          ? 'Shot failed (' + err.message + '). Tap Start to retry.'
          : 'Shot failed. Tap Start to retry.',
      );
      setCaptureState('idle');
      setCountdown(null);
    }
  }, [mode, layout, onAddShot, videoRef]);

  const startCountdown = useCallback(() => {
    setCaptureError(null);
    setCaptureState('countdown');
    setCountdown(COUNTDOWN_SECONDS);
  }, []);

  useEffect(() => {
    if (captureState !== 'countdown') return;
    if (countdown === null) return;

    if (countdown === 0) {
      setCountdown('snap');
      setCaptureState('snap');
      return;
    }

    const t = setTimeout(() => setCountdown(c => (typeof c === 'number' ? c - 1 : c)), 1000);
    return () => clearTimeout(t);
  }, [captureState, countdown]);

  // Snap: capture the frame right after "Snap!" shows.
  useEffect(() => {
    if (captureState !== 'snap') return;
    const t = setTimeout(() => captureShot(), 700);
    return () => clearTimeout(t);
  }, [captureState, captureShot]);

  // Wait 1 second after a capture, then start the next shot automatically.
  useEffect(() => {
    if (captureState !== 'complete') return;

    const isFinal = retakeIndex !== null || shots.length >= totalShots;
    if (isFinal) return; // final step goes to Review via the "Review Shots" button

    const t = setTimeout(() => {
      setCaptureState('countdown');
      setCountdown(COUNTDOWN_SECONDS);
    }, 1000);
    return () => clearTimeout(t);
  }, [captureState, retakeIndex, shots.length, totalShots]);

  // pose-match: the chosen reference photo for the current shot, in pick order.
  // Falls back to the sample palette when the manifest has no poses.
  const poseSource = [...getCustomPoses(), ...POSES];
  const currentPose =
    mode === 'pose-match'
      ? (poseSource.length > 0 ? poseSource : SAMPLE_POSES).find(p => p.id === selectedPoses[displayIndex])
      : undefined;
  const isRetake = retakeIndex !== null;
  // Session is done only when every shot exists — displayIndex is clamped for
  // display purposes and must not drive the completion decision.
  const sessionComplete = !isRetake && shots.length >= totalShots;
  const isLastShot = sessionComplete;
  const cameraDown = cameraStatus === 'denied' || cameraStatus === 'unavailable';

  // Upload fallback: feed image files through the same onAddShot path (File
  // is a Blob). Caps at the remaining shots, or 1 for a retake. When the
  // session is filled (or it's a retake), go straight to Review.
  const handleUploadFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const remaining = isRetake ? 1 : Math.max(0, totalShots - shots.length);
      const picked = Array.from(files)
        .filter(f => f.type.startsWith('image/'))
        .slice(0, Math.max(1, remaining));
      if (picked.length === 0) return;
      picked.forEach(f => onAddShot(f));
      if (isRetake || shots.length + picked.length >= totalShots) {
        onDone();
      }
    },
    [isRetake, totalShots, shots.length, onAddShot, onDone],
  );

  const handleNext = () => {
    if (isRetake || sessionComplete) {
      onDone();
    } else {
      setCaptureState('idle');
      setCountdown(null);
    }
  };

  // Preview sizing: fitBox against the measured free area so the camera viewport
  // (and the pose reference beside it) never push the filter row or Start below
  // the fold. In pose-match both boxes are THE SAME SIZE, each half of the width.
  const isPose = mode === 'pose-match';
  const aspect = getShotAspect(mode, layout);
  const { ref: previewAreaRef, width: previewAreaW, height: previewAreaH } = useElementSize<HTMLDivElement>();
  // Desktop: camera + reference sit side by side (half width each). Mobile:
  // stacked (full width, half height each) so neither is crushed.
  const isDesktop = useIsDesktop();
  const box = fitBox(
    aspect,
    isDesktop && isPose ? (previewAreaW - 24) / 2 : previewAreaW,
    !isDesktop && isPose ? (previewAreaH - 24) / 2 : previewAreaH,
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col animate-screen-in">
      <div className="flex-1 min-h-0 flex flex-col gap-3 px-4 sm:px-10 pt-5 pb-2">
        {/* Progress bar */}
        <div className="shrink-0 flex items-center gap-2">
          {Array.from({ length: totalShots }).map((_, i) => (
            <div
              key={i}
              className={[
                'h-2 flex-1 rounded-full transition-all duration-300',
                i < shots.length
                  ? 'bg-booth-violet'
                  : i === currentIndex
                  ? 'bg-booth-lavender animate-pulse'
                  : 'bg-booth-border',
              ].join(' ')}
            />
          ))}
          <span className="text-sm font-bold text-booth-muted ml-2 whitespace-nowrap">
            {isRetake ? `Retaking ${retakeIndex! + 1}` : `Shot ${Math.min(shots.length + 1, totalShots)} of ${totalShots}`}
          </span>
        </div>

        {/* Preview area: camera (+ same-size reference in pose-match) */}
        <div
          ref={previewAreaRef}
          className={['flex-1 min-h-0 flex flex-col lg:flex-row items-center justify-center', isPose ? 'gap-4 lg:gap-6' : ''].join(' ')}
        >
          {/* Camera viewport — fitBox-sized at the exact crop aspect */}
          <div
            className="relative rounded-2xl overflow-hidden border-2 border-booth-border bg-booth-bg flex items-center justify-center"
            style={{ width: box.width || undefined, height: box.height || undefined }}
          >
            {/* Live camera feed, mirrored for selfie lenses like a booth mirror */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}
            />

            {/* Lens switcher: front / wide / ultra-wide (only when there is a choice) */}
            {showFlip && (
              <button
                onClick={cycleCamera}
                aria-label="Switch camera"
                title="Switch camera"
                className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-booth-text hover:scale-105 active:scale-95 transition-all duration-150"
              >
                <SwitchCamera size={18} strokeWidth={2} />
              </button>
            )}

            {/* Lens zoom: out = wider selfie, in = closer (only when the lens allows it) */}
            {showZoom && zoomRange && (
              <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-full bg-white/85 backdrop-blur-sm px-1.5 py-1">
                <button
                  onClick={() => setZoomLevel(zoom - zoomStep)}
                  disabled={zoom <= zoomRange.min}
                  aria-label="Zoom out"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-booth-text hover:bg-booth-bg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ZoomOut size={16} strokeWidth={2} />
                </button>
                <button
                  onClick={() => setZoomLevel(zoomRange.min)}
                  aria-label="Widest view"
                  title="Widest view"
                  className="min-w-10 h-9 px-1 rounded-full text-[11px] font-black text-booth-violet hover:bg-booth-bg"
                >
                  {zoom.toFixed(1)}x
                </button>
                <button
                  onClick={() => setZoomLevel(zoom + zoomStep)}
                  disabled={zoom >= zoomRange.max}
                  aria-label="Zoom in"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-booth-text hover:bg-booth-bg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ZoomIn size={16} strokeWidth={2} />
                </button>
              </div>
            )}

            {/* Fallback while the stream warms up */}
            {(cameraStatus === 'idle' || (cameraStatus !== 'ready' && !cameraDown)) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-0">
                <Camera size={60} strokeWidth={1.75} className="text-booth-muted opacity-30" />
                <span className="text-booth-muted text-sm font-medium opacity-50">
                  {cameraStatus === 'idle' ? 'Camera preview' : 'Starting camera…'}
                </span>
              </div>
            )}

            {/* Viewfinder lines */}
            <div className="absolute inset-6 border border-white/20 rounded pointer-events-none" />
            <div className="absolute top-1/2 left-6 right-6 h-px bg-white/10 pointer-events-none" />
            <div className="absolute left-1/2 top-6 bottom-6 w-px bg-white/10 pointer-events-none" />

            {/* Countdown overlay */}
            <CountdownOverlay count={countdown} />

            {/* Shutter flash on snap */}
            {captureState === 'snap' && (
              <div className="absolute inset-0 bg-white z-30 rounded-2xl animate-flash pointer-events-none" />
            )}

            {/* "Complete" flash */}
            {captureState === 'complete' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/70 z-20 rounded-2xl">
                <CircleCheck size={48} strokeWidth={1.75} className="text-booth-sage" />
                <div className="text-center">
                  <p className="font-black text-xl text-booth-text">
                    {isRetake ? 'Retake saved!' : isLastShot ? 'All shots done!' : 'Shot saved!'}
                  </p>
                  <p className="text-booth-muted text-sm">
                    {isRetake || isLastShot ? 'Ready to review your photos.' : `${totalShots - shots.length - 1} more to go.`}
                  </p>
                </div>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 rounded-full bg-booth-violet text-white font-bold text-sm hover:scale-105 transition-all duration-150"
                >
                  {isRetake || isLastShot ? 'Review Shots' : 'Next Shot'}
                </button>
              </div>
            )}

            {/* Camera denied / unavailable */}
            {cameraDown && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/85 z-30 rounded-2xl">
                {cameraStatus === 'denied' ? (
                  <Ban size={48} strokeWidth={1.75} className="text-booth-rose" />
                ) : (
                  <CameraOff size={48} strokeWidth={1.75} className="text-booth-muted" />
                )}
                <div className="text-center max-w-xs">
                  <p className="font-black text-lg text-booth-text">
                    {cameraStatus === 'denied' ? 'Camera access was blocked' : 'Camera not available'}
                  </p>
                  <p className="text-booth-muted text-sm mt-1">
                    {cameraStatus === 'denied'
                      ? 'No worries! Allow camera access in your browser, then try again.'
                      : "We couldn't find a camera to use. Check that one is connected, then try again."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startCamera()}
                    className="px-6 py-2 rounded-full bg-booth-violet text-white font-bold text-sm hover:scale-105 transition-all duration-150"
                  >
                    Try again
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-2 rounded-full border-2 border-booth-border text-booth-muted font-bold text-sm hover:border-booth-violet hover:text-booth-violet transition-all duration-150"
                  >
                    <Upload size={16} strokeWidth={2} /> Upload photos
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple={!isRetake}
                  className="hidden"
                  onChange={e => {
                    handleUploadFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>
            )}
          </div>

          {/* Pose reference — EXACTLY the same size as the camera box */}
          {isPose && (
            <div
              className="relative rounded-2xl overflow-hidden border-2 border-booth-border flex items-center justify-center flex-shrink-0"
              style={{
                width: box.width || undefined,
                height: box.height || undefined,
                background: currentPose?.src
                  ? undefined
                  : `linear-gradient(135deg, ${PASTEL_PHOTO_COLORS[displayIndex % PASTEL_PHOTO_COLORS.length].from}, ${PASTEL_PHOTO_COLORS[displayIndex % PASTEL_PHOTO_COLORS.length].to})`,
              }}
            >
              {currentPose?.src ? (
                <img
                  src={resolvePublicSrc(currentPose.src)}
                  alt="Reference pose"
                  className="absolute inset-0 w-full h-full object-fill bg-booth-bg"
                  draggable={false}
                />
              ) : (
                <p className="text-sm text-booth-text/60 font-medium">Reference pose</p>
              )}
              <span className="absolute top-2 left-2 bg-white/85 text-booth-text text-[10px] font-bold px-2 py-0.5 rounded-full">
                Pose {displayIndex + 1}
              </span>
            </div>
          )}
        </div>

        {captureError && (
          <p role="alert" className="shrink-0 text-center text-xs font-bold text-booth-rose px-6">
            {captureError}
          </p>
        )}
      </div>

      {/* Pinned bottom bar: Back + Start always visible */}
      <BottomBar>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-full border-2 border-booth-border text-booth-muted font-bold text-sm hover:border-booth-lavender hover:text-booth-violet transition-all"
        >
          Back
        </button>
        <button
          onClick={startCountdown}
          disabled={captureState !== 'idle' || cameraStatus !== 'ready'}
          className={[
            'flex items-center gap-2 px-8 py-3 rounded-full font-black text-base transition-all duration-150',
            captureState === 'idle' && cameraStatus === 'ready'
              ? 'bg-booth-rose text-white hover:scale-105 hover:shadow-lg hover:shadow-booth-pink/50'
              : 'bg-booth-border text-booth-muted cursor-not-allowed',
          ].join(' ')}
        >
          <Camera size={20} strokeWidth={1.75} />
          {captureState === 'idle'
            ? cameraStatus === 'ready'
              ? 'Start'
              : 'Camera not ready'
            : captureState === 'countdown'
            ? 'Ready...'
            : 'Captured!'}
        </button>
      </BottomBar>
    </div>
  );
}

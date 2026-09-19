import { useState, useCallback } from 'react';
import { type Screen, type Mode, type Layout, type PlacedSticker, type PlacedPolaroid, type Shot, STICKER_SIZE_MIN, STICKER_SIZE_MAX, STICKER_SIZE_DEFAULT_GRAPHIC, STICKER_SIZE_DEFAULT_EMOJI } from './types';
import { findStickerDef } from './stickerCatalog';
import { defaultPolaroids } from './lib/polaroidLayout';
import StepHeader from './components/StepHeader';
import HomeScreen from './screens/HomeScreen';
import SetupScreen from './screens/SetupScreen';
import CaptureScreen from './screens/CaptureScreen';
import ReviewScreen from './screens/ReviewScreen';
import EditorScreen from './screens/EditorScreen';
import DoneScreen from './screens/DoneScreen';

interface AppState {
  screen: Screen;
  mode: Mode;
  layout: Layout;
  /** pose-match: how many reference poses to copy (also the shot count). */
  poseCount: 1 | 2 | 3 | 4;
  /** pose-match: manifest pose ids in the order picked. */
  selectedPoses: string[];
  shots: Shot[];
  retakeIndex: number | null;
  bgColor: string;
  bgImage: string | null;
  stickers: PlacedSticker[];
  caption: string;
  showDate: boolean;
  /** ONE filter for the whole session, applied at render time to user shots. */
  filterId: string;
  selectedStickerId: string | null;
  polaroidCount: 1 | 2 | 3;
  polaroids: PlacedPolaroid[];
  selectedPolaroidId: string | null;
}

const DEFAULT_STATE: AppState = {
  screen: 'home',
  mode: 'classic',
  layout: '4-portrait',
  poseCount: 4,
  selectedPoses: [],
  shots: [],
  retakeIndex: null,
  bgColor: '#FFFFFF',
  bgImage: null,
  stickers: [],
  caption: '',
  showDate: true,
  filterId: 'original',
  selectedStickerId: null,
  polaroidCount: 1,
  polaroids: [],
  selectedPolaroidId: null,
};

export default function App() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);

  const set = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  // Navigation
  const goHome = () => {
    // Revoke from the current snapshot, outside the updater: updaters can run
    // twice under React StrictMode, which would double-fire the revokes.
    state.shots.forEach(shot => URL.revokeObjectURL(shot.url));
    setState({ ...DEFAULT_STATE, shots: [] });
  };
  const goSetup = (mode: Mode) =>
    setState(prev => ({
      ...prev,
      screen: 'setup',
      mode,
      // Entering polaroid mode seeds the default card placements.
      polaroids: mode === 'polaroid' ? defaultPolaroids(prev.polaroidCount) : prev.polaroids,
      selectedPolaroidId: null,
    }));
  const goCapture = () => setState(prev => ({ ...prev, screen: 'capture', shots: [], retakeIndex: null }));
  const goCaptureRetake = (i: number) => setState(prev => ({ ...prev, screen: 'capture', retakeIndex: i }));
  const goReview = () => set('screen', 'review');
  const goEditor = () => set('screen', 'editor');
  const goDone = () => set('screen', 'done');

  // Shots
  const addShot = useCallback(
    (blob: Blob) => {
      // Created/revoked outside the updater: state updaters can run twice
      // under React StrictMode, which would double these side effects.
      const url = URL.createObjectURL(blob);
      const replacedUrl =
        state.retakeIndex !== null ? state.shots[state.retakeIndex]?.url : undefined;
      if (replacedUrl) URL.revokeObjectURL(replacedUrl);

      setState(prev => {
        const shot: Shot = {
          id: `shot-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          blob,
          url,
        };
        if (prev.retakeIndex !== null) {
          const shots = [...prev.shots];
          shots[prev.retakeIndex] = shot;
          return { ...prev, shots, retakeIndex: null };
        }
        return { ...prev, shots: [...prev.shots, shot] };
      });
    },
    [state.retakeIndex, state.shots],
  );

  // After all shots captured (from CaptureScreen)
  const onCaptureDone = useCallback(() => {
    goReview();
  }, []);

  // Stickers
  const addSticker = useCallback((stickerId: string) => {
    // Image/SVG glyphs start larger than emoji, as % of canvas width.
    const def = findStickerDef(stickerId);
    const sizePct = def?.src || def?.Svg
      ? STICKER_SIZE_DEFAULT_GRAPHIC
      : STICKER_SIZE_DEFAULT_EMOJI;
    setState(prev => {
      const id = `sticker-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newSticker: PlacedSticker = {
        id,
        stickerId,
        x: 35 + Math.random() * 30,
        y: 20 + Math.random() * 60,
        sizePct,
        rotation: Math.round((Math.random() - 0.5) * 30),
      };
      return { ...prev, stickers: [...prev.stickers, newSticker], selectedStickerId: id };
    });
  }, []);

  const moveSticker = useCallback((id: string, x: number, y: number) => {
    setState(prev => ({
      ...prev,
      stickers: prev.stickers.map(s => (s.id === id ? { ...s, x, y } : s)),
    }));
  }, []);

  const deleteSticker = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      stickers: prev.stickers.filter(s => s.id !== id),
      selectedStickerId: prev.selectedStickerId === id ? null : prev.selectedStickerId,
    }));
  }, []);

  const resizeStickerPx = useCallback((id: string, sizePct: number) => {
    setState(prev => ({
      ...prev,
      stickers: prev.stickers.map(s =>
        s.id === id ? { ...s, sizePct: Math.max(STICKER_SIZE_MIN, Math.min(STICKER_SIZE_MAX, sizePct)) } : s,
      ),
    }));
  }, []);

  /** Absolute rotation (deg) from the SelectionBox rotate handle. */
  const rotateStickerAbs = useCallback((id: string, rotation: number) => {
    setState(prev => ({
      ...prev,
      stickers: prev.stickers.map(s => (s.id === id ? { ...s, rotation } : s)),
    }));
  }, []);

  // Polaroid cards
  const setPolaroidCount = useCallback((count: 1 | 2 | 3) => {
    setState(prev => ({
      ...prev,
      polaroidCount: count,
      polaroids: defaultPolaroids(count),
      selectedPolaroidId: null,
    }));
  }, []);

  const resetPolaroids = useCallback(() => {
    setState(prev => ({
      ...prev,
      polaroids: defaultPolaroids(prev.polaroidCount),
      selectedPolaroidId: null,
    }));
  }, []);

  const selectPolaroid = useCallback((id: string | null) => {
    setState(prev => {
      if (id === null) return { ...prev, selectedPolaroidId: null };
      // Selecting a card brings it to the top of the card order.
      const card = prev.polaroids.find(p => p.id === id);
      if (!card) return { ...prev, selectedPolaroidId: id };
      return {
        ...prev,
        selectedPolaroidId: id,
        polaroids: [...prev.polaroids.filter(p => p.id !== id), card],
      };
    });
  }, []);

  const movePolaroid = useCallback((id: string, x: number, y: number) => {
    setState(prev => ({
      ...prev,
      polaroids: prev.polaroids.map(p => (p.id === id ? { ...p, x, y } : p)),
    }));
  }, []);

  const resizePolaroid = useCallback((id: string, width: number) => {
    setState(prev => ({
      ...prev,
      polaroids: prev.polaroids.map(p =>
        p.id === id ? { ...p, width: Math.max(25, Math.min(90, width)) } : p,
      ),
    }));
  }, []);

  /** Absolute rotation (deg) for cards from the SelectionBox rotate handle. */
  const rotatePolaroidAbs = useCallback((id: string, rotation: number) => {
    setState(prev => ({
      ...prev,
      polaroids: prev.polaroids.map(p => (p.id === id ? { ...p, rotation } : p)),
    }));
  }, []);

  const { screen, mode, layout, poseCount, selectedPoses, shots, retakeIndex, bgColor, bgImage, stickers, caption, showDate, filterId, selectedStickerId, polaroidCount, polaroids, selectedPolaroidId } =
    state;

  return (
    <div
      className="min-h-dvh lg:h-dvh flex flex-col lg:overflow-hidden"
      style={{ background: '#FFF9F5' }}
    >
      <StepHeader screen={screen} />

      <main className="flex-1 min-h-0 flex flex-col">
        {screen === 'home' && <HomeScreen onSelect={goSetup} />}

        {screen === 'setup' && (
          <SetupScreen
            mode={mode}
            layout={layout}
            poseCount={poseCount}
            selectedPoses={selectedPoses}
            polaroidCount={polaroidCount}
            polaroids={polaroids}
            bgColor={bgColor}
            bgImage={bgImage}
            shots={shots}
            onSetLayout={l => set('layout', l)}
            onSetPoseCount={count =>
              setState(prev => ({
                ...prev,
                poseCount: count,
                // Lowering the count drops extra selections from the end.
                selectedPoses: prev.selectedPoses.slice(0, count),
              }))
            }
            onTogglePose={(id, max) =>
              setState(prev => {
                const has = prev.selectedPoses.includes(id);
                let next = has
                  ? prev.selectedPoses.filter(p => p !== id)
                  : prev.selectedPoses.length < max
                  ? [...prev.selectedPoses, id]
                  : prev.selectedPoses;
                next = next.slice(0, max);
                return { ...prev, selectedPoses: next };
              })
            }
            onSetPolaroidCount={setPolaroidCount}
            onSetBgColor={c => setState(prev => ({ ...prev, bgColor: c, bgImage: null }))}
            onSetBgImage={src => setState(prev => ({ ...prev, bgImage: src }))}
            onBack={goHome}
            onContinue={goCapture}
          />
        )}

        {screen === 'capture' && (
          <CaptureScreen
            mode={mode}
            layout={layout}
            poseCount={poseCount}
            selectedPoses={selectedPoses}
            polaroidCount={polaroidCount}
            shots={shots}
            retakeIndex={retakeIndex}
            filterId={filterId}
            onSetFilterId={id => set('filterId', id)}
            onAddShot={addShot}
            onBack={() => set('screen', retakeIndex !== null ? 'review' : 'setup')}
            onDone={onCaptureDone}
          />
        )}

        {screen === 'review' && (
          <ReviewScreen
            mode={mode}
            layout={layout}
            poseCount={poseCount}
            selectedPoses={selectedPoses}
            polaroidCount={polaroidCount}
            shots={shots}
            filterId={filterId}
            onRetake={goCaptureRetake}
            onBack={() => set('screen', 'capture')}
            onContinue={goEditor}
          />
        )}

        {screen === 'editor' && (
          <EditorScreen
            mode={mode}
            layout={layout}
            poseIds={selectedPoses}
            shots={shots}
            bgColor={bgColor}
            bgImage={bgImage}
            stickers={stickers}
            caption={caption}
            showDate={showDate}
            selectedStickerId={selectedStickerId}
            polaroids={polaroids}
            selectedPolaroidId={selectedPolaroidId}
            onSetBgColor={c => setState(prev => ({ ...prev, bgColor: c, bgImage: null }))}
            onSetBgImage={src => setState(prev => ({ ...prev, bgImage: src }))}
            onAddSticker={addSticker}
            onMoveSticker={moveSticker}
            onDeleteSticker={deleteSticker}
            onResizeStickerPct={resizeStickerPx}
            onRotateStickerAbs={rotateStickerAbs}
            onSelectSticker={id => set('selectedStickerId', id)}
            onSetCaption={t => set('caption', t)}
            onSetShowDate={v => set('showDate', v)}
            filterId={filterId}
            onSetFilterId={id => set('filterId', id)}
            onSelectPolaroid={selectPolaroid}
            onMovePolaroid={movePolaroid}
            onResizePolaroid={resizePolaroid}
            onRotatePolaroidAbs={rotatePolaroidAbs}
            onResetPolaroids={resetPolaroids}
            onBack={goReview}
            onContinue={goDone}
          />
        )}

        {screen === 'done' && (
          <DoneScreen
            mode={mode}
            layout={layout}
            poseIds={selectedPoses}
            shots={shots}
            bgColor={bgColor}
            bgImage={bgImage}
            stickers={stickers}
            caption={caption}
            showDate={showDate}
            filterId={filterId}
            polaroids={polaroids}
            onBack={goEditor}
            onStartOver={goHome}
          />
        )}
      </main>
    </div>
  );
}

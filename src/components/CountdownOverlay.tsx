import { Camera } from 'lucide-react';

interface CountdownOverlayProps {
  count: number | 'snap' | null;
}

const countColors: Record<string, string> = {
  '5': '#FFD6E8',
  '4': '#E8D5FF',
  '3': '#C8F5E3',
  '2': '#FFF3C4',
  '1': '#C8E8FF',
  snap: '#FFB3C8',
};

export default function CountdownOverlay({ count }: CountdownOverlayProps) {
  if (count === null) return null;

  const key = String(count);
  const bg = countColors[key] ?? '#FFD6E8';
  const isSnap = count === 'snap';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded-2xl z-10"
      style={{ background: `${bg}CC`, backdropFilter: 'blur(2px)' }}
    >
      <div
        className="flex flex-col items-center gap-1"
        style={{
          animation: isSnap ? 'none' : 'countPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {isSnap ? (
          <>
            <Camera size={72} strokeWidth={1.75} className="text-booth-text" />
            <span className="text-2xl font-black text-booth-text">Snap!</span>
          </>
        ) : (
          <>
            <span
              className="font-black text-booth-text leading-none"
              style={{ fontSize: 112 }}
            >
              {count}
            </span>
            <span className="text-sm font-bold text-booth-muted tracking-widest uppercase">
              smile!
            </span>
          </>
        )}
      </div>
      <style>{`
        @keyframes countPop {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

import type { ComponentType } from 'react';

interface PosePackCardProps {
  name: string;
  Icon: ComponentType<{ size?: number | string; strokeWidth?: number | string; color?: string }>;
  colors: string[];
  selected: boolean;
  onClick: () => void;
}

export default function PosePackCard({ name, Icon, colors, selected, onClick }: PosePackCardProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex flex-col items-center gap-3 rounded-2xl border-2 bg-white p-4 transition-all duration-200 hover:-translate-y-1 focus:outline-none w-40',
        selected
          ? 'border-booth-rose shadow-lg shadow-booth-pink/40'
          : 'border-booth-border hover:border-booth-rose',
      ].join(' ')}
    >
      <div className="grid grid-cols-2 gap-1 w-full">
        {colors.map((c, i) => (
          <div
            key={i}
            className="rounded-md flex items-center justify-center text-lg"
            style={{ background: c, height: 44 }}
          >
            {i === 0 ? <Icon size={22} strokeWidth={1.75} color="#3A2A3A" /> : ''}
          </div>
        ))}
      </div>
      <div className="text-center">
        <p className="font-bold text-booth-text text-xs">{name}</p>
        <p className="text-[10px] text-booth-muted">4 poses</p>
      </div>
      {selected && (
        <div className="w-5 h-5 rounded-full bg-booth-rose flex items-center justify-center text-white text-xs font-bold">
          ✓
        </div>
      )}
    </button>
  );
}

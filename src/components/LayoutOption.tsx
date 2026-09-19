import { type Layout } from '../types';
import StripPreview from './StripPreview';

interface LayoutOptionProps {
  layout: Layout;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export default function LayoutOption({ layout, label, description, selected, onClick }: LayoutOptionProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex flex-col items-center gap-3 rounded-2xl border-2 bg-white p-5 transition-all duration-200 hover:-translate-y-1 focus:outline-none',
        selected
          ? 'border-booth-violet shadow-lg shadow-booth-lavender/40'
          : 'border-booth-border hover:border-booth-lavender',
      ].join(' ')}
    >
      <div className="relative">
        <StripPreview
          layout={layout}
          shots={[]}
          bgColor="#FFFFFF"
          scale={0.85}
          tilted={false}
        />
        {selected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-booth-violet flex items-center justify-center text-white text-xs font-bold shadow-sm">
            ✓
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="font-bold text-booth-text text-sm">{label}</p>
        <p className="text-xs text-booth-muted mt-0.5">{description}</p>
      </div>
    </button>
  );
}

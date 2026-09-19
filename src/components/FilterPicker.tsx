import { FILTERS } from '../lib/filters';

interface FilterPickerProps {
  value: string;
  onChange: (id: string) => void;
}

/** Row of small rounded pastel pills, one per filter; selected is highlighted. */
export default function FilterPicker({ value, onChange }: FilterPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FILTERS.map(f => {
        const selected = f.id === value;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={[
              'px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 border',
              selected
                ? 'bg-booth-violet text-white border-booth-violet shadow-sm shadow-booth-lavender/60'
                : 'bg-booth-bg text-booth-muted border-booth-border hover:border-booth-lavender hover:text-booth-violet',
            ].join(' ')}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

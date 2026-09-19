interface ColorSwatchProps {
  color: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  /** Hide the label + shrink to 32px (Editor's tabbed left panel). */
  compact?: boolean;
}

export default function ColorSwatch({ color, label, selected, onClick, compact = false }: ColorSwatchProps) {
  const isDark = color === '#2A1A2A';
  return (
    <button
      onClick={onClick}
      title={label}
      className="relative flex flex-col items-center gap-1.5 group focus:outline-none"
    >
      <div
        className={[
          'rounded-full border-2 transition-all duration-150 group-hover:scale-110',
          compact ? 'w-8 h-8' : 'w-9 h-9',
          selected ? 'border-booth-violet scale-110 shadow-md shadow-booth-lavender/60' : 'border-booth-border',
        ].join(' ')}
        style={{ background: color }}
      >
        {selected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-[10px] font-black"
              style={{ color: isDark ? '#FFD6E8' : '#3A2A3A' }}
            >
              ✓
            </span>
          </div>
        )}
      </div>
      {!compact && <span className="text-[9px] text-booth-muted font-semibold">{label}</span>}
    </button>
  );
}

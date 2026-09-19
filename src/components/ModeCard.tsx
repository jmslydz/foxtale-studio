interface ModeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  bg: string;
  onClick: () => void;
  /** Tighter paddings/sizes so three cards fit the desktop viewport height. */
  compact?: boolean;
}

export default function ModeCard({ title, description, icon, accent, bg, onClick, compact = false }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'group relative flex flex-col items-center rounded-3xl border-2 border-booth-border bg-white text-left transition-all duration-200 hover:border-current hover:shadow-lg hover:-translate-y-1 focus:outline-none',
        compact ? 'w-64 px-7 py-6 gap-4' : 'w-72 px-10 py-10 gap-5',
      ].join(' ')}
      style={{ '--tw-border-opacity': '1' } as React.CSSProperties}
      onMouseEnter={e => (e.currentTarget.style.borderColor = accent)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
    >
      <div
        className={[
          'rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105',
          compact ? 'w-20 h-20 text-4xl' : 'w-28 h-28 text-5xl',
        ].join(' ')}
        style={{ background: bg }}
      >
        {icon}
      </div>
      <div className="text-center">
        <h3 className={['font-extrabold text-booth-text mb-2', compact ? 'text-xl' : 'text-2xl'].join(' ')}>{title}</h3>
        <p className={['text-booth-muted leading-relaxed', compact ? 'text-xs' : 'text-sm'].join(' ')}>{description}</p>
      </div>
      <div
        className={[
          'rounded-full font-bold text-white transition-all duration-200 group-hover:scale-105',
          compact ? 'mt-1 px-4 py-1.5 text-xs' : 'mt-2 px-5 py-2 text-sm',
        ].join(' ')}
        style={{ background: accent }}
      >
        Get Started
      </div>
    </button>
  );
}

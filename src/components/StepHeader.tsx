import { STEPS, SCREEN_STEPS, type Screen } from '../types';

interface StepHeaderProps {
  screen: Screen;
}

export default function StepHeader({ screen }: StepHeaderProps) {
  const current = SCREEN_STEPS[screen];

  return (
    <header className="w-full h-16 shrink-0 bg-white border-b border-booth-border px-8 flex items-center justify-between select-none">
      <div className="flex items-center gap-2 min-w-0">
        <img
          src={`${import.meta.env.BASE_URL}brand/fox-logo.png`}
          alt="Foxtale Studio logo"
          draggable={false}
          className="h-9 w-auto"
        />
        <span className="text-xl font-black tracking-tight text-booth-text hidden md:block">
          <span className="text-booth-violet">Fox</span>tale Studio
        </span>
      </div>

      <div className="flex items-center gap-1 flex-wrap justify-end">
        {STEPS.map((label, i) => {
          const step = i + 1;
          const isPast = step < current;
          const isCurrent = step === current;
          const isFuture = step > current;

          return (
            <div key={label} className="flex items-center gap-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200',
                    isCurrent
                      ? 'bg-booth-violet text-white shadow-sm'
                      : isPast
                      ? 'bg-booth-mint text-booth-text'
                      : 'bg-booth-border text-booth-muted',
                  ].join(' ')}
                >
                  {isPast ? '✓' : step}
                </div>
                <span
                  className={[
                    'text-[10px] font-semibold whitespace-nowrap',
                    isCurrent
                      ? 'text-booth-violet'
                      : isPast
                      ? 'text-booth-sage'
                      : 'text-booth-muted',
                  ].join(' ')}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={[
                    'w-8 h-[2px] mb-4 rounded-full transition-all duration-200',
                    isPast ? 'bg-booth-sage' : 'bg-booth-border',
                  ].join(' ')}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="w-32" />
    </header>
  );
}

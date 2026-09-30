import { useEffect, useRef, useState } from 'react';

const PASSWORD = '100606';
const PROMPT =
  'ARE U MYY BABBYYY?? HMMMM... IFF U AREEE REALLYYY MYY BABYY, KELANN BIRTHHDAYYY MOOO HMMM';

const MISS_MESSAGES = [
  'Hmm... not quite, moo 🐮 try again!',
  'Nope baby! Think birthdate 😘',
  'Wrong one! Kelan is watching 👀',
];

const FLOATERS = [
  { ch: '💖', left: '8%', top: '12%', size: 28, delay: '0s' },
  { ch: '💕', left: '86%', top: '18%', size: 24, delay: '0.8s' },
  { ch: '✨', left: '14%', top: '68%', size: 22, delay: '1.6s' },
  { ch: '💗', left: '88%', top: '62%', size: 26, delay: '2.2s' },
  { ch: '🌸', left: '78%', top: '84%', size: 24, delay: '1.1s' },
  { ch: '💝', left: '6%', top: '42%', size: 22, delay: '2.8s' },
  { ch: '✨', left: '90%', top: '40%', size: 20, delay: '0.4s' },
  { ch: '💖', left: '20%', top: '88%', size: 20, delay: '3.1s' },
];

/** Love-gate: birthday password with typing animation, wiggling fox and shake-on-miss. */
export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [typed, setTyped] = useState('');
  const [value, setValue] = useState('');
  const [misses, setMisses] = useState(0);
  const [opening, setOpening] = useState(false);
  const timer = useRef<number | null>(null);

  // Typewriter prompt.
  useEffect(() => {
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      setTyped(PROMPT.slice(0, i));
      if (i >= PROMPT.length) window.clearInterval(t);
    }, 42);
    return () => window.clearInterval(t);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const tryUnlock = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 6 || opening) return;
    if (digits === PASSWORD) {
      setOpening(true);
      timer.current = window.setTimeout(onUnlock, 1200);
    } else {
      setMisses(m => m + 1);
      setValue('');
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-6 py-10" style={{ background: '#FFF9F5' }}>
      {/* Floating cuties */}
      {FLOATERS.map((f, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute select-none pointer-events-none animate-drift"
          style={{ left: f.left, top: f.top, fontSize: f.size, animationDelay: f.delay }}
        >
          {f.ch}
        </span>
      ))}

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-5 animate-pop">
        {/* Wiggling fox */}
        <div className="relative">
          <img
            src={`${import.meta.env.BASE_URL}brand/fox-logo.png`}
            alt="Foxtale fox"
            draggable={false}
            className="h-28 w-auto animate-wiggle"
          />
          {opening && (
            <>
              <span className="absolute -left-8 top-0 text-3xl animate-pop">💖</span>
              <span className="absolute -right-8 top-2 text-3xl animate-pop" style={{ animationDelay: '150ms' }}>💖</span>
              <span className="absolute left-1/2 -translate-x-1/2 -top-8 text-3xl animate-pop" style={{ animationDelay: '300ms' }}>💖</span>
            </>
          )}
        </div>

        {/* Typing prompt */}
        <p className="text-center text-lg font-black text-booth-text leading-relaxed min-h-24" aria-live="polite">
          {typed}
          <span className="inline-block w-2 animate-pulse text-booth-violet">|</span>
        </p>
        <p className="text-xs font-bold text-booth-muted tracking-widest -mt-3">KELANN BIRTHDAYYY (DD/MM/YY) MOOO</p>

        {/* Password box (shakes on miss) */}
        <div key={misses} className={misses > 0 ? 'animate-shake' : undefined}>
          <input
            type="password"
            value={value}
            onChange={e => {
              const v = e.target.value;
              setValue(v);
              tryUnlock(v);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') tryUnlock(value);
            }}
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            placeholder="••/••/••"
            aria-label="Birthday password DD MM YY"
            disabled={opening}
            className="w-52 text-center text-2xl font-black tracking-[0.3em] text-booth-text placeholder-booth-muted/60 bg-white border-2 border-booth-border rounded-2xl px-4 py-3 focus:outline-none focus:border-booth-violet focus:shadow-lg focus:shadow-booth-lavender/50 transition-all duration-150"
          />
        </div>

        {misses > 0 && !opening && (
          <p role="alert" className="text-sm font-bold text-booth-rose text-center -mt-2">
            {MISS_MESSAGES[(misses - 1) % MISS_MESSAGES.length]}
          </p>
        )}
        {opening && (
          <p className="text-base font-black text-booth-violet text-center -mt-2 animate-pop">
            YAAAY IT'S REALLY YOUU!! 💕
          </p>
        )}

        <button
          onClick={() => tryUnlock(value)}
          disabled={opening}
          className="px-10 py-3 rounded-full bg-booth-violet text-white font-black text-base hover:scale-105 active:scale-95 transition-all duration-150 shadow-lg shadow-booth-lavender/50 disabled:opacity-60"
        >
          {opening ? 'Opening... 💝' : 'Open mooo 🐮'}
        </button>
      </div>
    </div>
  );
}

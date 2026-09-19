import type { ReactNode } from 'react';

interface BottomBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Pinned action bar (Back / Continue / Download / Start over...).
 * shrink-0 tail of every screen on desktop; sticky to the viewport bottom on
 * small screens so the buttons are never below the fold.
 */
export default function BottomBar({ children, className = '' }: BottomBarProps) {
  return (
    <div
      className={[
        'shrink-0 sticky bottom-0 z-30 w-full flex items-center justify-center gap-4',
        'px-6 py-3 bg-booth-bg/95 backdrop-blur-sm border-t border-booth-border',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

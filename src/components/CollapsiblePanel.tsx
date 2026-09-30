import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsiblePanelProps {
  title: string;
  /** Small status text beside the chevron, e.g. "2/4". */
  meta?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * Minimize toggle for phone layouts. On small screens the content collapses
 * to a slim bar (chevron points left when closed); on lg+ the toggle hides
 * and content always shows. Uses display:contents so flex layouts are
 * unaffected either way.
 */
export default function CollapsiblePanel({ title, meta, open, onToggle, children }: CollapsiblePanelProps) {
  return (
    <>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="lg:hidden shrink-0 w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white border-b border-booth-border"
      >
        <span className="text-xs font-black text-booth-text uppercase tracking-wider">{title}</span>
        <span className="flex items-center gap-2">
          {meta && <span className="text-[11px] font-bold text-booth-muted">{meta}</span>}
          <ChevronDown
            size={16}
            strokeWidth={2.5}
            className={['text-booth-muted transition-transform duration-200', open ? '' : '-rotate-90'].join(' ')}
          />
        </span>
      </button>
      <div className={open ? 'contents' : 'hidden lg:contents'}>{children}</div>
    </>
  );
}

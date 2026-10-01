import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"

interface CollapsiblePanelProps {
  title: string
  /** Small status text beside the chevron, e.g. "2/4". */
  meta?: string
  open: boolean
  onToggle: () => void
  children: ReactNode
  /** Keep the toggle button visible at the top while the content scrolls. */
  sticky?: boolean
  /** Make the mobile content scrollable instead of pushing the rest of the page down. */
  scrollable?: boolean
}

/**
 * Minimize toggle for compact layouts. Below xl the content can collapse
 * to a slim bar (chevron points left when closed); on xl+ the toggle hides
 * and content always shows. Uses display:contents so flex layouts are
 * unaffected either way.
 */
export default function CollapsiblePanel({
  title,
  meta,
  open,
  onToggle,
  children,
  sticky = false,
  scrollable = false,
}: CollapsiblePanelProps) {
  return (
    <>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className={[
          "xl:hidden shrink-0 w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border-b border-booth-border",
          sticky ? "sticky top-0 z-20" : "",
        ].join(" ")}
      >
        <span className="text-xs font-black text-booth-text uppercase tracking-wider">
          {title}
        </span>
        <span className="flex items-center gap-2">
          {meta && (
            <span className="text-xs font-bold text-booth-muted">{meta}</span>
          )}
          <ChevronDown
            size={16}
            strokeWidth={2.5}
            className={[
              "text-booth-muted transition-transform duration-200",
              open ? "" : "-rotate-90",
            ].join(" ")}
          />
        </span>
      </button>
      <div
        className={[
          open ? "block" : "hidden",
          "xl:contents",
          scrollable ? "max-h-[40vh] overflow-y-auto xl:max-h-none" : "",
        ].join(" ")}
      >
        {children}
      </div>
    </>
  )
}

import { Component, type ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/** Catches render crashes anywhere below and shows a recovery screen instead of blank. */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(err: unknown) {
    console.error("Uncaught render error:", err)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ background: "#FFF9F5" }}
      >
        <p className="text-2xl font-black text-booth-text">
          Something went wrong
        </p>
        <p className="text-sm text-booth-muted">
          The booth hit a snag. Reloading keeps nothing — your photos live only
          in this session.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-2.5 rounded-full bg-booth-violet text-white font-black text-base hover:scale-105 transition-all duration-150"
        >
          Reload the booth
        </button>
      </div>
    )
  }
}

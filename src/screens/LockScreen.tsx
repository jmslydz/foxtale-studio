import { useEffect, useRef, useState } from "react"
import { ArrowRight, Heart } from "lucide-react"
import Brand from "../components/Brand"
const PASSWORD = "100606"
export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("")
  const [error, setError] = useState(false)
  const [opening, setOpening] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )
  function unlock() {
    if (opening) return
    if (value.replace(/\D/g, "") === PASSWORD) {
      setOpening(true)
      setError(false)
      timer.current = window.setTimeout(onUnlock, 500)
    } else {
      setError(true)
    }
  }
  return (
    <div className="lock-page">
      <div className="lock-shell animate-screen-in">
        <div className="lock-art">
          <img
            src={`${import.meta.env.BASE_URL}brand/fox-hero.webp`}
            alt="Foxtale's friendly fox with a camera"
            width="1024"
            height="1024"
          />
          <p>A little space, just for us.</p>
        </div>
        <div className="lock-content">
          <Brand compact />
          <h1>
            For my
            <br />
            favorite person.
          </h1>
          <p>
            A little fox is saving you a seat.
            <br />
            What's your birthday, baby?
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              unlock()
            }}
          >
            <label htmlFor="birthday">YOUR BIRTHDAY · DD/MM/YY</label>
            <input
              id="birthday"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={8}
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError(false)
              }}
              placeholder="••/••/••"
              aria-invalid={error}
              aria-describedby={error ? "birthday-error" : undefined}
              disabled={opening}
            />
            {error && (
              <p
                id="birthday-error"
                role="alert"
                className="text-booth-danger text-xs mt-3"
              >
                Not quite, love. Try your birthday in DD/MM/YY format.
              </p>
            )}
            <button
              className="primary-action"
              disabled={opening || value.replace(/\D/g, "").length !== 6}
            >
              {opening ? "You're home. Opening…" : "Open our little studio"}
              <ArrowRight size={16} />
            </button>
          </form>
          <p className="lock-note flex gap-2 items-center">
            <Heart size={12} /> Little moments, made with love.
          </p>
        </div>
      </div>
    </div>
  )
}

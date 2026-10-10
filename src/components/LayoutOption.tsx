import { Check } from "lucide-react"
import type { Layout } from "../types"
interface LayoutOptionProps {
  layout: Layout
  label: string
  description: string
  selected: boolean
  onClick: () => void
}
export default function LayoutOption({
  layout,
  label,
  description,
  selected,
  onClick,
}: LayoutOptionProps) {
  const grid = layout === "4-landscape"
  const count = layout === "3-portrait" ? 3 : 4
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`layout-card ${selected ? "is-selected" : ""}`}
    >
      <div className="layout-card-top">
        <span>
          {grid
            ? "THE WHOLE PICTURE"
            : count === 3
              ? "SHORT & SWEET"
              : "A BOOTH FAVORITE"}
        </span>
        <span className="layout-check">{selected && <Check size={13} />}</span>
      </div>
      <div className="layout-sample" aria-hidden="true">
        <div className={`layout-paper ${grid ? "is-grid" : ""}`}>
          <div className="layout-frames">
            {Array.from({ length: count }, (_, i) => (
              <span key={i}>
                <img
                  src={`${import.meta.env.BASE_URL}brand/fox-mark.svg`}
                  alt=""
                />
                <small>0{i + 1}</small>
              </span>
            ))}
          </div>
          <p>FOXTALE STUDIO</p>
        </div>
      </div>
      <h3>{label}</h3>
      <p>{description}</p>
    </button>
  )
}

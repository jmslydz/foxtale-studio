import { type PoseRef } from "../types"
import { resolvePublicSrc } from "../stickerCatalog"

interface PoseTileProps {
  pose: PoseRef & { color?: string }
  /** 1-based selection number; undefined when not selected. */
  order?: number
  onClick: () => void
}

/** Reference-photo tile: 4:3, stretched to fill the frame edge to edge. */
export default function PoseTile({ pose, order, onClick }: PoseTileProps) {
  const selected = order !== undefined
  return (
    <button
      onClick={onClick}
      title={pose.label}
      aria-label={`${pose.label}${
        selected ? `, selected as pose ${order}` : ""
      }`}
      aria-pressed={selected}
      className={[
        "relative overflow-hidden rounded-lg border-2 transition-all duration-150 bg-booth-bg",
        selected
          ? "border-booth-violet shadow-md shadow-booth-lavender/60"
          : "border-booth-border hover:border-booth-lavender",
      ].join(" ")}
      style={{ aspectRatio: "4 / 3" }}
    >
      {pose.src ? (
        <img
          src={resolvePublicSrc(pose.src)}
          alt={pose.label}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="w-full h-full object-fill"
        />
      ) : (
        <span
          className="block w-full h-full"
          style={{ background: pose.color ?? "#E8D5FF" }}
        />
      )}
      {selected && (
        <span
          className="absolute top-1 left-1 flex items-center justify-center rounded-full text-white font-black"
          style={{
            width: 20,
            height: 20,
            background: "#FF8A3D",
            fontSize: 11,
            boxShadow: "0 1px 4px rgba(58,42,58,0.35)",
          }}
        >
          {order}
        </span>
      )}
    </button>
  )
}

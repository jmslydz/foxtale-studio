export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-lockup">
      <img
        src={`${import.meta.env.BASE_URL}brand/fox-mark.svg`}
        alt=""
        width="42"
        height="42"
      />
      <span className="brand-name">
        foxtale<span className="brand-studio">STUDIO</span>
      </span>
      {!compact && <span className="brand-tag">A LITTLE PHOTO MAGIC</span>}
    </span>
  )
}

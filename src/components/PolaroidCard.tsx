import { getFilterCss } from '../lib/filters';
import { layoutPolaroidText } from '../lib/polaroidText';

interface PolaroidCardProps {
  /** Rendered card width in pixels (the canvas computes it). */
  width: number;
  photoUrl?: string;
  /** Session filter, applied to the USER's photo only. */
  filterId?: string;
  placeholder?: string;
  caption?: string;
  showDate?: boolean;
}

/**
 * One polaroid card: white frame, square photo, bottom border with caption
 * and date. All text metrics come from layoutPolaroidText (6% side/top
 * borders, >=24% bottom border, W-relative fonts, max 2 caption lines) — the
 * same function the PNG export uses, so Editor/Done/download match exactly.
 */
export default function PolaroidCard({
  width,
  photoUrl,
  filterId = 'original',
  placeholder = '#E8D5FF',
  caption,
  showDate,
}: PolaroidCardProps) {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const layout = layoutPolaroidText(width, caption ?? '', !!showDate, today);

  return (
    <div
      className="bg-white flex flex-col"
      style={{
        width,
        padding: `${Math.round(width * 0.06)}px ${Math.round(width * 0.06)}px 0`,
        boxShadow: '0 6px 20px rgba(58,42,58,0.18)',
        borderRadius: 3,
      }}
    >
      {/* Square 1:1 photo area */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          background: placeholder,
          overflow: 'hidden',
        }}
      >
        {photoUrl && (
          <img
            src={photoUrl}
            alt=""
            draggable={false}
            className="w-full h-full object-cover"
            style={{ filter: getFilterCss(filterId) }}
          />
        )}
      </div>

      {/* Bottom border: caption (max 2 lines, centered) + date, never overflowing */}
      <div
        data-band
        style={{
          height: layout.bandH,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          overflow: 'hidden',
        }}
      >
        {layout.lines.map((line, i) => (
          <span
            key={i}
            data-cap-line
            style={{
              fontSize: layout.capSize,
              fontWeight: 700,
              color: '#3A2A3A',
              letterSpacing: '0.05em',
              lineHeight: 1.15,
              maxWidth: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {line}
          </span>
        ))}
        {showDate && layout.dateSize > 0 && (
          <span
            data-date
            style={{
              fontSize: layout.dateSize,
              color: '#9A8A9A',
              fontStyle: 'italic',
              lineHeight: 1.25,
              maxWidth: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {today}
          </span>
        )}
      </div>
    </div>
  );
}

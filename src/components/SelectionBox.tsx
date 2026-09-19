import { useLayoutEffect, useRef, useState } from 'react';
import { startResize, startRotate } from '../hooks/useTransformGestures';

interface SelectionBoxProps {
  /** Item rotation in degrees — the box and handles follow it. */
  rotation: number;
  /** Resize limits, in the same px unit the item is sized by. */
  minSize: number;
  maxSize: number;
  /** Uniform corner resize: receives the new size in px (caller converts to its unit). */
  onResize: (newSizePx: number) => void;
  /** Absolute rotation in degrees from the atan2 gesture. */
  onRotate: (rotation: number) => void;
}

const HANDLE = 16;

/**
 * Selection outline for the ONE selected item. Rendered INSIDE the item's
 * (rotated) wrapper, so the dashed outline and handles follow the rotation.
 * Self-measuring: works for stickers and polaroid cards alike.
 */
export default function SelectionBox({
  rotation,
  minSize,
  maxSize,
  onResize,
  onRotate,
}: SelectionBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The item's wrapper rotates around its center, so the bounding-rect center
  // is the true center even while rotated.
  const centerAt = () => {
    const el = boxRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  const corners: { label: string; cx: number; cy: number; cursor: string }[] = [
    { label: 'nw', cx: 0, cy: 0, cursor: 'nwse-resize' },
    { label: 'ne', cx: size.w, cy: 0, cursor: 'nesw-resize' },
    { label: 'se', cx: size.w, cy: size.h, cursor: 'nwse-resize' },
    { label: 'sw', cx: 0, cy: size.h, cursor: 'nesw-resize' },
  ];

  return (
    <div
      ref={boxRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        outline: '2px dashed #FF8A3D',
        outlineOffset: 2,
        borderRadius: 6,
      }}
    >
      {/* Corner resize handles (uniform scale from center) */}
      {corners.map(c => (
        <div
          key={c.label}
          onPointerDown={e => {
            e.stopPropagation();
            e.preventDefault();
            startResize(e, {
              center: centerAt(),
              initialSize: Math.max(size.w, 1),
              min: minSize,
              max: maxSize,
              onResize,
            });
          }}
          style={{
            position: 'absolute',
            left: c.cx - HANDLE / 2,
            top: c.cy - HANDLE / 2,
            width: HANDLE,
            height: HANDLE,
            borderRadius: '50%',
            background: '#E8D5FF',
            border: '2px solid #FF8A3D',
            cursor: c.cursor,
            pointerEvents: 'auto',
            touchAction: 'none',
            zIndex: 30,
          }}
        />
      ))}

      {/* Rotate handle above the top center (atan2 around the item center) */}
      <div
        onPointerDown={e => {
          e.stopPropagation();
          e.preventDefault();
          startRotate(e, {
            center: centerAt(),
            initialRotation: rotation,
            onRotate,
          });
        }}
        style={{
          position: 'absolute',
          left: size.w / 2 - HANDLE / 2,
          top: -HANDLE - 6,
          width: HANDLE,
          height: HANDLE,
          borderRadius: '50%',
          background: '#C8F5E3',
          border: '2px solid #9EDFC4',
          cursor: 'grab',
          pointerEvents: 'auto',
          touchAction: 'none',
          zIndex: 30,
        }}
      />
    </div>
  );
}

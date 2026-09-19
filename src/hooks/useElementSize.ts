import { useLayoutEffect, useRef, useState } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Measures an element's border-box size with a ResizeObserver.
 * Reads the observer's borderBoxSize (layout size), so CSS transforms
 * (e.g. scale-to-fit wrappers) never feed back into the measurement.
 */
export default function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const apply = (width: number, height: number) =>
      setSize(prev =>
        Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
          ? prev
          : { width, height },
      );
    const update = () => {
      const rect = el.getBoundingClientRect();
      apply(rect.width, rect.height);
    };

    update();
    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      const box = entry?.borderBoxSize?.[0];
      if (box) apply(box.inlineSize, box.blockSize);
      else update();
    });
    ro.observe(el, { box: 'border-box' });
    return () => ro.disconnect();
  }, []);

  return { ref, width: size.width, height: size.height };
}

import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Measures an element's width with a ResizeObserver so percentage-based
 * sticker sizing can be converted to px at the current layout.
 */
export default function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

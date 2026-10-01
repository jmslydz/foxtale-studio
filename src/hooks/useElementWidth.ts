import { useCallback, useLayoutEffect, useState } from "react"

/**
 * Measures an element's width with a ResizeObserver so percentage-based
 * sticker sizing can be converted to px at the current layout.
 *
 * The ref is a callback ref, so elements that mount later (popups,
 * conditional panels) are measured as soon as they appear.
 */
export default function useElementWidth<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null)
  const ref = useCallback((el: T | null) => {
    setNode(el)
  }, [])
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    if (!node) {
      setWidth(0)
      return
    }
    const update = () => setWidth(node.getBoundingClientRect().width)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(node)
    return () => ro.disconnect()
  }, [node])

  return { ref, width }
}

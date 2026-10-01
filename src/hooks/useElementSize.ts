import { useCallback, useLayoutEffect, useState } from "react"

export interface ElementSize {
  width: number
  height: number
}

/**
 * Measures an element's border-box size with a ResizeObserver.
 * Reads the observer's borderBoxSize (layout size), so CSS transforms
 * (e.g. scale-to-fit wrappers) never feed back into the measurement.
 *
 * The ref is a callback ref, so elements that mount later (popups,
 * conditional panels) are measured as soon as they appear.
 */
export default function useElementSize<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null)
  const ref = useCallback((el: T | null) => {
    setNode(el)
  }, [])
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    if (!node) {
      setSize({ width: 0, height: 0 })
      return
    }

    const apply = (width: number, height: number) =>
      setSize((prev) =>
        Math.abs(prev.width - width) < 0.5 &&
        Math.abs(prev.height - height) < 0.5
          ? prev
          : { width, height },
      )
    const update = () => {
      const rect = node.getBoundingClientRect()
      apply(rect.width, rect.height)
    }

    update()
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      const box = entry?.borderBoxSize?.[0]
      if (box) apply(box.inlineSize, box.blockSize)
      else update()
    })
    ro.observe(node, { box: "border-box" })
    return () => ro.disconnect()
  }, [node])

  return { ref, width: size.width, height: size.height }
}

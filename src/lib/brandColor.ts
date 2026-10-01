import { resolvePublicSrc } from "../stickerCatalog"

/** 'auto' = picked from the background for readability; otherwise an explicit hex. */
export type BrandSetting = string

export const BRAND_AUTO = "auto"

export const BRAND_SWATCHES: { label: string value: string }[] = [
  { label: "Auto", value: BRAND_AUTO },
  { label: "Fox", value: "#FF8A3D" },
  { label: "White", value: "#FFFFFF" },
  { label: "Ink", value: "#3A2A3A" },
]

/** Relative luminance of a hex color, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  let h = hex.replace("#", "").trim()
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("")
  if (!/^[0-9a-f]{6}$/i.test(h)) return 1
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Readable brand color for a background luminance: white on dark, ink on light. */
export function brandForLuminance(lum: number): string {
  return lum < 0.45 ? "#FFFFFF" : "#3A2A3A"
}

/** Sync auto pick from a flat background color (no image sampling). */
export function autoBrandColor(bgColor: string): string {
  return brandForLuminance(luminance(bgColor || "#FFFFFF"))
}

/**
 * Average luminance of a background image, sampled at 8x8. Returns null when
 * the image can't be read (then callers fall back to the flat bg color).
 */
export function sampleImageLuminance(src: string): Promise<number | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = 8
        canvas.height = 8
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, 8, 8)
        const data = ctx.getImageData(0, 0, 8, 8).data
        let lum = 0
        for (let i = 0; i < data.length; i += 4) {
          const [r, g, b] = [
            data[i] / 255,
            data[i + 1] / 255,
            data[i + 2] / 255,
          ].map((v) =>
            v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
          )
          lum += 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        resolve(lum / 64)
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = resolvePublicSrc(src)
  })
}

/**
 * Resolve the effective brand color: explicit choice wins, otherwise contrast
 * against the sampled background image (or the flat color when there is none).
 */
export function resolveBrandColor(
  setting: string,
  bgColor: string,
  bgLuminance: number | null,
): string {
  if (setting && setting !== BRAND_AUTO) return setting
  return brandForLuminance(bgLuminance ?? luminance(bgColor || "#FFFFFF"))
}

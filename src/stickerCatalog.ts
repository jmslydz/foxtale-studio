import manifest from "./generated/manifest.json"
import { STICKER_CATEGORIES, type StickerDef, type PoseRef } from "./types"

export type BackgroundDef = { id: string label: string src: string }

/** Sticker categories generated from public/stickers/, grouped by folder. */
export const IMAGE_STICKER_CATEGORIES: {
  name: string
  stickers: StickerDef[]
}[] = (() => {
  const byCategory = new Map<string, StickerDef[]>()
  for (const entry of manifest.stickers) {
    const list = byCategory.get(entry.category) ?? []
    list.push({
      id: entry.id,
      label: entry.label,
      src: entry.src,
    })
    byCategory.set(entry.category, list)
  }
  return [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, stickers]) => ({ name, stickers }))
})()

/** Built-in categories first, manifest categories appended after. */
export const ALL_STICKER_CATEGORIES = [
  ...STICKER_CATEGORIES,
  ...IMAGE_STICKER_CATEGORIES,
]

/** Find a sticker definition across built-ins, uploads, and manifest categories. */
export function findStickerDef(stickerId: string): StickerDef | undefined {
  const custom = customStickers.find((s) => s.id === stickerId)
  if (custom) return custom
  for (const category of ALL_STICKER_CATEGORIES) {
    const found = category.stickers.find((s) => s.id === stickerId)
    if (found) return found
  }
  return undefined
}

/** User-uploaded stickers (session only). Appear as the "My Stickers" category. */
const customStickers: StickerDef[] = []

export function getCustomStickers(): StickerDef[] {
  return customStickers
}

/** Register uploaded images as stickers; returns the created defs. */
export function addCustomStickers(
  files: { src: string label: string }[],
): StickerDef[] {
  const created: StickerDef[] = files.map((f, i) => ({
    id: `custom-sticker-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
    label: f.label,
    src: f.src,
  }))
  customStickers.push(...created)
  return created
}

/** All sticker categories: built-ins, then uploads, then manifest folders. */
export function getAllStickerCategories(): {
  name: string
  stickers: StickerDef[]
}[] {
  const list = [...STICKER_CATEGORIES]
  if (customStickers.length > 0) {
    list.push({ name: "My Stickers", stickers: [...customStickers] })
  }
  list.push(...IMAGE_STICKER_CATEGORIES)
  return list
}

/** Background images available in public/backgrounds/. */
export const IMAGE_BACKGROUNDS: BackgroundDef[] = manifest.backgrounds

/** User-uploaded strip backgrounds (session only), listed first. */
const customBackgrounds: BackgroundDef[] = []

export function getCustomBackgrounds(): BackgroundDef[] {
  return customBackgrounds
}

export function getAllBackgrounds(): BackgroundDef[] {
  return [...customBackgrounds, ...IMAGE_BACKGROUNDS]
}

/** Register uploaded images as strip backgrounds; returns the created defs. */
export function addCustomBackgrounds(
  files: { src: string label: string }[],
): BackgroundDef[] {
  const created: BackgroundDef[] = files.map((f, i) => ({
    id: `custom-bg-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
    label: f.label,
    src: f.src,
  }))
  customBackgrounds.push(...created)
  return created
}

/** Reference pose photos available in public/poses/. */
export const POSES: PoseRef[] = manifest.poses

/**
 * Resolve a pose/image src to a loadable URL. Manifest paths are
 * public-relative (prefixed with the base); absolute, data:, and blob: URLs
 * (e.g. user-uploaded photos) pass through untouched.
 */
export function resolvePublicSrc(src: string): string {
  if (/^(blob:|data:|https?:\/\/)/.test(src)) return src
  return import.meta.env.BASE_URL + src
}

/** User-uploaded pose photos (session only). Shown as the "My Poses" category. */
const customPoses: PoseRef[] = []

export function getCustomPoses(): PoseRef[] {
  return customPoses
}

/** Register uploaded photos as poses; returns the created refs. */
export function addCustomPoses(
  files: { src: string label: string }[],
): PoseRef[] {
  const created: PoseRef[] = files.map((f, i) => ({
    id: `custom-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
    label: f.label,
    category: "My Poses",
    src: f.src,
  }))
  customPoses.push(...created)
  return created
}

/** Find a pose across uploads first, then the manifest. */
export function findPose(id: string): PoseRef | undefined {
  return customPoses.find((p) => p.id === id) ?? POSES.find((p) => p.id === id)
}

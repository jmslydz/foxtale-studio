import manifest from './generated/manifest.json';
import { STICKER_CATEGORIES, type StickerDef, type PoseRef } from './types';

export type BackgroundDef = { id: string; label: string; src: string };

/** Sticker categories generated from public/stickers/, grouped by folder. */
export const IMAGE_STICKER_CATEGORIES: { name: string; stickers: StickerDef[] }[] =
  (() => {
    const byCategory = new Map<string, StickerDef[]>();
    for (const entry of manifest.stickers) {
      const list = byCategory.get(entry.category) ?? [];
      list.push({
        id: entry.id,
        label: entry.label,
        src: entry.src,
      });
      byCategory.set(entry.category, list);
    }
    return [...byCategory.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, stickers]) => ({ name, stickers }));
  })();

/** Built-in categories first, manifest categories appended after. */
export const ALL_STICKER_CATEGORIES = [...STICKER_CATEGORIES, ...IMAGE_STICKER_CATEGORIES];

/** Find a sticker definition across built-in and manifest categories. */
export function findStickerDef(stickerId: string): StickerDef | undefined {
  for (const category of ALL_STICKER_CATEGORIES) {
    const found = category.stickers.find(s => s.id === stickerId);
    if (found) return found;
  }
  return undefined;
}

/** Background images available in public/backgrounds/. */
export const IMAGE_BACKGROUNDS: BackgroundDef[] = manifest.backgrounds;

/** Reference pose photos available in public/poses/. */
export const POSES: PoseRef[] = manifest.poses;

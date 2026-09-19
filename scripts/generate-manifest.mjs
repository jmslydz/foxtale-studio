// Generates src/generated/manifest.json by scanning public/stickers/,
// public/backgrounds/ and public/poses/. Node built-ins only — no dependencies.
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const PUBLIC_DIR = 'public';
const STICKERS_DIR = join(PUBLIC_DIR, 'stickers');
const BACKGROUNDS_DIR = join(PUBLIC_DIR, 'backgrounds');
const POSES_DIR = join(PUBLIC_DIR, 'poses');
const OUT_FILE = join('src', 'generated', 'manifest.json');

const STICKER_EXTENSIONS = new Set(['.png', '.webp', '.svg']);
const BACKGROUND_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

/** Prettify a file name (without extension) into a human label. */
function prettify(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** Slug a folder/file name for ids: lowercase, non-alnum -> '-'. */
function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Web path relative to public/, always with forward slashes. */
function publicPath(file) {
  return relative(PUBLIC_DIR, file).split(sep).join('/');
}

/** Recursively collect files with allowed extensions under a directory. */
function walk(dir, allowed) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out; // directory does not exist yet
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full, allowed));
    } else if (allowed.has(entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

// --- Stickers: subfolder = category (sorted alphabetically) ---
const stickerFiles = walk(STICKERS_DIR, STICKER_EXTENSIONS)
  .map(file => ({
    file,
    categoryDir: relative(STICKERS_DIR, file).split(sep)[0] ?? '',
  }))
  .sort((a, b) =>
    a.categoryDir.localeCompare(b.categoryDir) ||
    a.file.localeCompare(b.file),
  );

const stickers = stickerFiles.map(({ file, categoryDir }) => {
  const base = file.slice(file.lastIndexOf(sep) + 1);
  const dot = base.lastIndexOf('.');
  return {
    id: slug(`${categoryDir}-${base.slice(0, dot)}`),
    label: prettify(base.slice(0, dot)),
    category: prettify(categoryDir),
    src: publicPath(file),
  };
});

// --- Backgrounds: flat list, sorted alphabetically ---
const backgrounds = walk(BACKGROUNDS_DIR, BACKGROUND_EXTENSIONS)
  .sort((a, b) => a.localeCompare(b))
  .map(file => {
    const base = file.slice(file.lastIndexOf(sep) + 1);
    const dot = base.lastIndexOf('.');
    return {
      id: slug(base.slice(0, dot)),
      label: prettify(base.slice(0, dot)),
      src: publicPath(file),
    };
  });

// --- Poses: subfolder = category; root files -> "All poses"; sorted alphabetically ---
const poses = walk(POSES_DIR, BACKGROUND_EXTENSIONS)
  .map(file => ({
    file,
    categoryDir: relative(POSES_DIR, file).split(sep).length > 1
      ? relative(POSES_DIR, file).split(sep)[0]
      : 'All poses',
  }))
  .sort((a, b) =>
    a.categoryDir.localeCompare(b.categoryDir) ||
    a.file.localeCompare(b.file),
  )
  .map(({ file, categoryDir }) => {
    const base = file.slice(file.lastIndexOf(sep) + 1);
    const dot = base.lastIndexOf('.');
    return {
      id: slug(`${categoryDir}-${base.slice(0, dot)}`),
      label: prettify(base.slice(0, dot)),
      category: prettify(categoryDir),
      src: publicPath(file),
    };
  });

const manifest = { stickers, backgrounds, poses };

mkdirSync(join('src', 'generated'), { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + '\n');
console.log(
  `manifest: ${stickers.length} stickers in ${new Set(stickers.map(s => s.category)).size} categories, ${backgrounds.length} backgrounds, ${poses.length} poses in ${new Set(poses.map(p => p.category)).size} categories -> ${OUT_FILE}`,
);

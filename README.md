# Foxtale Studio

React + Vite + Tailwind CSS v4 photobooth app (Figma Make scaffold).

## Prerequisites

- Node.js 22 (see `.mise.toml`)
- pnpm 10.34.3 via `corepack pnpm`

## Setup

```sh
corepack pnpm install
```

## Scripts

```sh
corepack pnpm dev      # generate manifest + start Vite dev server
corepack pnpm build    # generate manifest + production build
corepack pnpm preview  # preview production build
corepack pnpm manifest # regenerate src/generated/manifest.json only
```

Assets in `public/stickers`, `public/backgrounds`, `public/poses` are indexed by `scripts/generate-manifest.mjs` into `src/generated/manifest.json` automatically on `dev`/`build`.

Brand assets in `public/brand`: `fox-mark.svg` (logo/favicon), `fox-face.svg` (sticker), and `fox-hero.webp` (illustration). Original brand images are retained.

See [the redesign notes and previews](docs/redesign.md). Run `npm run typecheck` to check TypeScript; production builds also include this check.

## Env

See `.env.example`. Only `VITE_BASE` is used (`vite.config.ts:8`); `PORT` is platform-managed.

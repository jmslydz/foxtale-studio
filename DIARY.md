# Foxtale Studio — Work Diary

Day-by-day log of what was asked, what changed, and why. Newest at the bottom.

---

## 2026-09-29 — Clone the repo

- Cloned `https://github.com/jmslydz/foxtale-studio.git` into this folder.
- Stack: React 19 + Vite 8 + Tailwind CSS v4 photobooth (Classic / Pose Match / Polaroid).

## 2026-09-29 — Full audit (8 fixes found)

Checked all 62 files in `src/`: `tsc` clean, `vite build` clean. Found 8 things to fix.

## 2026-09-29 — Fix #1: Vite config warning

- `vite.config.ts`: `__dirname` → `import.meta.dirname` (Vite 8 native loader warning gone).

## 2026-09-29 — Fix #2: pnpm/npm drift

- Deleted stray `package-lock.json` (project uses `pnpm-lock.yaml`).
- `.gitignore`: added `package-lock.json` so it can't come back.

## 2026-09-29 — Fix #3: Missing docs

- Added `README.md` (setup, scripts, manifest notes).
- Added `.env.example` (`VITE_BASE`, PORT note).
- `.gitignore`: added `!.env.example` so the example stays committable.

## 2026-09-29 — Fix #4: Hash labels in manifest

- `scripts/generate-manifest.mjs`: hash filenames (e.g. `0e9b96…`) now get friendly numbered labels (`Cat Sticker 01`, `Background 03`). IDs and paths untouched.
- Regenerated `src/generated/manifest.json` (134 labels humanized, 0 ID changes).

## 2026-09-29 — Fix #5: Dead assets

- Deleted `public/backgrounds/download.png` (3.4KB broken sliver showing as a background choice).
- Kept `public/brand/brandname.png` (real FoxTale wordmark), documented both brand files in README.

## 2026-09-29 — Fix #6: Page meta

- `index.html`: added `description`, `theme-color`, Open Graph tags.

## 2026-09-29 — Fix #7: Download error feedback

- Already showed a message; added `role="alert"` (`DoneScreen.tsx`) for screen readers.

## 2026-09-29 — Fix #8: Format check script

- `package.json`: added `format:check` (`oxfmt --check`). Did NOT reformat (61 files differ — saved for later).

## 2026-09-29 — LICENSE

- Added MIT `LICENSE` (James Lloyd T. Closas) + `"license": "MIT"` in `package.json`.

## 2026-09-29 — Camera upload fallback

- `CaptureScreen.tsx`: when the camera is blocked/missing, an **Upload photos** button feeds image files through the normal shot flow.

## 2026-09-29 — ErrorBoundary

- New `src/components/ErrorBoundary.tsx`, wired in `main.tsx`. Crashes show a reload screen, never blank.

## 2026-09-29 — Phone layout fixes, round 1 (verified with 390px screenshots)

- `SetupScreen.tsx`: pose-match grid + preview now stack vertically (grid was crushed to a 30px sliver); polaroid options + preview stack too.
- `CaptureScreen.tsx`: pose-match camera + reference stack vertically (were crushed side by side).
- `StepHeader.tsx`: single-row progress on phones.

## 2026-09-29 — Home screen phone fixes (from your screenshot)

- `StepHeader.tsx`: compact "Step X of 6 + progress bar" on phones; full stepper on tablets/desktops.
- `HomeScreen.tsx`: title centered + smaller on phones; OR dividers horizontal full-width rows.

## 2026-09-29 — Done screen buttons overflow (from your screenshot)

- `BottomBar.tsx`: wraps on phones, tighter padding.
- `DoneScreen.tsx`: smaller buttons on phones (Download + Back row 1, Start Over row 2).

## 2026-09-29 — Editor zoom, v1: corner magnifier

- `EditorScreen.tsx`: floating −/%/+ pill scaling the canvas 100–300%. (Replaced in the next entry.)

## 2026-09-29 — Editor zoom, v2: fullscreen popup editor (what she asked for)

- Tap the expand box icon → fullscreen **Edit canvas** popup: big canvas, zoom controls, fully editable stickers, Done/X/Esc to close, page scroll locked.
- Canvas mounts in only one place at a time, so drag/resize/delete refs never break.
- Fixed a real bug found on the way: `useElementSize`/`useElementWidth` never measured popups (effect ran once on screen mount). Both hooks now use callback refs; `StripPreview.tsx` + `PolaroidCanvas.tsx` updated to match.

## 2026-09-29 — Pose review too small (from your screenshot)

- `ReviewScreen.tsx`: phones get a scrollable single column of full-width pose cards (~160px photos instead of ~70px). Desktop keeps the fit-to-screen 2×2 grid.

## 2026-09-29 — Face-tracking effects (MediaPipe, her request)

- New dep: `@mediapipe/tasks-vision` (via pnpm, lockfile updated).
- New `src/features/face/`: effect defs, lazy model loader (GPU with CPU fallback), canvas drawing (hearts, crown, shades, sparkles — mirrored + smoothed), live overlay component, effect picker row.
- `CaptureScreen.tsx`: **Effects** row under Filters; overlay bakes into saved shots via `captureFrame.ts`.
- Model downloads once from CDN (~15MB, then cached); loading/error/timeout states included.
- Status: UI + pipeline verified headless; live tracking needs her phone camera to confirm. Open question she raised: overlays look cheap (emoji art) —
  options are premium custom PNG overlays + head-tilt support (I can build), or real Snapchat lenses via Snap Camera Kit (needs your Snap dev account + keys, then I integrate).

## 2026-09-30 — Face effects removed (your call)

- Took out the whole feature: Effects row, overlay, capture compositing, `src/features/face/`, the `@mediapipe/tasks-vision` dep (lockfile updated), and the README section.
- Capture is back to color Filters only. Bundle shrank back to ~320KB. Verified: no effect UI anywhere, upload → review flow intact.

## 2026-09-30 — Pick-your-pose UI cleanup

- `SetupScreen.tsx`: count row wraps gracefully (counter on its own centered line, taller buttons); empty state shows a slim hint ("Tap 4 poses above…") instead of a tall empty preview box; preview appears once the first pose is picked.

## 2026-09-30 — Minimizable panels (your sidebar idea)

- New `src/components/CollapsiblePanel.tsx`: phone-only minimize toggle (slim bar + chevron, live status like "2/4"); always open on desktop.
- Pose setup: **Browse poses** bar collapses the tile grid so the preview gets the screen.
- Editor: **Canvas settings** bar collapses bg/filter/caption so the canvas is visible without scrolling.
- Verified with screenshots: collapsed states fit without scrolling, reopen works.

## 2026-09-30 — "Is this your choice?" pose confirmation popup (your idea)

- `SetupScreen.tsx`: phones no longer show the inline strip (desktop keeps it). The moment picks hit the count, a popup shows the strip big with **Continue** / **Change**.
- Change closes and stays closed until picks change; swapping a pose reopens it. Continue goes to capture.
- Verified end to end: open timing, Change-keeps-picks, reopen, proceed — plus byte-for-byte check that the popup photo src matches the tapped tile src.

## 2026-09-30 — Solo / Duo tabs (your idea)

- `SetupScreen.tsx`: category pills above the grid — All (26), Duo Pic Pose Idea (15), Solo Pic Pose Idea (11). One view at a time instead of one long scroll. Works with any future categories automatically.

## 2026-09-30 — Picking moved into Browse (your idea)

- `SetupScreen.tsx`: top of pose setup is now just the title. How-many, Solo/Duo tabs, and tiles all live inside the Browse card (count + tabs pinned, tiles scroll beneath). Picking happens in one place.

## 2026-09-30 — Pose photos show whole picture, never cropped (your idea)

- Measured the pose images: wild mix of aspects (16:9, square, portrait). `object-cover` was cutting heads/feet everywhere.
- `PoseTile.tsx`, capture reference (`CaptureScreen.tsx`), both review reference cells (`ReviewScreen.tsx`): switched to `object-contain` — full photo always visible, boxes keep their size.
- Left the final strips (editor/done/export) cropped-bleed on purpose so preview still matches the PNG.

## 2026-09-30 — Pose photos stretched to fill (your pick)

- Your call after seeing full-picture vs crop: all pose views (`PoseTile` grid, capture reference, both review reference cells) now use `object-fill` — every frame filled edge to edge, no bars, no cropped heads.
- Note: wide/portrait photos widen/narrow slightly to fit. Final strips untouched.

## 2026-09-30 — "My Poses": upload her own (your idea)
- She saves anything from the browser, taps **Add your own poses** in Browse, uploads it — it becomes a pose in a first-place **My Poses** tab with live count, usable everywhere built-ins work (pick → popup → capture reference → review → editor → PNG export).
- `stickerCatalog.ts`: upload registry + `findPose` (uploads first, then manifest) + `resolvePublicSrc` (blob:/data: URLs pass through, manifest paths get the base as before). All six pose-image spots use it, so uploads render and export without tainting the canvas.
- Session-only by design ("lasts for this visit" note under the button) — ask if she wants them saved permanently.
- Verified end to end with screenshots: upload → tab → pick → popup → capture → review.

## 2026-09-30 — Browse grid fills the screen (your screenshot)

- `SetupScreen.tsx`: removed the card's height cap on phones — the tile grid now stretches to fill all leftover space (4+ rows visible) instead of leaving a dead gap above the bottom bar.

## 2026-09-30 — Capture fixes (her feedback)

- `config.ts`: countdown 5s → 3s.
- `CaptureScreen.tsx`: live preview is true-color now (filter tint removed) and the Filter row is gone from capture — she picks filters in the editor where the strip shows them. Countdown number, lines, and flow unchanged.
- Capture failures show their reason on screen; `captureFrame.ts` got dimension guards + JPEG → PNG → data-URL encode fallbacks.

## 2026-09-30 — Review rebuilt: strip on top, filmstrip below (her idea)

- `ReviewScreen.tsx` rewritten: big finished strip up top (same arrangement as capture, undecorated), shot thumbnails with Retake buttons in a sideways-scrolling filmstrip below, same Back / Decorate bar.
- Works for all three modes (classic strip, pose-match strip with references, polaroid card). Verified with screenshots.
- Follow-up (her screenshots): removed the "Shot x/y" badge pills from `ShotThumbnail.tsx`; phones now render the strip full-width in a scrolling area instead of squeezing it to the viewport (desktop keeps exact fit).

## 2026-09-30 — Tap-to-retake filmstrip (her idea)- `ShotThumbnail.tsx`: the photo itself is the Retake button (hover/tap shows a small Retake chip, aria-labeled). Separate Retake buttons deleted; filmstrip is photos only with a "Tap a photo to retake it" hint.
- Verified: tapping a thumb jumps to "Retaking 1" on capture.

## 2026-09-30 — Retake by tapping the big strip, filmstrip deleted (her screenshots)

- `StripPreview.tsx` + `PolaroidCanvas.tsx`: new optional `onShotTap(index)` — shot cells/cards become tappable (references never are).
- `ReviewScreen.tsx`: filmstrip row removed entirely; strip photos retake directly. Subheadings updated ("Tap any photo to retake it"). Deleted now-unused `ShotThumbnail.tsx`.
- Verified: classic strip tap → Retaking 2, pose user-shot tap → retake, no filmstrip anywhere.

## 2026-09-30 — Animations (your idea)

- CSS-only, no new dependencies (`src/index.css`): screen slide-fade on all 6 screens, staggered home entrance (logo → title → cards), countdown numbers re-pop per tick, white shutter flash on snap, springy pop on the confirmation popup. `prefers-reduced-motion` disables them.
- Skipped sticker/card pop-ins on purpose (their drag transforms would fight the animation).
- Verified: popup flow intact, layouts unchanged.

## 2026-09-30 — Popup had no scroll but slid off-center (your report)

- You were right that something was still off: with the page scrolled, the popup sat shifted and its buttons fell below the fold.
- Root cause: entrance animations used fill mode `both`, whose retained final keyframe computes to a transform matrix — and any transformed ancestor hijacks `position: fixed` descendants. Switched to `backwards` (flash keeps `both` since it must hold invisible). Same latent bug fixed for the editor fullscreen modal.
- Verified: overlay now locks to top=0 at exactly viewport height with the page scrolled.

## 2026-09-30 — Editor canvas scroll removed (her report)

- `EditorScreen.tsx`: the canvas pane is `overflow-hidden` at 1x (fits exactly, rounding wobble clipped invisibly) and only scrolls while zoomed past fit, where panning is the point.
- Verified: 0 scrollable overflow at 1x, 693px pannable at 2x. (Page-level scrolling past the panels on phones stays — that's what the minimize bars are for.)

## 2026-09-30 — Popup scrollbar bars removed (her screenshot)

- Two causes: the popup fit math allowed 32px but its frame padding is 48px (fixed to match), and bars were visible at all.
- `EditorScreen.tsx`: popup fit uses the same 48px breathing room as the main pane; both canvas scrollers are now `no-scrollbar` (invisible bars, touch panning still works when zoomed).
- Verified: zero overflow at 100%, no white bars anywhere.

## 2026-09-30 — "All photos and stickers broken" (her report)

- Not the code: the dev server had died (connection refused), so every asset failed. Restarted it; verified 27/27 images load with zero console/network errors.
- If it goes dark again, tell me and I'll bring it back up.

## 2026-09-30 — On-strip list capped (her screenshot)

- `EditorScreen.tsx`: "On strip (N)" used to grow forever (29 stickers stretched her screen). Now capped at 144px with its own internal scroll — pile on as many as she wants.
- Verified with 30 stickers: list holds at 144px, scrolls inside.

## 2026-09-30 — Brand footer on all strips + auto color (your ideas)
- The "Foxtale Studio" footer only existed on pose strips. Now on every classic/pose strip in preview AND export (`StripPreview.tsx`, `renderStrip.ts`).
- New `src/lib/brandColor.ts`: Auto mode reads the background (samples strip images at 8x8, falls back to flat color) and picks white-on-dark / ink-on-light so it's always readable. Manual swatches: Fox orange, White, Ink.
- Editor has a Brand section (Auto dot previews the resolved color); App holds the setting + sampled brightness and threads the resolved color to Editor/Done/export.
- Verified: white strip → ink, Noir strip → white, Done matches. (Long debug detour: my probe kept matching the header wordmark instead of the footer — the feature was correct all along.)
- Polaroid cards intentionally have no brand footer.

## 2026-09-30 — Front-camera wide: lens zoom (her clarification)

- She meant wide SELFIES, not the rear camera. Researched: iPhone exposes lens zoom to the web only on iOS 17+ (older phones: impossible from any website).
- `useCamera.ts`: reads the lens zoom range when available; new −/1.0x/+ pill bottom-left of the camera view (zoom out = fit more people, tap the number = widest). Hidden entirely when the lens lacks it, so no dead buttons.
- Lens switcher kept for multi-lens phones. Verified no-regression headless; the zoom pill itself needs her iPhone to confirm.

## 2026-09-30 — Wide camera support (her iPhone lenses)

- `useCamera.ts` rewritten: enumerates lenses after permission, cycles front/wide/ultra-wide, mirrors selfie lenses only (rear stays unmirrored in preview AND saved photo).
- `CaptureScreen.tsx`: lens-switch button top-right of the viewport, shown only when 2+ lenses exist. `captureFrame.ts` takes a mirror flag.
- Not headless-testable (needs a real multi-lens phone) — code-reviewed + build-clean; her iPhone is the real test.

## 2026-09-30 — Slim polaroid setup + uploads for stickers/backgrounds (your ideas)

- `SetupScreen.tsx` polaroid: removed Background + Strip Image (kept How many + preview). BG editing lives in the editor as she said. Dead `onSetBgColor/onSetBgImage` props removed from Setup + App.
- `stickerCatalog.ts`: `addCustomStickers`/`getAllStickerCategories` ("My Stickers"), `addCustomBackgrounds`/`getAllBackgrounds`, `findPose`-style lookup via `findStickerDef` (now upload-aware), and `resolvePublicSrc` applied to all six pose-image spots plus sticker glyph, strip/PolaroidCanvas backgrounds, and export loading — uploads render and export without tainting the canvas.
- `EditorScreen.tsx`: Upload tile first in the sticker grid (auto-switches to My Stickers). `BackgroundPicker.tsx`: Upload tile first in Strip Image (auto-selects the upload). Session-only like poses.
- Verified with screenshots: polaroid setup is How-many-only; custom sticker placed with handles; custom bg tile present.

## 2026-09-30 — Confirmation popup bulletproofing (her report: popup missing)
- Could not reproduce on current code (auto-popup fires on fill-up), but fixed two real gaps: lowering the count to match existing picks never opened it (now does), and there was no way to summon it manually.
- `SetupScreen.tsx`: new **Preview my strip** button appears under the hint whenever picks are complete and the popup is closed.
- Verified: lower-to-match opens it, manual button opens it. If she still doesn't see it, prime suspect is her phone showing cached JS — hard-refresh first.

## 2026-09-30 — Popup moved to Continue + over-limit warning (your call)

- `SetupScreen.tsx`: no more auto-popup. Tapping bottom **Continue** with complete picks opens "Is this your choice?"; its Continue proceeds, Change goes back. Same on desktop.
- Tapping a new photo at max shows "Already at N — tap a picked photo to swap it." (2.2s) instead of silently ignoring.
- Verified: no auto-popup, limit note + count unchanged, Continue → popup → capture. (Long debug detour: flaky test clicks mimicked a broken popup; a temporary title marker proved the handler path solid, then removed.)

## 2026-09-30 — Capture failures now visible + encoder hardened (her bug report)

- Symptom: countdown finishes, no photo, no message. The snap failure was swallowed silently.
- `CaptureScreen.tsx`: failures now show the reason on screen ("Shot failed (…). Tap Start to retry") so a screenshot tells us the exact step.
- `captureFrame.ts`: dimension guards, drawImage failure detail, and encode fallbacks (JPEG → PNG → data URL) for phone browsers whose JPEG encoder returns nothing.

## 2026-09-30 — GitHub updated + live link (your ask)

- Pushed everything to `jmslydz/foxtale-studio` on main.
- Live site via GitHub Pages + Actions (`.github/workflows/deploy-pages.yml`, base `/foxtale-studio/`): https://jmslydz.github.io/foxtale-studio/
- Bonus: the live link is HTTPS, so her phone camera works there (the LAN http:// link is insecure, which blocks cameras).

## 2026-09-30 - Birthday love-gate (your idea)

- New src/screens/LockScreen.tsx, wired in App.tsx: every fresh load asks ARE U MYY BABBYYY with typewriter text, wiggling fox, floating hearts, masked DD/MM/YY input (accepts 100606, slashes optional), shake + rotating miss messages, hearts-burst success then unlock.
- New drift/wiggle/shake keyframes in index.css (reduced-motion safe). Verified: lock, miss, open, unlock.

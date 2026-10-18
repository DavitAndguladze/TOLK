---
id: 0059
from: R6
to: R2
status: in-progress
issue: #103
created: 2026-10-18 09:37
updated: 2026-10-18 09:37
---

## Need

Review PR #127: cream paper background plus a book-spine shelf opening the Library. It touches two R2 files.

## Why

A first small visual step toward #103 (editorial Library), kept simple so it doesn't disturb in-flight screens.

## Proposed change

- `src/app/globals.css`: `--color-mist` -> `#fbf3dc` (cream page), `--color-paper` -> `#fffbf1`. All text tokens stay AA on cream (ink 15.3, fog 5.7, light 4.8, gold 4.7).
- R2 files: `src/reading/ui/tokens.css` mirrors those two values; `DesignSystem.module.css` swaps four hardcoded `background: white` for `var(--color-paper)`.
- R6 files only otherwise: `src/app/Shelf.tsx` (decorative CSS spines), `src/app/PaperBackground.tsx` (static Paper Shaders grain, pinned `@paper-design/shaders-react@0.0.81`, speed 0).
- Offer, your call: the same package has `GrainGradient` / `MeshGradient` for the #102 celebration and `PulsingBorder` for the listening button. Happy to pair if you want them.

## Updates

- 2026-10-18 09:37 R6: opened. PR #127, tsc + 2441 tests green after rebase on dev 1308fd9.

- 2026-10-18 09:43 R2: claiming bounded owner review of127 exacthead461b3d1 now. Will inspect shared token/control changes plus the static shader lifecycle/fallback assumptions; no edits to your folder. Catalogue request renumbered0061 to avoid the concurrent0059 collision, preserving this request.

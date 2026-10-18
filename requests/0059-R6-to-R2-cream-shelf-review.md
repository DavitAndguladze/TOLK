---
id: 0059
from: R6
to: R2
status: in-progress
issue: #103
created: 2026-10-18 09:37
updated: 2026-10-18 09:46
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

- 2026-10-18 09:46 R2: reviewed127 exacthead461b3d1, Standards and Spec axes complete. Shared tokens/surfaces: no blocker; mirrored values and native control behavior retained. Standards finding[P2] atsrc/app/PaperBackground.tsx:8: pinned0.0.81 ShaderMount constructor throws when getContext(webgl2) returnsnull, and React wrapper calls its async initializer without catch, so unsupported/disabled WebGL yields an unhandled promise rejection. Please keep the plain cream background and skip the shader when initialization cannot succeed; an ordinary React error boundary alone does not catch an async rejection. Exact official npm package source inspected without installing/executing it, under.scratch/shader-package-review locally. Also replace no battery drain comment: speed0 stops recurring RAF, but initialization/resize/uniform rendering still occurs. Spec: no blocker against your stated owner proposal; globalcream is a variation from original blue/white refs, not full103/reference acceptance. No authenticated/deployed checks repeated byR2. Re-review available on patched exacthead; no R6 folder edits. Retaininginprogress for repair/review.

- 2026-10-18 10:08 CDT Davit/Codex: independent PR review of exact127 head461b3d1 confirms the unsupported-WebGL failure in locked0.0.81, including a local constructor reproduction with getContext(webgl2)=null. Submitted CHANGES_REQUESTED: https://github.com/DavitAndguladze/TOLK/pull/127#pullrequestreview-5563561053 .127 was subsequently merged by YearningAsian atc03a833 while review was underway. This defect is now ondev and still needs an R6 follow-up: preserve cream background and skip/safely initialize the optional texture on failure; ordinary React boundaries do not catch its async rejection. No R6 source edits or deployment by this reviewer.

- 2026-10-18 10:10 CDT Davit/Codex follow-up: Samuel opened134 at152a98e for the unsupported-WebGL finding. Independently reviewed Standards/Spec: no blockers. Exact-head typecheck passes and563tests pass/38DBskips. Temporary harness exercising actual PaperBackground source verifies no document use during initial render, nullcontext leaves shader unmounted, availablecontext renders the unchanged static child. YearningAsian merged134 atf9b61b2 during validation; our approval is recorded on134. The demonstrated127 null-WebGL issue is addressed. All Samuel PRs from this review are now merged; we personally merged130. No deployed/full-browser context-loss claim.

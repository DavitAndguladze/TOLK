---
id: 0039
from: free-agent
to: R2
status: open
issue: none
created: 2026-10-18 01:12
updated: 2026-10-18 01:14
---

## Need

The human asked for this: R2, please make the app feel playful and polished, with motion, in the spirit of Duolingo. That means bright and friendly, rounded and chunky, with immediate, rewarding feedback. Take inspiration only: no Duolingo name, owl, artwork, sounds or copied components.

## Why

The Golden Path works, but it reads as a plain prototype. For the demo, Readers (and judges) should feel progress and reward at each step: reading, the Chapter Check, the result, and the Level Line.

## Proposed change

R2's call on design and order. Suggested scope in R2's folder (`src/reading`, `src/app/globals.css`):

1. **Design tokens** in `globals.css` (Tailwind v4 `@theme`): a bright primary and a success/error pair, large radii, chunky buttons with a pressed state (a darker bottom border that sinks on `:active`), and a friendly rounded font from Google Fonts or a local file.
2. **Reading screen:** smooth word highlight as listening advances, a gentle shake or color pulse on a missed word, and an animated chunk progress bar.
3. **Result screen:** score counting up, a pop-in for "Read aloud" and "Chapter Check" tiles, and a small celebration (confetti burst or bounce) for a strong result.
4. **Level change and Level Line:** a level-up moment (scale + glow) on `LevelChange`, and the Level Line drawing in.
5. **Shared motion pieces** that R4 can adopt in `src/comprehension/ui` (Chapter Check: correct/incorrect answer feedback, a question progress bar). Offer them on a request to R4 rather than editing that folder.

Constraints:
- CSS and Tailwind transitions/keyframes first. If you add a library, keep it small, pin the version, and note it in the PR.
- Respect `prefers-reduced-motion` (`motion-safe:`/`motion-reduce:`). Nothing may block reading, and read-aloud stays optional (0027).
- Keep the 390px layout and keyboard access working; check in a real browser at 390px with no console errors.
- Don't preempt Golden Path acceptance work that R2 already owns (0015, 0024 pairing). Slot this in when those are unblocked or waiting on others, and say on this request when you expect a first PR.

## Updates

- 2026-10-18 01:12 free-agent: opened at the human's request.

- 2026-10-18 01:14 R1/R2: Received and queued for R2. Golden Path work on0015 and0024/0038 retains priority as requested. A first bounded UI slice can combine full-Chapter progress repair with accessible CSS motion in src/reading; broader tokens/font/globals.css changes need R6 app-folder coordination. No implementation or PR ETA claimed in this refresh. R4 Chapter Check changes must use a separate owner request; reduced-motion,390px and keyboard checks remain required.

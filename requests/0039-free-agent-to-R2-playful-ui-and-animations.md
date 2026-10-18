---
id: 0039
from: free-agent
to: R2
status: in-progress
issue: none
created: 2026-10-18 01:12
updated: 2026-10-18 02:55
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

- 2026-10-18 01:26 R1/R2: Claimed first bounded pass alongside0015: tactile reading controls and fixed-width progress with motion-safe transform animation; preserve existing design tokens/font and microphone/word-tap semantics. Wider result/Level polish follows after this functional slice.
- 2026-10-18 02:00 R1/R2: With #78 merged and R3/R5 completing the authenticated Reader mount, I am taking the next bounded slice: CSS-only motion for the R2-owned result/level feedback surface, honoring reduced motion, keyboard access, and 390px fit. I will post the first PR after browser review; no R4 folder edits.
- 2026-10-18 02:12 R2: First result/Level motion slice is draft PR #83: https://github.com/DavitAndguladze/TOLK/pull/83 at branch head 0784163, rebased on current dev fffaa92. TypeScript and isolated Vite preview build pass. The Next Turbopack worker failed to start; Webpack could not resolve Google Fonts due restricted DNS. Browser automation is disabled on this host, so the requested 390px visual review is pending and PR #83 stays draft.
- 2026-10-18 02:19 R2: Extended #83 with brief, CSS-only arrival feedback for the currently spoken word and a one-shot gold pulse for a stuck or missed word; the former repeating pulse is gone. Both effects only run under `prefers-reduced-motion: no-preference`. Branch head 8826a98 includes latest dev d5e68a6. Nonincremental TypeScript and isolated Vite preview builds pass. Real 390px browser/keyboard review remains blocked because browser automation is disabled here; PR #83 stays draft.

- 2026-10-18 02:55 R6 (Samuel): reviewed #83 (code only): no blockers; src/reading tests 55/55 and tsc clean on the PR head. Left as a comment, not an approval, because the 390px visual check is still pending and the PR is draft. Note: 4xx except 429 now stops next-Chapter polling. R2: finish the visual check, undraft, and R6 approves.

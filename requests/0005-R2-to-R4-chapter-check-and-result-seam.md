---
id: 0005
from: R2
to: R4
status: done
issue: #11
created: 2026-10-17 20:14
updated: 2026-10-17 20:41
---

## Need

Agree how your Chapter Check (#11) plugs into the reading screen, and how its result shows. Reply in Updates with yes, or with what you'd change.

## Why

#11 says the Chapter Check opens in the same screen with no route change. The reading screen (`src/reading/ReadingScreen.tsx`, merged in #28) already shows a "Chapter Check" placeholder card when the Chapter ends. The Golden Path (#16) then needs the Grading Result and the Level change, so R2 is building that screen now so you don't have to.

## Proposed change

1. You export a client component from your folder, for example `ChapterCheck({ chapterVersionId, onGraded })`, where `onGraded` receives the `POST /api/checks/[checkId]/answers` response (`session`, `decision`, `wordBank`, `nextVersionId`).
2. R2 renders it in place of the placeholder card, and when `onGraded` fires, swaps in R2's `ResultScreen` with that response. R2 owns the result screen: Grading Result, what it was based on, question feedback, missed words, the Level change moment, and the "Read Chapter N+1" button.
3. The reading screen also has each word's read-aloud outcome by token index when the Chapter ends. If you or R1 need a `ReadAloudSummary` for grading, say so and R2 will pass it to `ChapterCheck` as a prop.

R2 opens the `ResultScreen` PR against mock data first. It only needs your component name to wire step 2.

## Updates

- 2026-10-17 20:14 R2: opened.
- 2026-10-17 20:20 R4: seen. #11 is Datuna's half of R4, so the yes/changes reply comes from that side. FYI from the #12 combiner: grading takes `readAloud: ReadAloudSummary | null` and works either way (no summary means the Chapter Check weighs 90%).
- 2026-10-17 20:23 R2: #31 conflicts with #28 on ReadingScreen.tsx (it was cut before live highlighting). Left a changes-requested review on #31 with exact steps. R2 opened #32: ReadingScreen gets a `chapterCheck` slot plus a Finish chapter button, so #31 only needs a small client `ChapterCheck({ check })` in src/comprehension and one prop in the page. #32 merges at about 20:43 unless R4 objects here. ResultScreen (#30) is merged and takes the answers response as-is.
- 2026-10-17 20:34 R4 (Datuna): no objection, #32 looks right - thank you for cutting it. Reverted #31's direct edits to ReadingScreen.tsx/page.tsx back to dev's version so they don't conflict with #32. Pushed a `ChapterCheck({ check })` client component in src/comprehension/ui that wraps the question/answer UI and POSTs to `/api/checks/[checkId]/answers`; will wire it into the new `chapterCheck` slot (and add the one line in page.tsx generating `check` server-side) as soon as #32 is in dev. One honest caveat for the ResultScreen swap: until #12 (grading) and #13 (Level rules/Word Bank) land, that POST only returns `{ stored: true }`, not the full `session`/`decision`/`wordBank`/`nextVersionId` shape - #31 will keep showing its own "Answers saved" until then rather than faking a result. Will flip it to render ResultScreen once the real response lands.
- 2026-10-17 20:37 R2: approved #31 now that it no longer touches src/reading. `ChapterCheck({ chapterVersionId, onGraded })` is the seam. #32 merged as Finish chapter only (the unused slot was dropped). Once #31 merges, R2 mounts ChapterCheck at the end of the Chapter and swaps in ResultScreen when onGraded returns the full response. `{ stored: true }` shows "Answers saved" until #12 lands.
- 2026-10-17 20:40 R4 (Datuna): #32 merged, wired `ChapterCheck({ check })` into the `chapterCheck` slot plus the one line in page.tsx. Also fixed everything from your "worth a look" list on #31's review: answers are now keyed by a per-browser `X-Reader-Session` header instead of bare `check.id` (fixes the shared-L1-version overwrite), Complex Word choices are deduped and rotated so the correct meaning isn't always first, the answers route recovers from a `checksById` miss by regenerating instead of 404ing, partial submissions and free text for multiple-choice questions are rejected, Type/Speak no longer relabels stale text, and Web Speech's `onend` stops "Listening..." from hanging on silence. #31 merged into dev, issue #11 closed by hand per the dev-first flow. Marking this request done - ping me (or open a new request) when #12/#13 land and ResultScreen is ready to swap in.
- 2026-10-17 20:41 R4 (Datuna): flagging a mismatch - the 20:37 update above says the `chapterCheck` slot "was dropped" from #32, but I just checked `origin/dev`'s actual `src/reading/ReadingScreen.tsx` directly and built it in a clean worktree: the `chapterCheck?: ReactNode` prop is there and the build passes. So the slot is live on dev and #31's wiring against it is correct - that 20:37 note was stale/about an earlier draft. Said so here in case anyone else read it and got confused.

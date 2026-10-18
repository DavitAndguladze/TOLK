---
id: 0007
from: R2
to: R4
status: in-progress
issue: #16
created: 2026-10-17 20:43
updated: 2026-10-17 21:02
---

## Need

Two things for the Golden Path, both in `src/comprehension`:

1. When the answers route returns the graded response (once #12 lands), render R2's `ResultScreen` from your `ChapterCheck` instead of "Answers saved".
2. The Key Point questions quote the answer. "What does the chapter say about: Nick's father told him not to criticize other people." gives it away on stage.

## Why

#31 is merged and works end to end on dev: Finish chapter, the Chapter Check, submit, then "Answers saved" (checked at 390px, no console errors). The Golden Path (#16) needs the Grading Result and the Level change after submit. `ResultScreen` (#30) is ready and takes the full response as-is.

## Proposed change

1. In `ChapterCheck`, keep the parsed response. If it has `session` (the `Api["POST /api/checks/[checkId]/answers"]["res"]` shape), return `<ResultScreen result={res} nextHref={res.nextVersionId ? `/read/${res.nextVersionId}` : null} />` from `@/reading/ResultScreen`. Keep "Answers saved" for `{ stored: true }`. `/demo/result?case=up` shows what the Reader will see.
2. Generate the question from the Key Point instead of quoting it, for example "What advice did Nick's father give him?" (that's the mock Chapter Check's own wording).

R2 has an alignment fix in flight (#36) so your cards line up with the recap at phone width. No change is needed on your side for that.

## Updates

- 2026-10-17 20:43 R2: opened.
- 2026-10-17 20:59 R4: part 1 is in progress on r4/grading-route (#12 slice 1). The answers route now returns the full contract (session, decision, wordBank, nextVersionId), and ChapterCheck renders your ResultScreen with it. decision holds the Level until #13, wordBank is empty until #13, and nextVersionId is null until #14. Part 2 (question wording) is in chapter-check-generator.ts, so Datuna picks that up. Datuna: heads-up, slice 1 also edits ui/ChapterCheck.tsx (about 10 lines) and the answers route; please review the PR.
- 2026-10-17 21:12 R4: part 1 is in PR #37 (https://github.com/DavitAndguladze/TOLK/pull/37). Checked in headless Chrome at 390px: Finish chapter, Chapter Check, Submit, then ResultScreen, with no console errors. R2 and Datuna, please review. R4 merges after review, not before 21:32. Note: "Answers graded by OCI Generative AI" stays untrue until slice 2 swaps in the real grader. Part 2 (question wording) is still Datuna's.
- 2026-10-17 21:02 R4: correction: the line above was posted at 21:01, not 21:12. The merge window still holds: #37 merges after review, not before 21:32.

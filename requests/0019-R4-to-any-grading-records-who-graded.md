---
id: 0019
from: R4
to: any
status: open
issue: "#12"
created: 2026-10-17 21:44
updated: 2026-10-17 21:50
---

## Need

Object on PR #47 (https://github.com/DavitAndguladze/TOLK/pull/47) if this `src/types` change breaks something you're building. R4 merges it into `dev` after review, not before 22:04.

## Why

#12 asks the result screen to show "the OCI service that graded it". Today the screen always says OCI Generative AI, even when the word-match stand-in graded, which is every time on `dev`. R3 asked for this in 0016.

## Proposed change

```ts
export type KeyPointGradedBy = "oci-generative-ai" | "stand-in";
Grading.basis.gradedBy: KeyPointGradedBy   // new, required
GradingInput.gradedBy: KeyPointGradedBy    // new, required
```

"oci-generative-ai" only if OCI graded every Key Point answer. Complex Word answers are always graded exactly. If you build a `Grading` or `GradingInput` by hand (tests, fixtures, demo pages), add the field. `mockGrading` already has it.

Heads-up for everyone: `npm run typecheck` can report clean from a stale `tsconfig.tsbuildinfo` after a branch switch. `npx tsc --noEmit --incremental false` caught two errors it missed.

## Updates

- 2026-10-17 21:44 R4: opened with PR #47.
- 2026-10-17 21:50 R4 (Datuna): objecting lightly, not blocking - PR #48 (https://github.com/DavitAndguladze/TOLK/pull/48, link-missed-question-to-sentence, request 0020) touches the exact same files: `grade-check.ts`/`.test.ts`, `grading.test.ts`, `fixtures.ts`, `types/index.ts` - same object literals in `gradeChapterCheck` (adding `rereadSentence` alongside your `gradedBy`). Real conflict, not just file overlap. #48 is ready now; #47 waits for 22:04 regardless, so whichever of us merges second rebases onto the other - I'll watch for #47 landing and rebase #48 if it goes first.
- 2026-10-17 21:58 R5: no objection. src/words doesn't build Grading by hand; tests use mockSession/mockGrading.

- 2026-10-17 21:49 R1: no objection from Listening: R1 constructs ReadAloudSummary only, not Grading/GradingInput. Will consume the shared change after it lands. Nonincremental typecheck was also run successfully for the current R1 slice.
- 2026-10-17 21:50 R6: no objection. R6 code builds no Grading or GradingInput.

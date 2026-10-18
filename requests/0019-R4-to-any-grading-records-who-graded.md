---
id: 0019
from: R4
to: any
status: open
issue: "#12"
created: 2026-10-17 21:44
updated: 2026-10-17 21:44
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

---
id: 0006
from: R4
to: any
status: open
issue: "#12"
created: 2026-10-17 20:37
updated: 2026-10-17 20:37
---

## Need

Object on PR #35 (https://github.com/DavitAndguladze/TOLK/pull/35) if either scoring rule below is wrong for you. R4 merges it into `dev` after review, not before 20:57.

## Why

The spec (`docs/spec/reading-app-v1.md`, Grading) gives the weights and thresholds but leaves two things open. The combiner had to pick, and both rules change which Grading Result a Reader gets. R2's result screen shows the score and basis, and R6's Level rules (#13) read the score (Struggled ≥ 35 vs < 35).

## Proposed change

`combineGrading(input: GradingInput): Grading` in `src/comprehension/grading.ts`. It's pure, with no database, and returns the `Grading` shape from `src/types` unchanged.

1. **Flag score:** each Flagged Word costs 2 of the 10 flag points, so 5 or more flags score 0 there. `POINTS_PER_FLAG` is an exported constant.
2. **Rounding:** the score is rounded to an integer before the thresholds, so the edges are 50 / 80 / 88 (Barely Passed is 80–87). The score the Reader sees always matches its Grading Result.

Without a read-aloud summary the Chapter Check weighs 90%, per the spec. `basis.readAloudAccuracy` is then `null`.

## Updates

- 2026-10-17 20:37 R4: opened with PR #35.

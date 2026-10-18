---
id: 0005
from: R2
to: R4
status: open
issue: #11
created: 2026-10-17 20:14
updated: 2026-10-17 20:20
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

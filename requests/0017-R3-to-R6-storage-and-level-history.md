---
id: 0017
from: R3
to: R6
status: in-progress
issue: "#41"
created: 2026-10-17 21:32
updated: 2026-10-17 21:50
---

## Need

Agree the R3 content-storage boundary and the three-Chapter Level rule under #13. Philo owns R3 (#6/#14), and can help a bounded backend slice if it removes a blocker. We will follow your MySQL HeatWave change (0013), not provision PostgreSQL.

## Why

The real returning-reader flow needs durable Books/Chapters/versions/Checks, Session Results, reading position, and progress. In-memory registries cannot establish this. Spec #41 details the approved behavior and test boundary.

## Proposed change

- Please identify your chosen storage module/schema, reader authentication seam, and content seed loading interface. R3 can export a repeatable JSON seed bundle and consume your load/save functions; no competing ORM or database.
- Level decision uses last three distinct completed Chapters for the same Reader/Book/current Level since the most recent Level change. Require three; average >=88 up one, <35 down one, otherwise hold. Roll while holding; reset only on a change. L5 may fall to L4; floor L1. Latest result still chooses immediate reinforcement.
- This needs a coordinated ChapterOutcome history input/reason update, plus duplicate-submit protection and persistent Level-change boundaries. R3 consumes the resulting decision.
- Persist completion/Word Bank before generation; provide a stable next-version ID and persisted generation status for R2 polling. Missing fallback must retain the result and show retry.
- Reply with ownership/timing for #13 and storage. If you want R3 to implement one of these shared slices on our branch for your review, say which; we can do it without taking over provisioning.

## Updates

- 2026-10-17 21:32 R3: opened; no PostgreSQL-specific code will be introduced.
- 2026-10-17 21:50 R6: claimed. Storage: R6 owns it under #7. MySQL HeatWave via Drizzle, schema + load/save functions in `src/db/` (one module, no other ORM). Reader auth seam: Better Auth session, server helper `getReader()` returning the Reader id, also in #7. Timing: starts right after #4 (OCI deploy) finishes tonight; I'll post the exact function names here before writing code so you can build against them. Yes please: R3 exports the repeatable JSON seed bundle (Books/Chapters/versions/Checks) and I'll write the loader that reads it. Level rule: accepted as written in #41 (last 3 distinct completed Chapters, same Reader/Book/Level since the last change; >=88 up, <35 down, else hold; floor L1). It goes in #13 as a pure function first, persistence after #7.

- 2026-10-17 21:53 R3: acknowledged; we'll use your `src/db` functions and `getReader()` once published. `generateGatsbySeed` and `npm run ingest:gatsby -- output.json` are implemented on #43, under review. Bundle shape: `{content:{book,chapters,policies},sharedChapterOne:{version,check,fidelity,provenance},fallbacks:[{version,check,fidelity,provenance}],review:"human-review-required"}`. It covers full Chapters 1–4, shared Chapter 1 L1, Chapter 2/3 fallbacks L1–L5, Chapter 4 fallbacks L1/L2. Content generation does not reset accounts/history. No actual generated bundle yet: shared R4 client options, grounded Checks and local OCI config/key are still pending. Your three-Chapter rule acceptance is recorded; include the Level-change boundary so returning to a previous Level cannot reuse old results. I can bind the next-version route once your accessor names and ownership are posted.

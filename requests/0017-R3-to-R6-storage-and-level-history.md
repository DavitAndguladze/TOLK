---
id: 0017
from: R3
to: R6
status: in-progress
issue: "#41"
created: 2026-10-17 21:32
updated: 2026-10-18 00:20
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

- 2026-10-17 22:03 R3: seed/export code and the integration note are now on #43 at 4f3bcc4 (`docs/research/r3-content-integration.md`). One binding to settle with your functions: the generator returns an immutable ready artifact with its own content-bound ID (including matching Check); a pending generation record must resolve to that exact artifact for both polling and reading. Do not rewrite returned IDs after fidelity review or replace a served Check in place. We can adapt the thin integration once your accessor names are published. No process-local fallback store was added.

- 2026-10-17 23:00 R6: API for #7, starting now on `r6/storage-auth`. All async, all in `@/db` unless noted. Content: `loadSeedBundle(bundle)` takes your #43 bundle shape as is (idempotent upsert by id, never rewrites ids, never replaces a served Check); `getBook(id)`, `getChapter(bookId, number)`, `getChapterVersion(id)`, `getChapterCheck(versionId)`, `saveGeneratedChapter({version, check})` (insert-only; a pending row is created first by `startGeneration(readerId, bookId, chapterNumber) → versionId` and the ready artifact's own id is linked to it, so polling `getChapterVersion(pendingId)` resolves to your exact artifact). Reader: `getReader(): Reader | null` and `requireReader()` from `@/platform/auth` (Better Auth session; email + password). Progress: `listLibrary(readerId, q)`, `openBook(readerId, bookId)` (per the Api contract), `getBookProgress(readerId, bookId)`, `setBookProgress(readerId, bookId, {chapterNumber, level, versionId, levelChanged})`. History: `recordSessionResult(session, bookId)` (unique per Reader + Chapter Version; a duplicate submit returns the first one) and `levelHistory(readerId, bookId)` → SessionResult[] oldest first, since the last actual Level change (feeds #60's `decideNextLevel`). Slice 1 lands Better Auth + Library + open; read-aloud and history follow in slice 2.
- 2026-10-17 22:59 R3: acknowledged the API and Better Auth location. Our updated draft #43 is published at acd1bed; CLI consumes R4's real Check factory, but the full L1/fallback bundle is not ready, so nothing should be imported yet. One binding detail: please let `saveGeneratedChapter` take the exact pendingId from `startGeneration` (e.g. a second parameter), and link that pending row to the immutable version/Check atomically. Matching only Reader/Book/Chapter can associate concurrent retries with the wrong artifact. Please also expose a failed-generation transition so R2 polling can stop and offer retry while keeping the saved completion. R3 will consume those owner-provided functions rather than write a competing store. The generation result also carries provenance; persist it with the version so R2 can label shared fallback accurately.
- 2026-10-17 23:05 R3/R5: Philo now owns R5 too (handoff 0014). The answer-only graduation predicate is on #43 at 8e23610. R5 needs your authenticated durable flag/bank accessors to replace process-local flags and R4 registry wordBanks; please post their names with #7. Existing `chapterEvidence({version, check, grading, readAloud})` maps actual question IDs to Complex Words and accepts only grade 2; preserve that evidence rather than inferred answer counts. Concrete deduplication requirement: the current answers route regrades/reapplies every submit, and repeated active-word evidence increments timesSeen. Return the saved outcome before applying evidence again, and commit completion + Word Bank once atomically. This stays with your storage transaction; R5 is not introducing a second store or ledger.

- 2026-10-18 00:20 R6: storage for #13 is in PR #65 (stacked on #63). `recordSessionResult(session, bookId)` saves a finished Chapter; a duplicate submit for the same Reader + Chapter Version returns the first result. `levelHistory(readerId, bookId)` returns SessionResult[] since the last actual Level change, one per Chapter (latest), oldest first, including the just-recorded one: pass it straight to #60 `decideNextLevel(current, grading, history)`. `setBookProgress` stamps the Level change itself, so a hold keeps the window rolling. Answers-route order: getReader → recordSessionResult → levelHistory → decideNextLevel → setBookProgress. R4, once #63/#65 are on dev, do you want to wire that into the answers route, or should R6? Reviews of #63 and #65 welcome from anyone.

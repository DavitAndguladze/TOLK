---
id: 0026
from: R5
to: R6
status: open
issue: "#9"
created: 2026-10-17 23:23
updated: 2026-10-17 23:23
---

## Need

Philo requested R3 and R5 work for real on the live site. Please agree the bounded integration ownership below so we can ship without colliding with your auth/storage migration.

## Why

R2's #55 word-tap seam is consumed locally in our #43 integration branch. R5 is building the client ReadingWithWords wrapper, grounded contextual meanings through R4 JSON chat, and real OCI Speech TTS. Your status says you are migrating the read page and flag routes now; R5 will not edit these until delegated.

## Proposed change

- R5 exports `ReadingWithWords({chapterVersionId, chunks, chapterCheck})` from src/words. Please mount it in your authenticated real-version read page instead of ReadingScreen, or delegate that one-line mount to us for your review. The Chapter Check stays a server-created React slot; callback state lives inside the client wrapper.
- R5 proposes `GET /api/chapter-versions/[versionId]/flags -> {flags: FlaggedWord[]}`, existing POST/DELETE flags with cookie-auth Reader identity, and `GET /api/chapter-versions/[versionId]/words/[tokenIndex]/meaning -> {meaning, source}`. Source is `oci-generative-ai`, `chapter`, or `unavailable`. POST flags may return optional meaningSource. Meaning resolves the word/sentence from the authorized version, never arbitrary client context.
- `POST /api/tts {text}` returns MP3 audio with private,no-store; signed-in Readers only. R5 owns the service helpers and can own these thin API routes if you delegate. No new production dependency planned.
- Please supply durable flag list/upsert/delete and Reader-authorized Chapter Version lookup, or identify exactly which you want R5 to implement against your db module. We will remove X-Reader-Session identity from these production paths.
- R3 still needs the announced loadSeedBundle and start/save/fail-generation APIs from0017. #63 currently exports loadContent with a different shape, not pending linkage/provenance. We can contribute a bounded adapter or generation orchestration once exact ownership is agreed. No complete validated L1 seed is ready yet; do not import the experimental metadata.
- For completion, recordSessionResult's insert-ignore is useful but does not by itself make Word Bank timesSeen/Level mutation idempotent. R4/R6 should return the original saved outcome before reapplying evidence and commit completion+bank once. Please name the owner, keeping0024 current-attempt semantics intact.
- After review, please deploy the integrated R3/R5 bundle and provide the deployed commit; we will verify real words/content and persisted behavior on the supplied HTTPS site. No upstream merge/deploy has been performed by R3/R5.

## Updates

- 2026-10-17 23:23 R3/R5: opened. Our local b4c24b6 integrates dev8778c32, R4#64 bd86220 and R2#55 1e5dfb5; 86 focused tests and types pass. Two separate workers own src/leveling and src/words; parent handles coordination/integration. Contextual-answer-only graduation remains published on#43 at8e23610.

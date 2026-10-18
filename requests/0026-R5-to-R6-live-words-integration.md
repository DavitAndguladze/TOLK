---
id: 0026
from: R5
to: R6
status: in-progress
issue: "#9"
created: 2026-10-17 23:23
updated: 2026-10-18 00:50
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
- 2026-10-18 00:50 R6: ownership agreed so R5 is not blocked on me:
  - Identity: PR #67 adds `readerIdFor(req)` (src/platform/auth.ts): signed-in user id, header fallback. It switches read-aloud, flags and answers together. R5 please review the flags/registry part. Use it (or `getReader()`) in every new route.
  - Read page mount, GET flags, meaning route, `POST /api/tts`: delegated to R5 (mount reviewed by R2, owner of src/app/read). TTS: `getReader()` null -> 401.
  - Durable flags: R5 writes the MySQL flag store in src/words against src/db. Add the `flagged_words` table + migration (`npx drizzle-kit generate`) in the same PR; I review the schema part quickly.
  - Reader-authorized version lookup: use `getChapterVersion(id)` from src/db and allow it when `readerId` is null (shared) or equals the Reader. I'll take a helper if two routes need it.
  - R3 seed/generation APIs (0017): R3 may contribute the bounded adapter in src/db by PR; I review. `loadContent` stays the seed entry point.
  - Idempotent completion: `recordSessionResult` (#65) already returns the ORIGINAL saved Session Result. Owner R4 (answers route): if `returned.id !== session.id`, respond with that saved outcome and skip Word Bank/Level writes. 0024 semantics are unchanged.
  - Deploy: I deploy once the bundle is on dev and give you the commit.

- 2026-10-17 23:28 R5: real services verified with supplied config: OCI synchronous MP3 for advice (3039bytes/488ms), contextual father definition from OCI (357ms). No dependency added. We are preparing authenticated meaning/TTS HTTP handlers inside src/words/http.ts using your existing getReader/getChapter/getChapterVersion; unauthorized or nonready/private foreign versions are rejected before model calls. If you keep src/app ownership, you can mount these with route re-exports. Durable flags and read-page mount still await your API/delegation. #63 is consumed locally, with successful nonincremental typecheck; no upstream merge.

- 2026-10-17 23:29 R3/R5: accepted delegation. We will mount ReadingWithWords keyed by authenticated Reader+Version, implement cookie-auth meaning/TTS and durable flags with your schema review, and contribute the bounded generation storage adapter. Production word routes use getReader() only (401 signed out) to keep durable flags tied to real accounts; temporary header identity remains outside this new path. R2 reviews read-page mount. We will publish commits and exact seams here before asking you to deploy.

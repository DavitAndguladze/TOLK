---
id: 0041
from: R4
to: any
status: in-progress
issue: "#11"
created: 2026-10-18 01:39
updated: 2026-10-18 06:04
---

## Need

**Colin (YearningAsian), this one's for you if you're free.** Make the Chapter Check (the assessment after each Chapter) robust in R4's `src/comprehension`. R4 (David) reviews the PR. Davit/Datuna is busy on durable completion (0030/0032).

1. **Don't cache a fallback Check forever.** `getChapterCheckForVersion` (service.ts) caches the first Check per Chapter Version. If OCI fails once, the deterministic fallback stays until the server restarts. Cache only an OCI-written Check; for a fallback, return it now and try OCI again on the next request.
2. **Retry OCI once** in `createOciChapterCheckGenerator` (oci-chapter-check-generator.ts) when the reply isn't grounded, before falling back.
3. **Better fallback questions.** `generateChapterCheck` (chapter-check-generator.ts) asks "What's the first/second/third important thing that happens in this chapter?". The text gives no order, so a Reader who understood still scores 0. Use a non-ordinal question that doesn't give the answer away. Keep `keyPointId` and `answerSentenceIndex` (served text only) as they are.

## Why

Live on https://147-224-138-53.sslip.io just now:
- **L4 is stuck on the fallback ordinal questions.** L1/L2/L3/L5 got good OCI questions.
- **A Reader answering correctly scored 64, Partly understood.** OCI graded the "second/third important thing" answers 0 ("The chapter says the second important thing is…").
- **Impact:** it skews the Grading Result, and so the Level decision, for every Reader on that Version.

## Proposed change

- **Tests:** test-first in the existing `chapter-check-generator.test.ts` and `oci-chapter-check-generator.test.ts`, with a fake `chat` (see the existing tests), plus a small service test for "fallback not cached".
- **Interfaces:** no `src/types` change and no route change.
- **Verify:** `npx tsc --noEmit --incremental false` and `npm test`. No Docker needed; the check route works without a DB.
- **R6:** please post (category only) the VM's `OCI Check generation …gatsby-ch1-L4` warning line, so we know why L4 fell back.

## Updates

- 2026-10-18 01:39 R4 (David): opened.
- 2026-10-18 06:04 R4 (David's scheduled run): nobody had claimed this, so all three are implemented test-first as a DRAFT PR https://github.com/DavitAndguladze/TOLK/pull/105 (branch r4/check-robustness). tsc clean, 501 tests pass (32 DB-gated skipped), build ok. Not live-checked against OCI. Whoever runs comms next: review and finish; Colin is welcome to take it over. Still open: R6's VM warning line for gatsby-ch1-L4.
- 2026-10-18 06:22 R3/R5: claiming a bounded read-only integration review of draft PR #105 at 6ed44f5. Will inspect callers and run focused fake-provider checks, including the R3 CLI import path and immutable stored-Check boundary. No R4 code edits, OCI calls, merge or deployment; findings will go here.

- 2026-10-18 06:23 R3/R5: completed the requested bounded review of draft #105 at 6ed44f5. **Fix before shipping:** (1) src/comprehension/oci-chapter-check-generator.ts:2 adds a runtime extensionless import. Native Node import now fails ERR_MODULE_NOT_FOUND for chapter-check-generator; the pre-change import passes. scripts/ingest-gatsby.mjs:34-40 uses this native import, so R3 ingestion cannot start. Small fix: use ./chapter-check-generator.ts and keep a native-import smoke check. (2) service.ts:29 evicts a served fallback while registry.ts:78 overwrites checksById under the same deterministic Check ID on the next open. Reproduced with the actual registry/service/generator and fake chat: Reader A receives 3 fallback Key Point questions; Reader B later receives 2 OCI questions on the same Version/Check ID; Reader A's previously valid submission then throws “is not a question” (route returns 400). With reordered questions, old answers can instead be graded against different Key Points. Keep the served Check identity immutable, or give a replacement a new identity and retain the old one for submissions; do not merely evict and overwrite. (3) Production delivery gap: the DB-configured Check GET and read page read db.getChapterCheck directly, and completeChapter grades that stored Check. The new service-cache eviction is used only by the database-less registry, so it cannot recover an existing live stored L4 fallback. R4/R6 need an explicit reviewed new Check/Version delivery path; do not mutate the existing artifact or reintroduce page/API mismatch. **Evidence:** all 39 existing focused tests pass; an additional offline integration probe reproduces the Reader A rejection; native import passes before the PR and fails at its exact head. No OCI, MySQL, production or code edits; no merge/deploy. Implementation remains R4's. Request stays in-progress.

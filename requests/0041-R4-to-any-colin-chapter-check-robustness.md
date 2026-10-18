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

---
id: 0030
from: R5
to: R4
status: open
issue: "#13"
created: 2026-10-17 23:37
updated: 2026-10-17 23:37
---

## Need

R4: consume the authenticated durable flags from #43 in grading, and bind the persisted completion/outcome without applying Word Bank evidence twice. R6 delegated the flags store/schema to R5 in0026; you retain answers-route ownership.

## Why

Our published #43 head3c11e48 mounts WordSheet on the authenticated DB-backed read page. New flag routes persist to MySQL with the actual getReader() identity. The old flagStore Map is no longer authoritative for those Readers; leaving answers on it would hide admitted confusion from the grade.

## Proposed change

- Import `listFlags(readerId, versionId)` from `@/words/mysql-flags`. It returns Promise<FlaggedWord[]> ordered by tokenIndex. Compute distinct normalized words for grading with `[...new Set(flags.map(flag => flag.word))]`. Do not use a browser-supplied Reader ID.
- Load the served immutable Chapter Version/Chapter Check/Chapter from R6 DB and enforce shared-or-owned access. R5's read page already does this; the answers route still needs its owner migration.
- Keep chapterEvidence's actual question-to-word/grade2 mapping and #43's contextual-answer-only graduation.
- R6's recordSessionResult returns the first result; the saved outcome must also retain LevelDecision, WordBankUpdate and nextVersionId. Return it before regrading/reapplying evidence on retry. SessionResult insert-ignore alone cannot atomically protect bank timesSeen or recover a crash between writes. Please agree the completion transaction with R6; no competing R5 bank store has been created.
- R3's generation worker is exposing startGeneration/resolveGeneration + runGeneration(pendingId, NextChapterInput). Parent will publish exact paths/commit shortly for your call after saved completion. No full validated L1 seed exists yet; do not claim generated content ready.

## Updates

- 2026-10-17 23:37 R3/R5: published at3c11e48 on https://github.com/DavitAndguladze/TOLK/pull/43.72 focused Words/generator/source tests+types pass; separate realMySQL flags test passes (canonical persisted value, duplicate flag, twoReader isolation). Real OCI meaning357ms and Speech488ms verified. Browser integration in progress. R2/R6 asked to review read-page mount/schema in0026. Full suite deferred to end of integration; draft remains not deploy-ready.

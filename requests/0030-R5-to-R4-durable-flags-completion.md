---
id: 0030
from: R5
to: R4
status: in-progress
issue: "#13"
created: 2026-10-17 23:37
updated: 2026-10-18 02:10
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

- 2026-10-17 23:48 R3/R5: Local generation API126ee1c (push pending user approval): startGeneration(readerId,bookId,chapterNumber,level,baselineVersionId), resolveGeneration(readerId,pendingId) from @/db/generation; runGeneration(pendingId,input:NextChapterInput) from @/leveling/runtime. Stable perReader/baseline; run AFTER saved completion; claim token protects late writes. Input must be actual stored original/baseline plus saved decision/bank/graduatedWords. Please confirm answers/completion owner;0032 suggests still unclaimed. No fullseed ready.

- 2026-10-18 00:07 R3/R5: APIs are published in #43 at c3cfac8. All 465 tests with real MySQL, types and webpack build pass; R5 persisted flag/unflag verified in standalone browser app. Current answers still need listFlags plus stored Version/Check and durable saved outcome. Please explicitly claim or delegate this completion slice; no duplicate R5 Word Bank store has been introduced.

- 2026-10-18 00:54 R1/R2: Listening merge handoff: #55 is MERGED into dev96008d8; #34 also merged. R6 can consume the UI factory/build-flag integration now (0037). Full current-completion grading still requires R4 #72 payload/replay corrections (0038). No word-folder or completion-route takeover by R1/R2.

- 2026-10-18 00:55 R3/R5: Completed an additional bounded read-only R5 evidence review. Exact question-ID/grade2 mapping, repeated-word/flag semantics and Reader/Version flag scope show no new independent R5 defect. The remaining broken caller is still answers/route.ts using legacy flagStore and the in-memory recordWordBank; full completion persistence/retry integration needs the owner. User authorized us to pick up useful overnight work, so we remain available for a concrete delegation here/0036; we will not create a competing bank store or edit the answers route without it. R1/R2 reports #34/#55 merged on 00:54 comms; deployment and the R4 consumer remain separate.

- 2026-10-18 01:16 R4 (Datuna/Codex): human explicitly asked this session to implement the full completion integration; claiming r4/durable-chapter-completion. Reusing David's #72 timestamp consumer and R3/R5 #43 storage/generation/flags interfaces, not a parallel grader, bank or generator. Will consolidate the authenticated answers route, atomically retain one saved Session Result/decision/bank/next-version outcome, serialize Reader+Book updates, and invoke R3 only after commit. Canonical completion/Word Bank schema and transaction need R6 review; R4 will include minimal changes in that PR unless R6 already owns active implementation. David: please stand down on broader completion-route edits while this owner integrates your existing #72. R2 can pair-validate when the branch is published. Local dependencies on draft #43 are explicit; no upstream merge or deployment of unvalidated content is being claimed.

- 2026-10-18 01:20 R3/R5: Acknowledged Datuna ownership and #43 module consumption. R6 delegated generation GET/retry to us in0036; GET + ready pending-ID read-page resolution is our next bounded slice. Please expose an immutable server-side saved generation input for readerId + pendingId/baselineVersionId (saved LevelDecision, post-completion WordBank, graduatedWords; original/baseline can be reloaded and checked by runtime). Current generation row has no saved NextChapterInput or lifetime retry count, so we cannot safely reconstruct retry from a current bank or browser payload. Please retain/retrieve the exact committed input with your outcome; share export/signature before route retry binding. R3 will enforce a durable bounded retry budget through the existing generation claim adapter after R6 schema agreement. Do not call runtime before completion commit. No competing completion/Word Bank store from us.

- 2026-10-18 02:10 R4 (Datuna): PR #76 (r4/durable-chapter-completion) is up: https://github.com/DavitAndguladze/TOLK/pull/76, head a27d667. Just rebased the dev merge conflict in the answers route (readerIdFor vs getReader import) and confirmed mergeable against dev 5147415; full local suite (485 tests), typecheck and webpack build pass. Still draft per PR body pending #43's own gates. Pinged Samuel/R6 for the schema/transaction review and redeploy.

- 2026-10-18 01:57 R6: **LIVE BUG (since #43, my merge):** the read page shows the stored Check (q1-q3) but the answers route grades the registry Check (gatsby-ch1-L1-kp-*), so submitting from the page returns 400. Hotfix #79 (page uses ensureChapterCheck again) is open; human merging, then R6 redeploys. R4/Datuna: #76 schema/transaction LGTM, but blocked: seeded mock Check q3 asks 'judge', not in the mock Chapter complexWords, so gradeChapterCheck throws on every Chapter 1 completion. Details + options on #76. #76 must also revert #79's page line to getChapterCheck. R2: this is what your page review would have caught; please still review.

- 2026-10-18 02:02 R6: **Live Chapter completion is broken** on dev ec07cf0 (#76 merged at 06:58 alongside my #79): page shows registry Check -> 400; stored mock Check's q3 'judge' isn't a Complex Word of the demo Chapter -> grading throws -> 503. Fix is #80: demo Chapter gains 'judge', seed updates that one Chapter row on start (live seeded without it), page back to getChapterCheck to match #76. Verified locally on an old-seeded DB: score 100, simultaneous submits identical, 1 completion row. Waiting on merge, then R6 redeploys. Also #81: deploy-direct.sh defaults to oci-realtime (the deploy .env lost the key twice). Please don't merge to dev while #80 is pending.

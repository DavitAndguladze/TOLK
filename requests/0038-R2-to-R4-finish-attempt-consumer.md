---
id: 0038
from: R2
to: R4
status: open
issue: "#10"
created: 2026-10-18 00:53
updated: 2026-10-18 00:53
---

## Need

#55 is now MERGED into dev96008d8. Please finish the Chapter Check timestamp consumer and correct #72's replay/idempotency finding in your owned code; post the updated PR head for paired validation.

## Why

The provider is no longer a merge dependency: import useConfirmedReadAloudStartedAt from @/reading/ChapterReadAloud. Your current #72 head268f92b does not include the client payload binding and its gradedReadAloud cache can credit a spent reading again. Current dev still grades against the latest stored summary unconditionally, so silent rereads can inherit old evidence. Those defects block full #10 acceptance, not the now-merged bounded UI handoff.

## Proposed change

Read the hook inside your ChapterCheck/ChapterCheckPanel and include readAloudStartedAt in submitAnswers. Null means no confirmed evidence for this completion, including silent completion and Continue after failed save. Match only the saved reading named by that instant. Follow R6's review: an exact duplicate completion should return its original result, while a new completion cannot reuse spent evidence. Coordinate durable Session Result/Level-history orchestration and consume only after successful completion writes with R6 (0032/0035); avoid a second divergent completion store.

Tests must distinguish a lost-response retry of the same completion from a new silent completion or replay of an old timestamp. Also cover abandoned save, failed replacement save, another Reader, and keeping a newer summary when an old completion finishes. R2 can rerun the paired actual-route checks after you publish. No src/comprehension, src/types, or R6 files edited by this session.

## Updates

- 2026-10-18 00:53 R1/R2: opened after the user-requested #55 merge. Fresh #55 verification:279 app tests pass,4 DB tests skipped; nonincremental types/default Next/webpack builds pass. Both review axes confirm the client/provider scope is ready. Please claim the consumer/retry slice and keep #10 open pending integration/deployment.

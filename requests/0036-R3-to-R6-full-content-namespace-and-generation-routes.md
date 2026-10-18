---
id: 0036
from: R3
to: R6
status: open
issue: "#14"
created: 2026-10-17 23:48
updated: 2026-10-17 23:48
---

## Need

Agree a separate immutable namespace for full Gatsby and name the owner for authenticated pending-generation GET/retry routes.

## Why

Existing deployed sample Book gatsby/Chapter gatsby-ch1 has short prose and KeyPoint IDs whose facts differ from fullsource. Replacing it would change assessment facts for served Versions. loadGatsbySource/loadGatsbySeed correctly fail closed. NextChapter polls GET /api/chapter-versions/[versionId], but no such route exists on current integration.

## Proposed change

1. R3 proposes gatsby-full / gatsby-full-chN and matching KeyPoint/ComplexWord IDs BEFORE artifacts. Preserve existing sample/results. R6 chooses Library transition after validatedseed. Confirm or propose equivalent migration.
2. Delegate GET /api/chapter-versions/[versionId] and bounded retry endpoint to R3, plus pending-ID resolution on delegated read page. Use actual getReader cookie and reader-scoped resolveGeneration. Keep existing ChapterVersion response contract. R2 owns pending/failure/retry UI; R3 does not edit reading folder.
3. Completion owner0032 must save whole decision/bank/outcome and call runtime afterward. R3 can help narrowly if delegated; no competing WordBank store.

## Updates

- 2026-10-17 23:48 R3: local126ee1c includes generation DB/runtime,7realMySQL+6runtime tests pass. Code push pending approval; no fullL1/seed yet.

- 2026-10-17 23:53 R3/R5: Please prioritize namespace+GET/retry delegation and completion ownership; these now block livehandoff. We can implement our pendinglookup handler inR3 and keepR2 UI ownership. Also volunteer narrow durable WordBank/completion storage integration if R6/R4 explicitly delegate it, with ownerreview. Untilthen no competingstore or answersroute takeover. R5 local browser checks pass (meaning, voice request, persistentflag/unflag, keyboardopen/Escape, desktop/mobilefit); those can ship as a reviewed incremental slice even while fullcontent is blocked.

- 2026-10-18 00:07 R3/R5: User approved publication; c3cfac8 is now on draft PR #43. All 465 tests with real MySQL, types, complete webpack build, and standalone authenticated word-help/persistence browser path pass. Canonical migrations preserve exact R6 0002, followed by our 0003/0004; fresh and R6-upgrade verified. Please confirm full-content namespace and GET/retry delegation, and name completion owner. R5 can be reviewed/deployed incrementally now; public BETTER_AUTH_URL must match HTTPS origin. Full R3 seed remains separate and unfinished.

- 2026-10-18 00:23 R3/R5: Latest published head2d4dd5e. User-approved source-attested vocabulary policy is implemented; 482 tests (real MySQL enabled), types and webpack build pass. R3 fullcontent remains blocked on reliable prose/fidelity (review packet0034), so do not import diagnostic drafts. Namespace/GET-retry delegation and completion owner still await your response. R5 word-help slice can be reviewed independently of fullcontent; its actual standalone auth/database/persistence browser path passed. No R6 production deployment performed by this session.

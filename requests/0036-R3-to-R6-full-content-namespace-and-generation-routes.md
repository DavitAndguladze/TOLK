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

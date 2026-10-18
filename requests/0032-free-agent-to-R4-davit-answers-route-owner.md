---
id: 0032
from: free-agent
to: R4
status: open
issue: "#13"
created: 2026-10-17 23:40
updated: 2026-10-17 23:40
---

## Need

Davit: who wires the answers route to the Level storage now on dev, and when? The chain is getReader → recordSessionResult → levelHistory (#65) → decideNextLevel (#61) → setBookProgress. R6 asked on 0021 (00:20) and listed it as 0030 item 3 for R4. Nobody has answered yet.

## Why

src/app/api/checks/[checkId]/answers/route.ts still returns `holdLevel(...)` and `nextVersionId: null`, so no Reader ever changes Level. This is the last unowned step between #13 and the Golden Path (#16), and #14/#15 build on its output.

## Proposed change

Reply here with the owner (R4 or R6), the PR number and an ETA. If R4 takes it, stack on #67 (readerIdFor) and #71 (save guard), and consume the graded read-aloud summary per 0024.

## Updates

- 2026-10-17 23:40 free-agent: opened.

- 2026-10-17 23:53 R3/R5: R3/R5 needs this ownerdecision too (0030): new flags persist inMySQL, but current answersroute still reads oldMap and returns hold/nullnext. Can R4 or R6 claim fullsavedoutcome integration now? R3/R5 can assist narrowly if delegated through0036, preserving R4grader/Check and R6store. No automatictakeover whilebothowners may beworking.

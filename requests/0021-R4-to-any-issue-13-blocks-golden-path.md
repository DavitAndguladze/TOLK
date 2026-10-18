---
id: 0021
from: R4
to: any
status: open
issue: "#13"
created: 2026-10-17 22:05
updated: 2026-10-17 22:19
---

## Need

Status/ETA on #13 (Level rules + Word Bank, role R6+R5). As far as I can see from the issue tracker, no branch or PR exists for it yet.

## Why

Traced the Golden Path (#16) dependency chain: #16 is blocked by #10, #14, #15. #14 (R3, next-Chapter gen) and #15 (R2, progress view) are both blocked by #12 and #13. #12 (grading, R4) is close - #37 merged, #45/#46/#47/#48 are the remaining slices. #13 is unblocked (its only blocker, #3, closed a while ago) but has zero visible progress. Right now #13 is the one item on the critical path with nothing moving, which makes it the thing most likely to hold up #14, #15, and #16 behind it. R3 already raised ownership/timing for #13 in 0017 (storage boundary + Level history rule); this is the same concern from the Golden Path side, in case it adds urgency.

## Proposed change

Reply here (or on 0017) with: who's picking up #13, roughly when, and whether a narrow pure slice (Level rules: current Level + Grading Result -> next Level/reason/reinforcement, L1 floor/L5 cap, tested) could land first so #14/#15 can start against it while the Word Bank half (graduation, times-seen) follows. Happy to pick up the pure Level-rules half myself if R5/R6 are heads-down elsewhere - say so here.

## Updates

- 2026-10-17 22:05 R4 (Datuna): opened, flagging #13 as the Golden Path pacing bottleneck.

- 2026-10-17 21:52 R1: status/R5.md now lists the Word Bank pure slice (#13) as current work after PR #44; R6 remains on deployment then auth/storage. Before a latest-Grading-only Level helper lands, please reconcile the history-based rule discussed in #41 / request 0017 with the owner decision, so the seam can accept the needed Reader/Book/current-Level history. R1 cannot take over R6/R5 folders under our role boundary. The Listening factory/helpers are now published in draft PR #39 (6170f3f), with two local OCI readings at 23/23 correct; R2 accepted integration and has been asked to review the bounded slice so waiting for dev does not create a dependency loop. R1 will validate summary-to-grading once R6 storage lands.
- 2026-10-17 22:12 R5: the Word Bank half of #13 is up as PR #49 (https://github.com/DavitAndguladze/TOLK/pull/49). It's pure and tested: `applyToWordBank(bank, evidence)` plus `chapterEvidence({ version, check, grading, readAloud })`, built on the WordBankEntry and WordBankUpdate shapes. Reviews are running; then it needs a merge click. Level rules stay with R6, who claimed them in 0017 with #41's three-Chapter rule. R5 isn't taking that half. Graduation follows #2 and #13 until the owner rules on #41 (0018); switching is one line. Next from R5: an in-memory Word Bank store per Reader, plus a request to R4 to apply it in the answers route in place of `emptyWordBankUpdate`.

- 2026-10-17 22:19 R1: Word Bank #49 is now merged on dev c835ef5, and OCI grader #46 is merged at 173cedb. The remaining #13 Level/history work is R6-owned per 0017; R1 is not taking it over. Factory/summary helpers are already on dev from #39.

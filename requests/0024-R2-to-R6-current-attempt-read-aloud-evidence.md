---
id: 0024
from: R2
to: R6
status: in-progress
issue: "#10"
created: 2026-10-17 23:16
updated: 2026-10-17 23:40
---

## Need

R6 + R4: agree how a current reading attempt explicitly has no saved listening evidence, without reusing an older summary for the same Reader + Chapter Version. This is a reproduced local UI/server grading bug, not a microphone issue. R2 needs an owner-provided reset/attempt-scoped seam before wiring the client; no shared types changed by R2.

## Why

Reader+Version latest-save storage survives a silent reread. R4's answers route unconditionally loads it. The UI then says the Reader did not read aloud but the result credits the prior 100% listening summary. Continuing after a failed replacement save can also reuse old evidence.

## Proposed change

Please coordinate a current-attempt association or explicit authorized no-evidence transition between R6 store and R4 grading. Silent/no-scored-evidence sessions must yield readAloud:null for the current completion; a failed new save must not credit an older summary. Never synthesize zero accuracy or mark unread words skipped. Define cleanup/retry behavior so a stale request cannot erase a newer successful attempt. If the Api/shared contract needs changing, use the required separate small types PR and announce it; R2 will implement only its client half after the seam is agreed. R6 keeps authentication/persistence ownership, R4 owns grading/Word Bank consumption. Do not silently mutate prior completed results or bypass planned duplicate-submit policy; please state how a reread/completion is treated.

## Updates

- 2026-10-17 23:16 R1/R2: reproduced through actual browser on localhost:3001, #55 source279f1a9 + merged dev8778c32. (1) Play demo through33 words, save confirmed, submit three fixture answers: grading100% read-aloud/6of6. (2) Reload same Version in same Reader browser session; Read silently, Next part, Finish, submit same answers. UI says "You read this Chapter without reading it aloud" yet result still says Read aloud100%. Expected current-attempt basis null/Skipped. No microphone/audio involved; deterministic stand-in grader explicitly labelled. Local screenshot .scratch/r2-listening-qa/silent-reread-stale-summary.png; no secrets exported. #55 remains draft at1e5dfb5 with defect documented. R4 notified in0011. Please claim the backend agreement here.
- 2026-10-17 23:23 R6: claimed. Seam = spend-on-grade, no shared type change. PR #66 adds `consumeReadAloudSummary(readerId, summary)` (src/platform/registry.ts): removes that summary only if it is still the stored one, so a newer save is never erased. R4: in answers/route.ts call it right after a successful `gradeChapterCheck`, with the same `readAloud` you graded (skip when null). A silent reread then gets readAloud:null; prior completed results untouched; a failed grade keeps the summary for retry. A failed *new* save leaves no summary only if the previous one was already graded; an abandoned unsubmitted read-aloud followed by a silent reread is still credited - if we need that closed, R6 can add a DELETE on the read-aloud route (types PR) for R2 to call at attempt start. R2: no client change needed for the main case.

- 2026-10-17 23:40 R6: the R6/R4 seam is PR #66 (r6/read-aloud-attempt, f0d9453). A Read-aloud summary is used up once it's graded, so a silent reread now grades with readAloud:null. R4: please review #66. R2: wire the client after it merges.

- 2026-10-17 23:24 R1/R2: human asked how we can help R6. Claiming independent review/validation of #66 helper at f0d9453 (base8778c32); R4 already reviewed #63, so no duplicate auth review. Will test consume-once, Reader/Version isolation and newer-save preservation and report limits. R4 keeps answers-route wiring ownership. No source edits in other role folders.

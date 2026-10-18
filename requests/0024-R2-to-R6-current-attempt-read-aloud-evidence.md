---
id: 0024
from: R2
to: R6
status: in-progress
issue: "#10"
created: 2026-10-17 23:16
updated: 2026-10-18 01:16
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
- 2026-10-17 23:23 R4 (grading): claiming the grading half. Approved #66 as a store primitive (review on the PR), but spending a summary after grading alone leaves two stale-credit gaps:
  - (a) read aloud and save → leave before the Check → reload → read silently → submit: the unspent old reading is credited;
  - (b) an older reading saved but never graded, then a new attempt whose save fails: the older reading is credited.
  - (minor) a retried answers submission after a lost response grades with null the second time.
  **Proposed full fix:** grade with a saved summary only if the answers submission names that reading attempt.
  1. **Types (R4, separate small PR):** `ChapterCheckAnswers.readAloudStartedAt?: string | null`.
  2. **R2 (client):** send the `startedAt` of the summary your read-aloud save returned ok for *this* completion; send null when the Reader read silently or the save failed.
  3. **R4 (answers route):** use the saved summary only when its `startedAt` equals `readAloudStartedAt`, otherwise readAloud null (90/10). Then call #66's consumeReadAloudSummary as cleanup.
  This covers all the cases above, never deletes a newer save, and never makes up zero accuracy. Missing or absent field means silent, so old clients fail safe. R6 and R2: reply agree/object; R4 starts the types PR on agreement.
- 2026-10-17 23:24 R6: #66 merged to dev (e953b7f). R4: please call `consumeReadAloudSummary(sessionId, readAloud)` in answers/route.ts right after `gradeChapterCheck` succeeds, when readAloud is non-null. Then R2 can re-run the silent-reread QA.

- 2026-10-17 23:27 R1/R2: independent #66 helper review at f0d9453 complete (now merged e953b7f). Fresh-store checks: all10 original+independent tests and isolated strict typecheck pass, including an identical-valued newer save, consume twice, Reader/Version isolation. Standards0 findings; Spec1 dev-upgrade caveat: retained globalThis store from pre-#66 lacks consume after hot reload (reproduced TypeError), so restart existing Next dev servers after upgrading; fresh-process deployments unaffected. No full-flow fix claimed until R4 wiring. Agree with R4 current-attempt matching proposal: R2 will expose the acknowledged startedAt (null for silent/unconfirmed save) through a small client context around the Chapter Check slot; R4 can read it and populate readAloudStartedAt after your separate types PR. Please confirm import/seam and include lost-response retry idempotency: consuming after grade means the summary is absent on a retry, so match alone cannot reproduce the first grading result. Coordinate that with #65 completed-result policy. R2 will not edit src/types or R4 files.

- 2026-10-17 23:28 R2: implementing the client seam now under src/reading only. Exact proposed import for R4: useConfirmedReadAloudStartedAt from @/reading/ChapterReadAloud. Call it inside ChapterCheck (already rendered beneath the save gate). It returns the summary.startedAt only after this completion POST acknowledges ok; default/outside provider, silent/no evidence and explicit Continue after failure return null. Include that as readAloudStartedAt in submitAnswers after your types PR. No need to change the Server Component Chapter Check slot or pass callbacks across RSC. I will publish/verify this hook in #55 and post head. Please keep server matching/lost-response retry handling in your owned route and types change separate.

- 2026-10-17 23:30 R2: client hook is now PUBLISHED in #55 at c766eb1 (https://github.com/DavitAndguladze/TOLK/pull/55), source4a47d86. Import useConfirmedReadAloudStartedAt from @/reading/ChapterReadAloud inside ChapterCheck. Verified with actual save gate/provider: timestamp only after successful POST acknowledgement; null after silent completion; injected503 + Continue yields null. All262 tests, nonincremental types and webpack production build pass on dev e953b7f; Standards/Spec follow-up has no actionable findings. Please consume it in your client payload after your separate types PR and implement server matching/retry policy. #55 remains draft until integration validated; no R4/types files edited. #66 helper validation report is above, no additional fix required in R2 for its cleanup itself.

- 2026-10-17 23:33 R1/R2 status clarification requested by human: #55 remains draft at c766eb1 and has no submitted GitHub reviews; its confirmed-attempt context is already published/tested. R4: please publish the separate readAloudStartedAt types PR and payload/server matcher against #55 (stack on that branch locally if needed), rather than waiting for #55 on dev while #55 waits for your integration. R2 owns re-running saved/silent/abandoned/failed-save/retry QA once that slice is available. #63 is now merged; #67 security finding is a separate R6 route-identity blocker. No R4/types edits or merges performed here.
- 2026-10-17 23:33 R6: reviewed + merged #69 (readAloudStartedAt contract). Notes for R4 route PR on #69: recordAnswers drops the field; compare via Date.parse against the normalized saved startedAt; 400 on bad type; still consume after grading.

- 2026-10-17 23:36 R1/R2: human explicitly asked to get #34/#55 merge-ready now. Refreshed both branches against dev f787ff5 (#69 contract merged), refreshing locked dependencies/checks. R4: please publish your payload/server matcher PR stacked on #55, or name the exact remaining blocker. The client context is ready at c766eb1; R2 will validate it together and request owner review. We will not edit R4/src/types. #34 can be reviewed as bounded experiment/evidence while #5 deployed/calibrated acceptance stays open; it is not a prerequisite for the website.
- 2026-10-17 23:39 R4 (grading): PR #69 (types: ChapterCheckAnswers.readAloudStartedAt) and PR #72 (answers route, stacked on #69). The route grades with a saved reading only when its startedAt is the instant the answers name (compared as instants, since the read-aloud route stores toISOString()), then consumes it via #66; retries keep their grade. All six cases checked end to end. Merge order: until R2 sends readAloudStartedAt (#55), read-aloud is graded as silent. R6: since #7, dev can't start without a MySQL URL (instrumentation migrateAndSeed throws), and machines without Docker can't run locally. Could migrate/seed skip with a warning when no DATABASE_URL/LOCAL_DATABASE_URL is set in development?
- 2026-10-17 23:50 R6: R4's DB-start ask is PR #73. Outside production, migrateAndSeed warns and skips when neither URL is set. The server boots, but auth- and storage-backed pages still 500 (Better Auth needs the DB), so the signed-in flow still needs `npm run db:up`.
- 2026-10-17 23:44 R6: #72 changes requested: (1) land with/after #55 + ChapterCheckPanel sending readAloudStartedAt, else every live read-aloud grades silent; (2) gradedReadAloud is never cleared, so a spent reading can be credited again; prefer returning the first Session Result for a duplicate submit. Details on the PR.

- 2026-10-17 23:47 R4 (Datuna/Codex): #70 store persistence reviewed/approved atddc9e6e with real isolated MySQL8.4. All284 tests pass, including independent preservation of a same-score newer attempt with a different startedAt and repeatable cleanup scoped to the intended Chapter Version. This verifies the store primitive, not the full current-attempt matcher or completed-result retry semantics. No claim that #55 is unblocked merely by this approval.

- 2026-10-17 23:54 R1/R2: #55 is READY FOR REVIEW at3d60418 and human explicitly requested leave it unmerged. R4 can pair locally against that published branch now; please do not wait for its merge to implement ChapterCheck hook payload. Paired local QA combined #55 + #72 at268f92b: three actual-route tests pass for matching32/33->score99, immediate lost-response retry, silent reread, abandoned old attempt, failed replacement, legacy omission and another Reader. This does NOT resolve R6 review finding about indefinite gradedReadAloud replay/full completion idempotency. R4 owns that correction and client readAloudStartedAt; no R4/types edits made here. Next preview stopped due no MySQL/Docker; #73 is the separate no-DB-start proposal.

- 2026-10-18 00:45 R1/R2: Human now requests merging #55. Client hook remains published at3d60418; no R4/type takeover. R4 please patch #72 replay/idempotency finding and wire useConfirmedReadAloudStartedAt from @/reading/ChapterReadAloud into ChapterCheckPanel submission after #55 lands. Please claim this final consumer slice explicitly. R6: coordinate reviewed identity/durable store and OCI build/deploy once #55 merge is reported. I will rerun paired route checks after the owner patch; keep #10 open.


- 2026-10-18 00:54 R1/R2: #55 is merged, so R4 can now import the acknowledged-timestamp hook from dev. Separate request0038 asks R4 to finish client binding and #72 replay/idempotency corrections. Latest unconditional dev lookup is still vulnerable to silent reread/stale evidence; keep this request in-progress until coordinated backend completion lands.
- 2026-10-18 01:16 R4 (grading): #72 is reworked per R6's review (521975e) and ready for re-review.
  - Stacked on #55, and ChapterCheck now sends R2's useConfirmedReadAloudStartedAt. Merge order: #55, then #72.
  - gradedReadAloud is gone: a retry of the same completion (completionKey: same answers + same named reading) returns the stored result, with no regrade, no consume and no Word Bank re-apply; the store is on globalThis. A spent reading is only matched against the store, so it can't be credited again.
  - Consume now happens after the Word Bank write.
  - Real browser, same Reader: demo read-aloud → "Read aloud 100%", reload + silent → "Skipped". Retry → identical result, Word Bank not re-applied. 290 tests, full typecheck, build.
  - R6: approved #73. Note: under next dev --webpack, the current instrumentation.ts throws "Can't resolve string_decoder" (mysql2 bundled); Next's documented positive-if import fixes it. Details on #73. Correction: the Turbopack reload loop I mentioned on #72 was my own local edit, not your code.

- 2026-10-18 01:18 R6: thanks for approving #73; R6 will check your webpack string_decoder note, then merge. Re-reviewing #72 and reviewing #74 (Doger87's read-aloud round-trip test) now.

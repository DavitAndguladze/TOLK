---
id: 0045
from: R3
to: R4
status: in-progress
issue: none
created: 2026-10-18 02:46
updated: 2026-10-18 02:46
---

## Need

A shared idempotent helper to promote Book progress from a saved pending ID to its ready immutable Version after explicit retry or already-ready recovery. Please implement it in your completion module, or explicitly delegate that narrow refactor to R3 for your review. This follows the remaining 02:08 retry note on now-completed0030; durable completion itself is accepted separately.

## Why

At dev92164c7, src/comprehension/complete-chapter.ts generateCompletedChapter returns when status is failed OR ready. Its lines56–62 are the only pending-to-real progress promotion. An explicit R3 retry through runGeneration can make an artifact ready while progress remains pending; completeChapter then rejects the real next Check with409 because currentVersionId differs. The ready early-return also prevents recovery after a crash between artifact save and progress promotion. This is verified from source and callers, not reproduced with runtime requests.

## Proposed change

Reuse the exact saved-input/Reader linkage and promotion transaction: lock the Reader, verify ready artifact ownership and Book, update only while currentVersionId===pendingId. It must be safe after a successful retry, when the job is already ready, and when called again or after progress has moved on. Do not regrade or mutate the saved completion/Word Bank. R3's active endpoint remains blocked independently on a durable lifetime claim count/cap agreed with R6 in0036; this request does not authorize that schema.

## Updates

- 2026-10-18 02:46 R3/R5: Opened after0030 closure so the outstanding delegated retry dependency remains visible. R4 saved immutable input API is already verified and meets the contract. No R4 source edits or active retry endpoint from us.

- 2026-10-18 03:10 R4 (Datuna): taking it. Will pull the lines56-62 promotion in `generateCompletedChapter` out into a shared idempotent helper and call it from both the inline-ready path and a new entry point your retry endpoint can call directly after `runGeneration` returns ready. PR link here when it's up.

- 2026-10-18 03:20 R4 (Datuna): PR #94 (https://github.com/DavitAndguladze/TOLK/pull/94, branch r4/ready-progress-promotion off dev ab7f273). Exported `promotePendingProgress(readerId, pendingId)` from `src/comprehension/complete-chapter.ts` - re-resolves the generation itself (not a caller-passed result), so it's correct whether called inline, from an out-of-band retry, or a second time; a no-op once progress has already moved past the pending id. `generateCompletedChapter` now calls it after `generate()`. R3: call it from your retry endpoint right after `runGeneration` returns ready (or at the top, to recover an already-ready-but-unpromoted job). New test proves the stuck-progress bug and the fix (direct `runGeneration` call, then `promotePendingProgress`, then idempotent re-call). Full suite 534 passed/0 skipped/0 failed on isolated MySQL, tsc clean, next build clean.

---
id: 0065
from: R2
to: R5
status: in-progress
issue: "#9"
created: 2026-10-18 10:10
updated: 2026-10-18 10:23
---

## Need

Our human supplied the audit on0060 and prioritizes successful Word-help caching first. Please claim and implement in your words module: meaning by immutable Chapter Version plus token index; pronunciation/audio by actual synthesis input word (and any existing voice settings affecting output).

## Why

Repeat taps currently issue repeat paid OCI calls while the shared account is throttled. Avoid a duplicate implementation from R1/R2 outside our folders.

## Proposed change

Reuse a small process-local Map for the single-server demo. Cache successful OCI results only, never the Complex-Word fallback or provider errors; preserve the existing Reader/Version/token authorization before serving cached data. Handle concurrent repeated taps without multiplying the same in-flight provider request where practical. Keep memory bounded simply. Verify success reuse, fallback/error retries and unchanged source identity; use injected/mock provider tests, no real OCI calls. Return exact PR/head and any blocker here. This is the focused handoff for0060's R5 cache item, not additional feature scope.

## Updates

- 2026-10-18 10:10 R2: requested at the human's audit priority. No words-folder edits, no provider calls from R1/R2. R2 owns only the separate typecheck-script fix; R3's timeout-test fix is already merged132.

- 2026-10-18 10:14 CDT R5/Philo: picked up0060 cache before this dedicated request arrived; same scope, one implementation. Prepared locally on r5/word-help-cache from devf9b61b2: bounded256 OCI meanings by [immutableVersionId,tokenIndex],32 validated audio buffers by exactword (current fixedvoice/config), shared pending promises, evicted oldest entries, failure/chapter/unavailable results removed. Existing authorization/token/word validation precedes reuse; routes/private no-store unchanged. Duplicate concurrent calls reproduced RED for both providers, now17 meaning/speech/HTTP tests and nonincremental types pass. Provider tests are fake chat/fetch (real local signing), OCI0. Initial typecheck only lacked newly merged shader dependency; npmci restored exact lockfile dependencies, no manifest/lockfile edit. Human approval to publish this new PR is pending per this workspace's AGENTS; no commit/deploy yet. No duplicate R2/R6 implementation needed.

- 2026-10-18 10:23 CDT R5/Philo: human approved publication; PR140 is OPEN/ready (not draft), MERGEABLE/CLEAN at cfdba739bdc57d6e0054d9d81fe4a9ac2409e7c7: https://github.com/DavitAndguladze/TOLK/pull/140 . Same tested change:17 focused meaning/speech/HTTP tests + nonincremental types pass, no source change since those checks.256 meaning entries/32 validated audio entries, duplicate in-flight reuse, failure/fallback retry, unchanged auth/ownership/validation and private no-store. Latest dev has no words-module overlap. R2 please review; R6 integrate/deploy under your existing authority after review. No merge/deploy/OCI calls from this session.0066 actual-call quota wiring remains a separate R5 follow-up;140 does not claim rate limiting.
- 2026-10-18 10:25 R2: shared quota seam is now merged in dev via137/a807119: platform/oci-quota exports takeOciCall(reader.id) and ociQuotaResponse(seconds),30/minute,429 Retry-After. Please preserve cache hits and enforce only real provider work with authenticated Reader identity. Your cache publication remains owned by R5; R1/R2 will not duplicate it. Separate completion-grading quota bypass sent R6 in0066.

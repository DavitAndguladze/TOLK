---
id: 0065
from: R2
to: R5
status: in-progress
issue: "#9"
created: 2026-10-18 10:10
updated: 2026-10-18 10:14
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

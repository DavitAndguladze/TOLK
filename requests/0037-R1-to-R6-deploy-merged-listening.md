---
id: 0037
from: R1
to: R6
status: in-progress
issue: "#10"
created: 2026-10-18 00:53
updated: 2026-10-18 01:14
---

## Need

#34 and #55 are MERGED into dev. Please coordinate the reviewed identity/storage and OCI listening rebuild/deploy; post the image revision and URL for R1 verification.

## Why

The human explicitly authorized these merges, superseding the earlier leave-unmerged instruction. dev 96008d8 contains #34 (5655e3c) and #55 (96008d8). Read-only checks at 00:49 CDT still showed the older reading UI, without the new upfront demo disclosure; GET /api/speech/token returns405, so that route is present. No token, microphone, or account was used in that probe.

## Proposed change

Build dev with NEXT_PUBLIC_LISTENING_ENGINE=oci-realtime, using the existing authenticated Speech route/build arguments. Coordinate reviewed #67 identity and #70 durable read-aloud persistence, plus R4 #72 payload/replay fix (0038), before claiming complete grading/persistence acceptance. Preserve separate R3/R5 migrations and owner review. No spike deployment: its unauthenticated server stays loopback-only and is excluded from Docker.

Acceptance after deployment: silence leaves words pending; recognized speech drives highlights; denied microphone/token failure stops with an error; a Gatsby Chunk achieves at least90% for a fluent Reader; saved-summary grading and silent/failed-save/retry behavior use only the current completion. Verify browser-speech flag builds without source changes. R1 handles listening verification once you post readiness. #5/#10 remain open for their missing evidence.

## Updates

- 2026-10-18 00:53 R1/R2: opened. Both PR heads verified as ancestors of origin/dev. Fresh branch tests/types/builds and both review axes have no blocker. Combined dev verification is running. #34 also fully removes the tracked personal hook artifact requested in your review; ignored local activation/script remain only on this machine.
- 2026-10-18 01:10 R6: dev 8d9135d is live but built with the mock engine; an oci-realtime rebuild of the same commit is staged and the human is running it. Will post smoke results here. #72 approved at 521975e; it needs a dev merge (one import conflict) before it lands.

- 2026-10-18 01:10 R1/R2: Read your staged-rebuild update. Fresh read-only deployed GET /read/gatsby-ch1-L1 returns200 and now contains Play demo/Demo playback plus optional-reading copy: #55 is deployed, while the current engine is still openly mock as reported. No token/audio/microphone action performed. Ready for real-engine acceptance once your OCI rebuild smoke result is posted; please distinguish mock image from rebuilt OCI image. #67/#70 merge dependencies cleared on dev8d9135d.

- 2026-10-18 01:13 R6: OCI image is LIVE. Rebuilt dev 8d9135d with NEXT_PUBLIC_LISTENING_ENGINE=oci-realtime (now set in the deploy .env, so later deploys keep it) at https://147-224-138-53.sslip.io. This replaces the earlier mock image of the same commit. Evidence: shipped read-page chunk compiles to engine ?? "oci-realtime"; Play demo copy is gone; signed-in POST /api/speech/token 200 (us-chicago-1); sign-up, open Book, /read/gatsby-ch1-L1, /progress/gatsby 200. No microphone test from R6. R1: ready for real-engine acceptance (silence, speech, denied mic/token). Answer transcription engine is still mock.

- 2026-10-18 01:14 R1/R2: Acknowledged OCI image readiness and independently checked the public deployment: read page200, optional-reading copy present, Play demo/Demo playback absent;8 public JS chunks inspected,1 contains oci-realtime and0 contain the old wordIntervalMs:380 call. This establishes shipped UI/config changes only. No microphone, audio, token, signed-in grading or phone acceptance was exercised. R1 live microphone acceptance is now the next task; #72/R4 current-completion pairing remains separate.

- 2026-10-18 01:16 R6: R1: waiting on your real-microphone acceptance on the OCI image (silence, speech, denied mic/token, >=90% on a Gatsby Chunk). Post results here; R6 fixes anything deploy-side.

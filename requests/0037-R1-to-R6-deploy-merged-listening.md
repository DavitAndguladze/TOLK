---
id: 0037
from: R1
to: R6
status: open
issue: "#10"
created: 2026-10-18 00:53
updated: 2026-10-18 00:53
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

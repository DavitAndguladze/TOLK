---
id: 0066
from: R2
to: R6
status: in-progress
issue: "#16"
created: 2026-10-18 10:10
updated: 2026-10-18 10:10
---

## Need

Human audit priorities from0060: provide a small shared per-Reader limit for paid OCI access before broader public sharing; consider replacing the static WebGL paper texture with CSS/SVG noise. R1/R2 will not edit your app/platform handlers.

## Why

Speech token, grading, meaning and TTS share an already-throttled OCI account. Authentication alone does not bound paid calls. The user also explicitly suggests a dependency-free static texture instead of maintaining a WebGL canvas for still grain.

## Proposed change

Own one shared per-Reader quota seam in platform (for example30calls/minute for this single-process demo) and announce its exact interface to R4/R5, who own their callers. Return429 plus Retry-After without leaking Reader state, and preserve ownership/Origin/idempotency/cache checks. Count the actual paid boundary rather than charging duplicate cached/replayed work if that fits your existing seams. Keep scope small; test with fake time/providers and no real OCI calls. This is0060's same quota item as a focused owner request, not a second implementation.

For134/0059: the human prefers CSS/SVG noise over the pinned shader dependency for static paper. Please fold that into your existing paper fix if still open, or report the chosen bounded follow-up. R2 owns the one-line package.json typecheck-script fix now; avoid duplicating it. Origin-helper consolidation is a low-priority follow-up for app/words owners; retain in-memory completion paths until after the demo as the audit recommends.

## Updates

- 2026-10-18 10:10 R2: requested the user's quota-first-before-public-sharing requirement and static-paper simplification; no R6/R4/R5 folder edits or OCI calls by this session. Existing R1 token client already surfaces unsuccessful startup and retains optional silent reading; happy to adapt its exact429 copy after your shared response seam is published.

- 2026-10-18 10:14 R6: both in #137 (needs a reviewer). Seam: `import { takeOciCall, ociQuotaResponse } from "@/platform/oci-quota"`; after auth + origin checks: `const retryAfter = takeOciCall(reader.id); if (retryAfter) return ociQuotaResponse(retryAfter);` → 429, Retry-After seconds, private/no-store, body `{ error }` only. 30 calls/Reader/rolling minute, in-process. R6 wired /api/speech/token and the per-question grade route. **R5:** please wire meaning + TTS in src/words/http.ts the same way (call it only on a real provider call, not a cache hit). **R1:** speech token 429 currently falls into your generic "could not get a session token" copy; adapt if you like. Paper is now a static SVG noise tile, `@paper-design/shaders-react` removed. Live = dev 129544d once the human's redeploy runs.

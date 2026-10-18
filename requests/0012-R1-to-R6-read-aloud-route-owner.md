---
id: 0012
from: R1
to: R6
status: in-progress
issue: "#10"
created: 2026-10-17 21:06
updated: 2026-10-17 21:35
---

## Need

Please agree ownership of the existing POST /api/chapter-versions/[versionId]/read-aloud route for #10. No action needed ahead of getting #4/#7 deployed; R1 is building pure alignment now.

## Why

R1 owns src/listening and cannot edit src/app/platform storage. R4's grader needs a saved summary and currently receives none.

## Proposed change

R1 can export validation/summary helpers from src/listening in a later slice; R6 can mount the thin authenticated route and persistence bridge in its folder, or name the owner. Store by Reader/session plus Chapter Version, not by the shared L1 version alone. Existing request/response types already cover this; no src/types edit is requested. Please reply with owner and the session/auth accessor to use. R2 request 0010 covers collecting chunk summaries; R4 request 0011 covers consuming them.

## Updates

- 2026-10-17 21:06 R1: opened. Building the pure alignment slice in isolation; #5 draft PR #34 still holds live spike evidence and awaits calibrated/deployed verification.

- 2026-10-17 21:13 R1: pure alignWords(tokens, fullHypothesis, { complete }) slice is ready locally on r1/alignment (dev base3f9b8cf); all98 tests (18 alignment), typecheck and default production build pass. Only src/listening changed. It returns existing per-word results/misses/accuracy0-1, preserves version indexes, supports self-correction, and leaves unanchored interim suffix words pending. `complete` is explicit Reader Chunk completion, never OCI isFinal. It does not yet provide createListeningSource or persistence. Awaiting user approval to publish the new branch/PR; this request remains open for the integration agreement.

- 2026-10-17 21:14 R1: user approved publication; draft PR #39 is open into dev: https://github.com/DavitAndguladze/TOLK/pull/39 (a4c1fe6). Pure alignment is reviewable now; #10 remains incomplete. Next R1 slice is the real ListeningSource adapter/factory and summary construction. Please reply to the integration proposal when available.

- 2026-10-17 21:35 R6: agreed. R6 owns POST /api/chapter-versions/[versionId]/read-aloud and its persistence (src/app + platform storage), keyed by Reader + Chapter Version. Session accessor comes with #7 (Better Auth server session); R6 will post its name here when #7 lands. Order: #4 (deploy, now on MySQL HeatWave, see 0013) → #7 → this route. Export your validation/summary helpers from src/listening when ready and R6 will call them.

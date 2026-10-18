---
id: 0011
from: R1
to: R4
status: open
issue: "#10"
created: 2026-10-17 21:06
updated: 2026-10-17 21:13
---

## Need

Please agree how the saved ReadAloudSummary reaches the grading route in #12. R1 is starting #10's pure expected-token alignment slice now; it will return existing WordResult/ReadAloudMiss fields and normalized accuracy 0-1.

## Why

R4 status says summaries are not yet reaching the server, so Chapter Check gets 90% weight. This handoff should be ready when real listening and persistence land.

## Proposed change

R1 will produce and merge chunk summaries keyed by Chapter Version token indexes, preserving corrections. The existing POST /api/chapter-versions/[versionId]/read-aloud contract carries ReadAloudSummary. Please confirm the per-Reader/session identity R4 expects (currently X-Reader-Session for Chapter Check) and how grading should retrieve it. OCI confidence is not accuracy; readAloud.accuracy is correct expected tokens / expected tokens. Alignment substitutions indicate transcript disagreement, not phonetic proof. R6 request 0012 asks who mounts the thin route/store bridge.

## Updates

- 2026-10-17 21:06 R1: opened. Building the pure alignment slice in isolation; #5 draft PR #34 still holds live spike evidence and awaits calibrated/deployed verification.

- 2026-10-17 21:13 R1: pure alignWords(tokens, fullHypothesis, { complete }) slice is ready locally on r1/alignment (dev base3f9b8cf); all98 tests (18 alignment), typecheck and default production build pass. Only src/listening changed. It returns existing per-word results/misses/accuracy0-1, preserves version indexes, supports self-correction, and leaves unanchored interim suffix words pending. `complete` is explicit Reader Chunk completion, never OCI isFinal. It does not yet provide createListeningSource or persistence. Awaiting user approval to publish the new branch/PR; this request remains open for the integration agreement.

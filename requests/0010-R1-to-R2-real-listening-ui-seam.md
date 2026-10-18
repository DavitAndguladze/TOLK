---
id: 0010
from: R1
to: R2
status: open
issue: "#10"
created: 2026-10-17 21:06
updated: 2026-10-17 21:13
---

## Need

Please keep ReadingScreen on the shared ListeningSource interface while R1 implements #10. The pure alignment slice is starting now on r1/alignment from dev 3f9b8cf; no src/types changes are planned.

## Why

R2 highlighting is ready. R1 can build alignment independently of R6's deployed route, then provide an engine factory so ReadingScreen no longer hardcodes the mock.

## Proposed change

Proposed next integration: R1 exports createListeningSource() from src/listening, honoring NEXT_PUBLIC_LISTENING_ENGINE and returning the existing ListeningSource. R2 replaces only its local factory/import. Pause remains stop(), Resume starts unread tokens; token indexes are Chapter Version indexes, not chunk offsets. Please confirm whether R2 can own that small UI change once R1 posts the factory, and how R2 wants to collect summaries on chunk-complete/stop for the chapter-level POST. No background-speaker isolation claim: raw noise may still transcribe in pauses; alignment will avoid advancing on unsupported interim trailing words.

## Updates

- 2026-10-17 21:06 R1: opened. Building the pure alignment slice in isolation; #5 draft PR #34 still holds live spike evidence and awaits calibrated/deployed verification.

- 2026-10-17 21:13 R1: pure alignWords(tokens, fullHypothesis, { complete }) slice is ready locally on r1/alignment (dev base3f9b8cf); all98 tests (18 alignment), typecheck and default production build pass. Only src/listening changed. It returns existing per-word results/misses/accuracy0-1, preserves version indexes, supports self-correction, and leaves unanchored interim suffix words pending. `complete` is explicit Reader Chunk completion, never OCI isFinal. It does not yet provide createListeningSource or persistence. Awaiting user approval to publish the new branch/PR; this request remains open for the integration agreement.

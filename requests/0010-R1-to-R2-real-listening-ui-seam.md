---
id: 0010
from: R1
to: R2
status: open
issue: "#10"
created: 2026-10-17 21:06
updated: 2026-10-17 21:41
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

- 2026-10-17 21:14 R1: user approved publication; draft PR #39 is open into dev: https://github.com/DavitAndguladze/TOLK/pull/39 (a4c1fe6). Pure alignment is reviewable now; #10 remains incomplete. Next R1 slice is the real ListeningSource adapter/factory and summary construction. Please reply to the integration proposal when available.

- 2026-10-17 21:32 R1: summary helpers are published in draft PR #39 at b0d0eca: https://github.com/DavitAndguladze/TOLK/pull/39 . `mergeReadAloudSummaries({ id, tokens }, fragments)` is exported from src/listening (or src/listening/summary). Pass all Chapter Version tokens and committed stop/completion fragments for one attempt in caller order, not every recognition partial. Later token outcomes replace earlier ones; empty/all-pending fragments are ignored, and no scored evidence returns null. This does not yet provide createListeningSource; the real adapter/factory remains next. See the README for pending-result semantics. All 129 tests, typecheck, default build pass; reviews clear.

- 2026-10-17 21:38 R1: implementing the real adapter at the existing ListeningSource seam. Proposed browser import is `@/listening/client` so server-only summary imports do not pull in microphone code. Please handle a revised word event with outcome `pending` by clearing its previous outcome (session.ts currently ignores pending). OCI final utterances do not complete a Chunk; auto-completion will require confirmed recognition reaching the last expected word. Pause keeps the unread suffix pending. The interface has no explicit finish method: please confirm the intended Finish chapter treatment rather than interpreting Pause as skipped words. Factory will use NEXT_PUBLIC_LISTENING_ENGINE, default mock, with no automatic browser fallback.

- 2026-10-17 21:41 R2: yes, R2 owns the UI side. (1) When `@/listening/client` exports `createListeningSource()`, R2 swaps the local factory in `ReadingScreen.tsx` for it, in one small PR. (2) R2 will treat a revised `word` event with outcome `pending` as clearing that token's outcome (`session.ts` ignores it today). That change goes in the same PR. (3) Finish chapter: it stops listening (the effect cleanup calls `stop()`) and ends the Chapter. Unread tokens stay pending and are never marked skipped. Pause is not Finish. (4) Summaries: at Chapter end R2 merges the committed stop/completion fragments with your `mergeReadAloudSummaries` and posts the result to R6's authenticated save route once it exists. Post here when the factory is on dev.

# First-hour spike — proving the listening pipeline

## Why
Every scoring feature assumes OCI Speech can stream from a browser and tell us *which word was said when*. Nobody has verified that. If it fails at 2am, the demo has no core.

## What (Role 1, 60–90 min, throwaway code)
A bare page: Start button → mic → OCI Speech realtime → print each recognized word with start/end time and confidence.

Three yes/no checks:
1. **Streams from the browser?** Server route mints a token (`createRealtimeSessionToken`), browser connects and gets text back.
2. **Per-word timestamps + confidence?** Needed to light up the current word, detect hesitations (gap > ~3s before a word), and flag shaky words.
3. **Fast enough?** Spoken word → on screen in under ~1s. Slower and the highlight lags the reader.

In parallel, Role 3 runs one Gatsby page through all 5 Levels to check prompt quality.

## Decision at 5:00pm Saturday
| Result | Do this |
|---|---|
| 1 ✅ 2 ✅ 3 ✅ | Build on OCI realtime as planned |
| 1 ✅ 3 ✅, 2 ❌ | Keep OCI for text; estimate word timing in the browser from when each partial result arrives |
| 1 ❌ or 3 ❌ | Live listening uses Chrome's built-in Web Speech API (free, no setup). OCI stays in the loop for TTS, GenAI, and DB. |

## R1 evidence status — 2026-10-17, issue #5

The experiment is in `src/listening/spike/` on `r1/listening-spike`; run instructions and the evidence capture protocol are in its README. Official browser client location and exact API usage are in [OCI Speech research](../docs/research/oci-speech-realtime.md).

| Check | Answer | Evidence |
|---|---|---|
| Browser streams mic audio to OCI and receives text | Yes, locally | Chrome 155 on Windows, `http://127.0.0.1:5177`, OCI `us-chicago-1`, 2026-10-17 at 20:09 CDT: a real microphone session returned 32 recognized words. [Sanitized sample](../docs/research/evidence/r1-session-1.json). |
| Actual per-word timing and confidence | Yes for partials and finals | Session 1 supplied 32 partial words; [session 2](../docs/research/evidence/r1-session-2.json) supplied 33 final words. Both provide start/end milliseconds and raw confidence values. Session 1 confidence ranged 96.4212–98.0401; do not interpret confidence as a pronunciation grade. |
| Speech to visible word under approximately 1 second | Preliminary estimate only; later clocks invalidated | Session 1: 32 first-seen estimates, median 477 ms, p95 678 ms, max 701 ms. Session 2: 33 estimates, median 465 ms, p95 713 ms, max 726 ms. These are initial-utterance capture-origin-to-callback estimates, not measured after-paint latency. Session 3 showed token clock regressions across callbacks; its later latency estimates are invalid. A controlled raw-clock follow-up and external confirmation remain pending. |

**Engine decision: OCI realtime remains the planned candidate; final choice awaits the remaining checks.** Keep `NEXT_PUBLIC_LISTENING_ENGINE=mock` while other roles build. The first local reading supports OCI realtime under ADR-0002; no live failure has been observed to justify selecting Web Speech. Apply the decision table above after completing the evidence protocol. If the browser fallback is chosen, record the exception to the all-OCI requirement explicitly.

To finish #5, confirm the latency clock across pauses and separate utterances and record the selected engine here. Then verify on the deployed HTTPS app with R6's authenticated token route. Do not close #5 or start #10 on an assumed spike pass.

The first live token also exposed an expiry conversion bug: Oracle's realtime JWT `exp` was an epoch-millisecond value, and multiplying by 1000 produced a far-future date. A failing token-route regression reproduced it; the corrected route passes that regression and a live check that expiry falls within the next day. The standalone spike now has six passing Node checks, including a regression that suppresses later-utterance delay estimates when the clock origin is unknown. Its smoke server uses an ephemeral port and awaited cleanup; two concurrent suites passed after fixing the fixed-port collision.

Session 3 contained six final callbacks and 112 final-word events. [Aggregate numeric clock evidence](../docs/research/evidence/r1-session-3-clocks.json) shows that token bounds moved backwards while callback time advanced. The previously reported 4080 ms gap compared different callbacks and does not establish the real pause duration; the maximum gap within one final callback was 780 ms. The spike now records transcription bounds and utterance identity, and displays later delays as unavailable rather than inventing an offset. No transcript from that longer session is included in the shared evidence.

Local integration checks after rebasing onto `dev` (`2ed7f6a`): the main app's 14 tests, typecheck, and production build pass; the standalone spike's 4 Node checks, typecheck, and production build pass. Project-only Claude Code Git guardrails were installed directly and verified against the default blocked command strings because the requested Claude Code invocation could not access its configured model. These checks do not establish OCI streaming, timing/confidence availability, or live latency. Git write authentication was verified on 2026-10-17 at 19:53; R6 configuration [request 0004](https://github.com/DavitAndguladze/TOLK/blob/comms/requests/0004-R1-to-R6-speech-spike-configuration.md) and R1 status were published on `comms` at commit `9ef7a69`. The implementation branch remains local pending user approval.

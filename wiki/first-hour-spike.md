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
| Speech to visible word under approximately 1 second | Locally responsive; under-one-second visible latency unverified | The Reader reported that the text kept pace with speech in [session 4](../docs/research/evidence/r1-session-4-clocks.json). Its 33 initial-utterance callback estimates had median 465 ms, p95 708 ms, max 710 ms. Sessions 1–2 also had initial-utterance maxima below 727 ms. These estimates are not measured after-paint timings. Session 3's later-utterance estimates are invalid; subsequent derived delays remain suppressed. |

**Engine decision: provisionally select OCI realtime, subject to visible-latency and deployed HTTPS verification.** Four local sessions demonstrate browser streaming, partial/final word fields, and Reader-observed pacing. Keep `NEXT_PUBLIC_LISTENING_ENGINE=mock` in the shared app until #10 integrates the real source. Follow expected text with recognized words under ADR-0002; scope timing to an utterance and do not compare raw bounds across clock resets. No live recognition failure justifies choosing Web Speech. Precise cross-utterance latency and the deployed microphone path remain unverified; this decision does not close #5.

To finish #5, validate spoken-word-to-visible-word latency with a confirmed clock origin and verify on the deployed HTTPS app with R6's authenticated token route. Preserve the timing limitation when integrating; do not infer session-wide hesitation or latency from resetting raw timestamps. Local streaming and word fields are evidenced, but latency and deployed acceptance remain open.

### Isolated-word follow-up, 20:46–20:47 CDT

The local probe now estimates the sound endpoint directly from the SDK's existing PCM frames, independently of OCI timestamps. The Reader ran ten attempts saying only “father”; four were measured and six were inconclusive (missing sound endpoint, wrong recognized words, or early Stop). All attempts are retained in the [numeric evidence](../docs/research/evidence/r1-isolated-word-latency.json), with no audio retained.

| Estimate from local sound endpoint | Measured attempts | Median | p95 / maximum |
|---|---|---|---|
| First matching recognition callback | 4 | 450.5 ms | 513 ms |
| DOM update | 4 | 451.5 ms | 514 ms |
| Second rendering opportunity | 4 | 457.5 ms | 522 ms |

The last three attempts had second-rendering-opportunity estimates of 345, 423, and 492 ms. This is stronger local responsiveness evidence than subtracting OCI timestamps, but the endpoint is approximate: PCM frames were 64 ms, the device reported 10 ms input latency, and gain control/noise affects detection. Nested animation frames do not establish physical screen presentation; optional browser render/presentation fields were unavailable. The sample is small and includes rejected attempts, so it does not certify the under-one-second or deployed acceptance check. The probe records first matching partial latency, not final recognition latency. A future calibrated observation and R6's deployed HTTPS route remain needed.

The first live token also exposed an expiry conversion bug: Oracle's realtime JWT `exp` was an epoch-millisecond value, and multiplying by 1000 produced a far-future date. A failing token-route regression reproduced it; the corrected route passes that regression and a live check that expiry falls within the next day. The standalone spike now has six passing Node checks, including a regression that suppresses later-utterance delay estimates when the clock origin is unknown. Its smoke server uses an ephemeral port and awaited cleanup; two concurrent suites passed after fixing the fixed-port collision.

Session 3 contained six final callbacks and 112 final-word events. [Aggregate numeric clock evidence](../docs/research/evidence/r1-session-3-clocks.json) shows that token bounds moved backwards while callback time advanced. The previously reported 4080 ms gap compared different callbacks and does not establish the real pause duration; the maximum gap within one final callback was 780 ms. The spike now records transcription bounds and utterance identity, and displays later delays as unavailable rather than inventing an offset. No transcript from that longer session is included in the shared evidence.

Session 4 captured three final callbacks (52 final-word events) and confirmed that both transcription and token bounds restart. The later delay fields are correctly unavailable. The Reader reported that text kept pace with speech; this supports the local engine choice but is a qualitative observation, not precise clock calibration. [Aggregate numeric evidence](../docs/research/evidence/r1-session-4-clocks.json).

Latest integration checks, 2026-10-17 at 20:33 CDT after rebasing onto `dev` (`850d942`): the main app's 29 tests, typecheck, and production build pass; the standalone spike's 6 Node checks, typecheck, and production build pass. Project-only Claude Code Git guardrails were installed directly and verified against the default blocked command strings because the requested Claude Code invocation could not access its configured model. Automated checks do not establish visible latency or deployed microphone behavior. R6 configuration [request 0004](https://github.com/DavitAndguladze/TOLK/blob/comms/requests/0004-R1-to-R6-speech-spike-configuration.md) remains in progress for the deployed route. With user approval, the branch was published as [draft PR #34 into dev](https://github.com/DavitAndguladze/TOLK/pull/34); #5 stays open for the remaining acceptance checks.

Follow-up verification, 2026-10-17 at 20:53 CDT after merging `dev` (`25da7f7`): all 57 app tests and 12 spike checks pass, both typechecks pass, and the spike production build passes. The main app's default Turbopack build fails locally while starting its CSS worker (`node process exited before we could connect to it`, exit code 0), including outside the sandbox. The documented alternative `npm run build -- --webpack` succeeds. This is an unresolved local build limitation, not an established cause in R1 code; reported to R6 through comms. Ponytail review and follow-up Standards/Spec reviews found no remaining actionable defects in this latency slice. Two regression tests first reproduced revised-final validation and lost failure evidence, then passed after their fixes. Deployed acceptance remains open.

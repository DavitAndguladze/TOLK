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
| Browser streams mic audio to OCI and receives text | Unverified | No OCI credentials, token endpoint, deployed HTTPS URL, or browser session is available in this checkout. |
| Actual per-word timing and confidence | Unverified | Oracle's models define these fields; an actual response sample is still required. |
| Speech to visible word under approximately 1 second | Unverified | No live samples. SDK documentation cannot establish this target. The spike labels its audio-clock calculations as estimates. |

**Engine decision: pending live evidence.** Keep `NEXT_PUBLIC_LISTENING_ENGINE=mock` while other roles build. OCI realtime remains the planned engine under ADR-0002; no live failure has been observed to justify selecting Web Speech. Apply the decision table above after measuring the three checks. If the browser fallback is chosen, record the exception to the all-OCI requirement explicitly.

To finish #5, configure Speech on R6's OCI tenancy, run the spike with a Reader and the target browser/phone, retain sanitized text/timing evidence, and record three measured answers plus the selected engine here. Then verify on the deployed HTTPS app with R6's authenticated token route. Do not close #5 or start #10 on an assumed spike pass.

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

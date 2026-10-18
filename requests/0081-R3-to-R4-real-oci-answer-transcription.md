---
id: 0081
from: R3
to: R4
status: open
issue: "#16"
created: 2026-10-18 12:33
updated: 2026-10-18 12:33
---

## Need

Philo reports the actual app returns literal "mock transcription" and explicitly asks to connect to OCI for proper testing. R4 please claim the missing answer-transcription path, or delegate the narrow client adapter to R3; R1/R6 review transport/config. I can implement once ownership is clear.

## Why

At dev f42d8f9, comprehension/transcription.ts defaults NEXT_PUBLIC_ANSWER_TRANSCRIPTION_ENGINE to mock and createMockTranscriber returns that literal text. createOciBatchTranscriber is still an unconditional throwing stub. This is separate from working read-aloud NEXT_PUBLIC_LISTENING_ENGINE=oci-realtime. Credentials alone cannot implement the missing adapter. scripts/deploy-direct.sh explicitly defaults answer transcription to mock.

## Proposed change

Prefer reuse of the existing authenticated OCI realtime transport for free-form answer capture, if the R1 transport supports it, instead of building new Object Storage/batch infrastructure. Need bounded lifecycle/error/silence behavior and no fabricated transcript fallback. R3 is doing read-only caller/transport diagnosis now; no cross-role code edits or provider calls. R6 must then rebuild with the implemented answer engine, confirm the built flag and authenticated token path, and arrange a real spoken-answer check. Do not flip to the unimplemented oci-batch engine. User-supplied credential values stay out of comms; existing local OCI key is readable, no local VM SSH key configured.

## Updates

- 2026-10-18 12:33 CDT R3: opened, awaiting owner claim/delegation; Gatsby163 and156/161 coordination continue in parallel.

---
id: 0082
from: R3
to: R6
status: open
issue: "#16"
created: 2026-10-18 12:41
updated: 2026-10-18 12:41
---

## Need

Philo explicitly requests real OCI answer transcription instead of the literal mock response. Please coordinate R4 implementation0081 and build/deploy the real answer engine after it exists; report exact live commit and both compiled engine flags. R3 can take the narrow client adapter after R4/R1 ownership confirmation.

## Why

Current app Check answers use a different flag from read-aloud. NEXT_PUBLIC_ANSWER_TRANSCRIPTION_ENGINE defaults to mock in scripts/deploy-direct.sh and Dockerfile, while oci-batch is an unimplemented throwing stub. CI deploy.yml passes neither public engine build argument, so its image defaults both paths to mock. Runtime-only env changes cannot replace compiled browser flags. No credential values are required in comms.

## Proposed change

Reuse the existing authenticated/metered Speech token route and R1 openOciSpeech transport, with cancellation and bounded answer capture. No Object Storage/batch pipeline or dependency needed. After R4/R1 clear adapter ownership and implementation, build with both actual engines; verify fresh Check Record answer -> real utterance -> editable transcript -> existing grading, plus silence/denial/cancel and no mock fallback. Keep real read-aloud intact.

R3 verified existing local identity against actual OCI Speech: [token proof](../handoffs/r3-oci-answer-transcription-20261018/oci-speech-preflight.json), [synthetic audio proof](../handoffs/r3-oci-answer-transcription-20261018/oci-answer-service-probe.json). Service returned final six-word transcript with timestamps; Gatsby was recognized as gadsby. This is not browser-mic or production-account proof. No local VM SSH key is configured; R6 remains deployment owner.

## Updates

- 2026-10-18 12:41 CDT R3: opened. Also keep156/161 deployment moving: merged fdff333/b639239. Accessibility b9f5bfe did not enter closed156 and is now165; include its reviewed actual delivery path. Gatsby163 remains ready into Davit115, not accepted content.

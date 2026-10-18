---
id: 0082
from: R3
to: R6
status: in-progress
issue: "#16"
created: 2026-10-18 12:41
updated: 2026-10-18 12:55
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
- 2026-10-18 12:40 R4 (David) → **R6:** please merge **#166** and redeploy. **Check your .env:** if it has `NEXT_PUBLIC_ANSWER_TRANSCRIPTION_ENGINE=mock`, change it to `web-speech` (deploy-direct.sh sources .env, so it would override the new default). The build log now prints `answers: web-speech`. Then in Chrome on live: Check → Speak → say a sentence → the transcript appears → Check answer grades it. Read-aloud stays `oci-realtime`, unchanged.
- 2026-10-18 12:46 CDT R6: R6 owns the deploy. #166 (8d43f8e) flips the build default to web-speech: Dockerfile, .env.example and deploy-direct.sh only. Not yet reviewed or merged; live still builds with mock. After review and merge R6 will deploy and report the commit and compiled engine flags. Real OCI batch transcription (createOciBatchTranscriber) remains an unimplemented stub (0081).

- 2026-10-18 12:42 CDT R3/Philo: acknowledged deployed abe9c71, including156/161/165/162. Human reiterated OCI answer wiring; R3 is taking the adapter specifically deferred by R4, separately from166 browser-speech defaults. Please keep166 described as browser fallback, not OCI. After adapter review/publication, rebuild with NEXT_PUBLIC_ANSWER_TRANSCRIPTION_ENGINE=oci-realtime; preserve listening OCI. Will send exact head/tests. Also removed committed merge-conflict markers above, preserving both R4/R6 entries verbatim.
- 2026-10-18 12:55 CDT R6: merged #166 (afc7c81) and deployed dev afc7c81. Build log: listening oci-realtime, answers web-speech; tolk-deploy/.env has no ANSWER_TRANSCRIPTION override. Public smoke: /welcome 200, /sign-in 200, /api/library 401, signed-out /read/gatsby-ch1-L3 307. Not verified: the signed-in Check → Speak → transcript → grade flow in Chrome (needs a signed-in human). Real OCI batch transcription is still unimplemented (0081).

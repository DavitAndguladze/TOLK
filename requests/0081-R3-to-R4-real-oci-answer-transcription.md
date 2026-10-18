---
id: 0081
from: R3
to: R4
status: in-progress
issue: "#16"
created: 2026-10-18 12:33
updated: 2026-10-18 13:25
---

## Need

Philo reports the actual app returns literal "mock transcription" and explicitly asks to connect to OCI for proper testing. R4 please claim the missing answer-transcription path, or delegate the narrow client adapter to R3; R1/R6 review transport/config. I can implement once ownership is clear.

## Why

At dev f42d8f9, comprehension/transcription.ts defaults NEXT_PUBLIC_ANSWER_TRANSCRIPTION_ENGINE to mock and createMockTranscriber returns that literal text. createOciBatchTranscriber is still an unconditional throwing stub. This is separate from working read-aloud NEXT_PUBLIC_LISTENING_ENGINE=oci-realtime. Credentials alone cannot implement the missing adapter. scripts/deploy-direct.sh explicitly defaults answer transcription to mock.

## Proposed change

Prefer reuse of the existing authenticated OCI realtime transport for free-form answer capture, if the R1 transport supports it, instead of building new Object Storage/batch infrastructure. Need bounded lifecycle/error/silence behavior and no fabricated transcript fallback. R3 is doing read-only caller/transport diagnosis now; no cross-role code edits or provider calls. R6 must then rebuild with the implemented answer engine, confirm the built flag and authenticated token path, and arrange a real spoken-answer check. Do not flip to the unimplemented oci-batch engine. User-supplied credential values stay out of comms; existing local OCI key is readable, no local VM SSH key configured.

## Updates

- 2026-10-18 12:33 CDT R3: opened, awaiting owner claim/delegation; Gatsby163 and156/161 coordination continue in parallel.

- 2026-10-18 12:37 CDT R3/Philo: actual service evidence now PASS using existing local OCI identity: token issued in us-chicago-1 with valid future expiry (498ms); separate realtime session sent only a2.21s synthetic fixture saying "Gatsby wanted to see Daisy again." OCI returned final "gadsby wanted to see Daisy again",6words with6timestamps,5partial results,4.8s elapsed.2token calls+1realtime session total; no human mic, production account or DB writes. This proves Speech connectivity, not app integration/recognition accuracy. Exact reuse seam found: exported openOciSpeech(signal,onSnapshot,onError) from listening/oci.ts bypasses alignment, no new provider/dependency/storage. Adapter must resolve first nonempty final snapshot (replace cumulative words), abort on every terminal path, bound connected silence, and pass cancellation through AnswerInput for unmount/type/question changes. R4/R1 please confirm narrow delegation or claim implementation; R6 build must use implemented answer engine, not oci-batch stub. Local evidence .scratch/oci-speech-preflight.json and oci-answer-service-probe.json contains no tokens or credentials.

- 2026-10-18 12:38 CDT R1 comms refresh: answer transcription is separate from real read-aloud; current batch adapter remains a stub. Acknowledged Philo12:37 owner-reported synthetic OCI service success and exported openOciSpeech reuse seam; this is not app or human-microphone acceptance. R4 ownership/delegation and R6 implemented-engine rebuild remain required; R1 available for bounded transport/config contract review. No duplicate implementation, provider request, flag flip or production change started.
- 2026-10-18 12:40 R4 (David): **R4 takes this. Fix is #166** (https://github.com/DavitAndguladze/TOLK/pull/166). A real engine already exists: `createWebSpeechTranscriber` (browser speech recognition, ADR-0002's fallback, with silence/error handling, editable transcript, typed fallback on unsupported browsers). Live returned "mock transcription" only because the build flag defaulted to `mock` in deploy-direct.sh, the Dockerfile and .env.example. #166 defaults all three to `web-speech`, with no app code. **Not doing the OCI realtime answer adapter before submission** (time); it can follow later. Philo, thanks for the OCI proof; no adapter work needed now.

- 2026-10-18 12:42 CDT R3/Philo: latest direct user instruction is to pick up OCI answer transcription if R4 has not. David explicitly deferred that adapter while taking browser-fallback config166; R3 now claims only the separate OCI realtime client adapter and AnswerInput cancellation on r3/oci-answer-transcription from current dev. No duplicate config166 edits, batch infrastructure, grading changes or new dependency. Reuse openOciSpeech, first final utterance, bounded silence and abort cleanup; focused tests plus local UI check. R4/R1 review requested when ready. Browser web-speech is a useful fallback but does not meet the requested OCI integration. App commit/PR approval and R6 rebuild remain separate.

- 2026-10-18 12:52 CDT R3/Philo: user approved publication; READY168 https://github.com/DavitAndguladze/TOLK/pull/168 at e712a35, based on merged166/afc7c81. R4 owner review requested. Adds oci-realtime answer adapter over unchanged openOciSpeech, final-only short utterance,30s bounded capture, cancellation on mode/question/Reader/Check/unmount, and browser-fallback cancellation. No grading/config/schema/dependency changes.21 current-checkout focused tests/types/webpack build PASS. Actual adapter + actual transport + synthetic PCM -> actual OCI returned final "gadsby wanted to see Daisy again", closed track/context,4.445s. Local real Check UI with controlled transcription/grading fixture verified cancellation/late results/navigation/error/keyboard at1280x720/390x844; QA route/server/tab removed, never shipped. The temporary grader label "Local fixture accepted" was QA-only and confused the human; explicitly clarified it is NOT OCI/live grading. Human-mic/live grading still unverified. Exact report docs/research/oci-answer-transcription.md; real service JSON in handoffs/r3-oci-answer-transcription-20261018/oci-answer-adapter-probe.json.

- 2026-10-18 12:54 CDT R3/Philo: human has asked us to keep168 moving and is available for a signed-in spoken test. Exact e712a35 remains ready/mergeable; R4 owner review is the immediate code dependency before R6 deployment. No new code or repeat tests; R1 bounded transport review0083 remains open.

- 2026-10-18 13:04 CDT R3/R5 Philo: 168 e712a35 remains open. R2 non-owner comment finds no blocker; R1 claimed transport/lifecycle review0083 at12:59. R4 comprehension owner review is still needed for R6 deployment. Human is available to sign in/speak on actual app; no substitute fixture accepted. Separate F3 preview-flag fix is local/pending publication permission and will preserve your170 pace change; it is not part of168.

- 2026-10-18 R3: renewed human instruction is168 owner review→dev→main→R6 deployment. R2 offers13:30 merge absent objections; please give explicit comprehension clearance or a concrete blocker on e712a35. We will preserve your browser fallback until the OCI adapter itself is delivered.

- 2026-10-18 R3: explicitly requested Doger87's GitHub review of168 e712a35 alongside JoshNovotny00. Please approve or identify a concrete comprehension blocker so we can promote this unchanged verified adapter through dev→main. R6's current live main-equivalent tree uses web-speech answers; the human's requested OCI answer test is still blocked here.
- 2026-10-18 13:25 R4 (David): **approved #168 on GitHub** (comprehension owner review, no blockers). R2, please merge. It's inert until R6 rebuilds with NEXT_PUBLIC_ANSWER_TRANSCRIPTION_ENGINE=oci-realtime; the product owner decides whether to switch live from web-speech before the demo.

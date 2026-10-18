# OCI answer transcription

Chapter Check answers now support `NEXT_PUBLIC_ANSWER_TRANSCRIPTION_ENGINE=oci-realtime`.
The client reuses `openOciSpeech` and the existing authenticated, quota-limited
`POST /api/speech/token` route. No new credentials, provider SDK, dependency,
storage, grading path or expected-text alignment was added.

One recording accepts the first nonempty finalized utterance. Partial words never
become an answer. The 30-second deadline includes connection, microphone permission
and silence. Success, failure, timeout and cancellation release capture. Switching
answer mode, leaving a question, changing Reader/Check identity or unmounting
prevents late results from changing answers. Browser Web Speech also observes the
cancellation contract; typing remains available after failure.

## Verification, 2026-10-18

- Reproduced missing OCI engine selection before the change. Reproduced a cancelled
  browser-fallback recording resolving a late answer before adding cancellation.
- 21 focused tests in the current checkout passed (3 files; excluded ignored
  historical `.scratch` snapshots): answer engines plus existing OCI transport.
  Coverage includes corrected final text, token 401/429/503, socket failure, silence,
  partial-only timeout, cancellation and a late microphone permission grant.
- Nonincremental TypeScript and the webpack production build passed with
  `NEXT_PUBLIC_ANSWER_TRANSCRIPTION_ENGINE=oci-realtime`. The build contains no QA route.
- Actual adapter and actual `openOciSpeech` transport sent synthetic 16-kHz PCM to
  real OCI Speech. Fixture: “Gatsby wanted to see Daisy again.” Final transcript:
  “gadsby wanted to see Daisy again”. Capture track and audio context closed;
  elapsed 4.445 seconds. Token stayed in memory. This was not a human microphone,
  production account, or token-route authentication test. The probe used two token
  requests total: the first exposed an expiry-decoding mistake in the temporary
  harness; after matching the actual token route, the second completed one realtime
  session. No provider retry loop or throttle occurred.
- Integrated Browser at measured CSS viewports 1280x720 and 390x844: final answer
  display, Type cancellation, unchanged typed answer after a late result, previous
  question cancellation, unmount cancellation, failure recovery and keyboard
  cancellation passed. No horizontal overflow. This used the real Check UI with a
  controlled transcription/grading fixture. The fixture page, server and temporary
  tab were removed; it was never shipped and provides no live grading evidence.

## Deployment and live acceptance

R4's #166 defaults to `web-speech`; that is a separate browser service. R6 must
rebuild the reviewed adapter with **both** public engine flags set to `oci-realtime`
if both read-aloud and answers should use OCI. These values are compiled into the
browser bundle; changing only the running container environment is insufficient.
Do not select `oci-batch`, which remains unsupported. No build-default change is
included here.

After deployment, use an authorized signed-in Reader and a fresh Check. Record a
real short answer, pause for finalization, inspect its transcript, then submit it
through the existing grader. Also verify microphone denial, silence, switching to
Type and leaving the question release capture without overwriting another answer.
An old session draft may still contain old mock text; the acceptance check must
exercise a new Record action. Production microphone/grading acceptance is pending.

This change does not provide accepted Gatsby content or activate its Library rows.
Davit owns the excerpt artifact acceptance; R6 owns import and deployment.

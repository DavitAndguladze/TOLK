# R1 listening spike — issue #5

Throwaway experiment; not the production `ListeningSource` for #10. It reads `mockChapterVersion(1)` from `src/mocks/` and uses the existing shared Speech token response. Shared types and other roles' folders are unchanged.

## Run locally

From the repo root, with Node 22.12+:

```powershell
npm.cmd ci --prefix src/listening/spike
npm.cmd run dev --prefix src/listening/spike
```

Open `http://127.0.0.1:5175`. The page and its token server run together. Keep this experiment on loopback: the token route has no Reader authentication. A production deployment must use R6's authenticated `POST /api/speech/token`; the static `dist/` build alone has no token server. Do not expose the Vite development server publicly.

Put the following **existing** keys in the repo-root `.env.local` (never commit it):

- `OCI_COMPARTMENT_OCID`
- `OCI_SPEECH_REGION` (or `OCI_REGION`)
- Either configure the standard `~/.oci/config` API-key profile, or supply `OCI_TENANCY_OCID`, `OCI_USER_OCID`, `OCI_FINGERPRINT`, and `OCI_PRIVATE_KEY_PATH`. Relative key paths resolve from the repo root. These are server-only values.

No new environment keys are needed. Restart the server after changing credentials. Every token and recognition call goes to OCI. There is no browser speech fallback in this spike and no audio persistence.

The published Oracle browser package **2.2.0 contains TypeScript source but omits the advertised `dist/` entry** (observed in the npm install on 2026-10-17). `prepare-sdk` emits the supplied source into its expected entry point before each command. Only this upstream source is transpiled with `noCheck` because it predates the installed TypeScript version; the spike, mock fixtures, and shared contract are checked strictly. No upstream source is patched or vendored into Git.

## Capture the three checks

**Built-in microphone background pickup:** “Reduce background pickup” is enabled by default. On the SDK's existing audio track, the spike requests noise suppression and echo cancellation on, automatic gain off, using optional browser constraints. Streaming is paused while applying these settings; Stop during that wait never resumes the stopped stream. The page and `microphone-settings` evidence report actual returned values, or unreported/unsupported status. Uncheck before a new Start to compare browser defaults. Latency-probe history includes the processing settings for each new trial; the earlier retained measurements predate this option.

This is a processing preference, not distance filtering or speaker identification. Nearby conversations may remain intelligible. Disabling gain control may also make quiet reading harder to recognize; compare both settings in your usual surroundings. A headset microphone close to the Reader is preferable in a busy room. No extra audio stream, new AI service, or audio persistence is introduced. In the first laptop comparison, the Reader reported clear reading but nearby voices transcribed during pauses. Pause-time isolation remains unsolved; this is not a measured improvement against defaults. Use Stop for a longer break.

1. Start, allow the microphone, wait for “Listening”, and read the Chapter Version. Actual recognized text establishes browser streaming. Socket authentication alone does not.
2. Inspect both partial and final word rows. Copy evidence showing nonmissing start/end milliseconds and confidence; verify timings across two utterances. Confidence is recognition uncertainty, not a pronunciation grade.
3. Read at least three times, including a pause over three seconds, a skipped word, and a correction. Record first-visible partial and final-result delay separately. Report sample count, median, p95, and maximum. The displayed values are estimates anchored to the first PCM frame; confirm clock origin and visible latency with an external observer/clock before choosing an engine. Negative values invalidate that estimate. Do not use token fetch or socket setup duration as speech latency.

Request a final result and wait for final rows before Stop if the last words matter. Stop immediately closes the connection and releases the microphone; it does not wait for finalization. Also exercise denied permission, socket failure during permission, restart, and tab navigation. The SDK exposes no capture-start callback; this spike observes its public `RUNNING` state to anchor the audio clock and release a late stream after teardown. These hooks need verification on the target phone.

Copy evidence holds only text/timing events, browser identity, and OCI region. It excludes JWTs, private keys, audio, and authentication messages. Treat it as a manual export; nothing is sent to a file or service automatically. A new Start clears the previous in-memory results.

Live testing found that token timestamps can restart after final results. The spike records transcription bounds and an utterance number, keeps first-seen words separate between utterances, and suppresses derived delays after the first final result until their clock origin is calibrated. Raw timestamps remain available; do not interpret a timestamp reset as a network delay or compare raw word bounds across utterances to infer a hesitation.

## Isolated-word latency measurement

Use **Run word latency probe**, keep quiet for the one-second microphone baseline, say **father** once when prompted, then stay quiet. Keep the page visible. The microphone stops automatically after a complete measurement or 20 seconds. Repeat three times without reloading; numeric results accumulate in memory and are included by Copy evidence.

The probe inspects the SDK's existing 16 kHz PCM frames and immediately discards the decoded samples. It records a sound-energy endpoint estimate on the browser's `performance.now()` timeline, first matching recognition, DOM mutation, and two nested animation-frame callbacks. Where supported and actually observed, Element Timing supplies text render/presentation timing too. The microphone's reported input-latency setting is metadata, not a calibrated correction. No additional microphone stream or audio recording is created.

The result separates speech-end-to-recognition, speech-end-to-DOM, and speech-end-to-second-rendering-opportunity estimates. Optional browser render/presentation fields remain null if no entry arrives. None relies on OCI word clock continuity. Quiet phonemes, ambient noise, capture buffering, gain control, and callback scheduling make the energy endpoint approximate; animation frames do not prove physical display presentation. Trials hidden during measurement, stopped early, containing the wrong final words before completion, or continuing in sound after display are inconclusive. The measurement uses the first matching partial; it does not wait for final recognition. Connection or microphone failures are retained as inconclusive trials. This instrument narrows the local latency question but does not itself certify acoustic-to-visible or deployed latency.

The smoke test uses a separate temporary Vite cache as well as an ephemeral port, so validation cannot replace the live page's optimized Oracle dependency.

## Checks

```powershell
npm.cmd test --prefix src/listening/spike
npm.cmd run typecheck --prefix src/listening/spike
npm.cmd run build --prefix src/listening/spike
```

The smoke check starts a separate loopback server with OCI configuration blanked. It verifies page/module serving, method/origin rejection, and the missing-configuration response without calling OCI. Session regression checks drive the real page handlers with fake browser/SDK boundaries to verify separate partial/final clocks and failed/late microphone cleanup. These do not establish actual microphone behavior, service quality, or live latency. Browser and deployed-URL verification remain required for #5.

The Node checks use `*.check.mjs` names so the main app's Vitest discovery does not try to execute them as Vitest suites. The spike also supplies an empty PostCSS pipeline so it can run before the main app's Tailwind dependencies are installed.

See [research](../../../docs/research/oci-speech-realtime.md) and [decision/evidence status](../../../wiki/first-hour-spike.md).

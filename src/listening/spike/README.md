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

1. Start, allow the microphone, wait for “Listening”, and read the Chapter Version. Actual recognized text establishes browser streaming. Socket authentication alone does not.
2. Inspect both partial and final word rows. Copy evidence showing nonmissing start/end milliseconds and confidence; verify timings across two utterances. Confidence is recognition uncertainty, not a pronunciation grade.
3. Read at least three times, including a pause over three seconds, a skipped word, and a correction. Record first-visible partial and final-result delay separately. Report sample count, median, p95, and maximum. The displayed values are estimates anchored to the first PCM frame; confirm clock origin and visible latency with an external observer/clock before choosing an engine. Negative values invalidate that estimate. Do not use token fetch or socket setup duration as speech latency.

Request a final result and wait for final rows before Stop if the last words matter. Stop immediately closes the connection and releases the microphone; it does not wait for finalization. Also exercise denied permission, socket failure during permission, restart, and tab navigation. The SDK exposes no capture-start callback; this spike observes its public `RUNNING` state to anchor the audio clock and release a late stream after teardown. These hooks need verification on the target phone.

Copy evidence holds only text/timing events, browser identity, and OCI region. It excludes JWTs, private keys, audio, and authentication messages. Treat it as a manual export; nothing is sent to a file or service automatically. A new Start clears the previous in-memory results.

## Checks

```powershell
npm.cmd test --prefix src/listening/spike
npm.cmd run typecheck --prefix src/listening/spike
npm.cmd run build --prefix src/listening/spike
```

The smoke check starts a separate loopback server with OCI configuration blanked. It verifies page/module serving, method/origin rejection, and the missing-configuration response without calling OCI. Session regression checks drive the real page handlers with fake browser/SDK boundaries to verify separate partial/final clocks and failed/late microphone cleanup. These do not establish actual microphone behavior, service quality, or live latency. Browser and deployed-URL verification remain required for #5.

See [research](../../../docs/research/oci-speech-realtime.md) and [decision/evidence status](../../../wiki/first-hour-spike.md).

# OCI Speech realtime browser spike — issue #5

Researched 2026-10-17 against Oracle documentation and Oracle-maintained source. This is an implementation reference, **not a live spike result**. No OCI credentials, browser microphone session, deployed URL, observed service response, or latency measurements were available during this research. The three decisions in `wiki/first-hour-spike.md` remain unverified.

## Browser package and imports

Install `@oracle/oci-ai-speech-realtime-web`; Oracle's source package identifies version **2.2.0** and entry point `dist/index.js`. This is the browser SDK, distinct from the general OCI TypeScript SDK used on the server. Its root exports the realtime client and API models. The build uses CommonJS with generated declarations, so use the package through the app bundler rather than assuming it is a standalone ESM script. [Oracle repository](https://github.com/oracle/oci-ai-speech-realtime-web-sdk), [package manifest](https://github.com/oracle/oci-ai-speech-realtime-web-sdk/blob/main/ai-speech-realtime-sdk-web/package.json), [root exports](https://github.com/oracle/oci-ai-speech-realtime-web-sdk/blob/main/ai-speech-realtime-sdk-web/index.ts), [build configuration](https://github.com/oracle/oci-ai-speech-realtime-web-sdk/blob/main/ai-speech-realtime-sdk-web/tsconfig.json).

Client-side usage, following Oracle's example (the caller supplies `listener`, `session`, and `region`):

```ts
import {
  AIServiceSpeechRealtimeApi,
  RealtimeParametersModelDomainEnum,
  RealtimeParametersStabilizePartialResultsEnum,
} from "@oracle/oci-ai-speech-realtime-web";

const client = new AIServiceSpeechRealtimeApi(
  listener,
  session.token,
  session.compartmentId,
  `wss://realtime.aiservice.${region}.oci.oraclecloud.com/ws/transcribe/stream`,
  {
    encoding: "audio/raw;rate=16000",
    languageCode: "en-US",
    modelType: "ORACLE",
    modelDomain: RealtimeParametersModelDomainEnum.GENERIC,
    stabilizePartialResults: RealtimeParametersStabilizePartialResultsEnum.NONE,
    partialSilenceThresholdInMs: 0,
    finalSilenceThresholdInMs: 1000,
  },
);
client.connect();
// While connected, request completion of the current partial:
client.requestFinalResult();
// On Stop / teardown:
client.close();
```

The values above are a starting configuration from the [official React example](https://github.com/oracle/oci-ai-speech-realtime-web-sdk/blob/main/example-client/react-client/src/App.tsx), not measured optimal settings. Region must match token creation. A request for final results is separate from closing the connection; if final words matter, wait for the resulting final response before closing, with a bounded timeout. [Example instructions](https://github.com/oracle/oci-ai-speech-realtime-web-sdk/blob/main/example-client/README.md).

## Callbacks, microphone ownership, and cleanup

`RealtimeClientListener` requires `onConnect`, `onConnectMessage`, `onResult`, `onAckAudio`, `onError`, and `onClose`. `onConnect` means the socket opened; `onConnectMessage` means the service sent `CONNECT`. `onAckAudio` is relevant when acknowledgements are enabled. Neither connection callback proves that microphone capture has begun: after `CONNECT`, the SDK initiates asynchronous permission/capture, then invokes the authenticated callback. `getWebSocketState()` can report `RealtimeWebSocketState.RUNNING` after recording begins. [Realtime client source](https://github.com/oracle/oci-ai-speech-realtime-web-sdk/blob/main/ai-speech-realtime-sdk-web/src/ai-speech-realtime-web-client.ts).

The SDK acquires its own microphone and streams audio; the spike should not also create a second recording pipeline. `close()` stops the streamer, stops its stream tracks, and closes the socket. **Source-inspection concern:** stopping while the microphone permission request is unresolved can allow the later promise handler to start capture after Stop. Verify this case and ensure late streams are released. Errors invoke `onError`; the application must manage teardown. These are source-derived concerns, not observed failures. [Realtime client source](https://github.com/oracle/oci-ai-speech-realtime-web-sdk/blob/main/ai-speech-realtime-sdk-web/src/ai-speech-realtime-web-client.ts).

The streamer converts channel-zero samples to little-endian signed 16-bit PCM, resampling to 16 kHz. It uses `AudioContext` and `ScriptProcessorNode`, with 16 kHz initialization and 48/44.1 kHz fallbacks. Test the target phone/browser and HTTPS deployment; source compatibility branches are not proof of cross-browser success. Inspect audio-context cleanup as well as track cleanup: its reset routine disconnects nodes and discards its context reference without explicitly closing the context. [Audio streamer source](https://github.com/oracle/oci-ai-speech-realtime-web-sdk/blob/main/ai-speech-realtime-sdk-web/src/speech-audio-streamer.ts).

## Result schema: words, timestamps, confidence

`onResult(result)` receives `result.transcriptions[]`. Each transcription has `isFinal`, `transcription`, `startTimeInMs`, `endTimeInMs`, `confidence`, `trailingSilence`, and `tokens[]`. Each token has:

| Field | Meaning |
| --- | --- |
| `token` | Recognized text |
| `type` | `WORD` or `PUNCTUATION`; filter for words |
| `startTimeInMs` | Token start, milliseconds |
| `endTimeInMs` | Token end, milliseconds |
| `confidence` | Recognition confidence number |

These fields are in Oracle's generated [browser API models](https://github.com/oracle/oci-ai-speech-realtime-web-sdk/blob/main/ai-speech-realtime-sdk-web/src/ai-speech-api-client.ts), [token reference](https://docs.oracle.com/en-us/iaas/tools/typescript/latest/modules/_aispeech_lib_model_realtime_message_result_transcription_token_.realtimemessageresulttranscriptiontoken.html), and [transcription reference](https://docs.oracle.com/en-us/iaas/tools/typescript/latest/modules/_aispeech_lib_model_realtime_message_result_transcription_.realtimemessageresulttranscription.html). The reviewed field definitions specify units but do not explicitly define the timestamp clock origin or confidence range. Confirm the stream origin, presence/meaning of values on partials, and observed confidence range from live responses; do not silently invent values for missing fields.

Treat `isFinal: false` as a revisable partial. Oracle's example replaces the current partial and appends finalized text, clearing the partial. Appending every callback's word list will duplicate repeated partial hypotheses. Keep interim and final rows visibly distinct. [Official result handling](https://github.com/oracle/oci-ai-speech-realtime-web-sdk/blob/main/example-client/react-client/src/App.tsx).

Confidence describes recognition uncertainty, not a Reader's pronunciation grade. A substitution or skipped expected word still needs alignment to the Chapter Version; that remains the approach in ADR-0002. Oracle itself describes confidence as useful for identifying possibly incorrect transcription. [Oracle Speech product description](https://www.oracle.com/artificial-intelligence/speech/).

## Server-only session token

Use `oci-common` and `oci-aispeech` on the server. For local API-key configuration, adapt the documented authentication provider as follows; the config path/profile and compartment come from server-only configuration:

```ts
import * as common from "oci-common";
import * as aispeech from "oci-aispeech";

async function mintSpeechSession(configPath: string, profile: string, compartmentId: string) {
  const provider = new common.ConfigFileAuthenticationDetailsProvider(configPath, profile);
  const speech = new aispeech.AIServiceSpeechClient({
    authenticationDetailsProvider: provider,
  });
  const response = await speech.createRealtimeSessionToken({
    createRealtimeSessionTokenDetails: { compartmentId },
  });
  return response.realtimeSessionToken;
}
```

The configuration must select the same region as the browser endpoint. The response object contains `token`, `sessionId`, and `compartmentId`; its JWT contains expiry information. Keep OCI private keys and long-lived credentials on the server; return only the short-lived session object and required connection metadata. [Oracle server example](https://github.com/oracle/oci-ai-speech-realtime-web-sdk/blob/main/example-client/index.ts), [token response model](https://docs.oracle.com/en-us/iaas/tools/typescript/2.116.2/modules/_aispeech_lib_model_realtime_session_token_.realtimesessiontoken.html), [SDK authentication methods](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdk_authentication_methods.htm).

Oracle's example uses `SessionAuthDetailProvider` for an OCI CLI session instead; choose the provider matching the supplied credentials. On OCI, Oracle recommends instance-principal authentication. Token issuance must have application authentication/authorization before deployment: an unprotected minting endpoint lets arbitrary callers consume the tenancy's Speech resources. Do not copy example token logging or wildcard CORS into the deployed app. [Oracle server example](https://github.com/oracle/oci-ai-speech-realtime-web-sdk/blob/main/example-client/index.ts), [Oracle integration/authentication guidance](https://docs.oracle.com/en/cloud/paas/digital-assistant/use-chatbot/features-oracle-web.html).

## Limits and required live evidence

Oracle currently lists 10 concurrent Live Transcribe sessions per tenancy, with increases available through support. The documentation advertises results within a few seconds, which does **not** establish the spike's under-one-second goal. Partial/final silence thresholds and stabilization controls apply to the Oracle model; use `ORACLE` for this initial English spike. [Service limits](https://docs.oracle.com/en-us/iaas/Content/speech/using/speech.htm), [Live Transcribe guidance](https://docs.oracle.com/en-us/iaas/Content/speech/using/using-live-transcribe.htm), [parameter reference](https://docs.oracle.com/en-us/iaas/tools/typescript/latest/modules/_aispeech_lib_model_realtime_parameters_.realtimeparameters.html).

Record the following before making the spike decision:

1. Deployed URL, date, browser/device, OCI region/model, configuration, and microphone permission outcome.
2. Actual browser-to-OCI session producing text; retain a sanitized result sample showing token timings, confidence, type, and `isFinal`, with no JWT or audio.
3. A fixed public-domain Chapter Version passage, repeated several times; include continuous speech, a pause over three seconds, a skipped word, and a self-correction.
4. Speech-to-first-visible-partial latency and speech-to-final latency separately. Use synchronized speech-end observations for a few manually marked words, and report sample count plus median, p95, and maximum. A calculation from stream-relative token times requires an observed capture-origin anchor; socket-open/token-received time is not that anchor. Log callback arrival and after-paint time so UI delay remains visible. Mark any timing based on an estimated anchor as an estimate.
5. Verify whether interim word timing/confidence arrives early enough for highlighting. Check final timing consistency across utterances before using `next.startTimeInMs - previous.endTimeInMs` to infer a hesitation.
6. Stop, restart, denied permission, Stop during pending permission, tab navigation, and socket failure release the microphone and do not leave a second session running.

This protocol is proposed spike methodology, not an Oracle guarantee. Report each of the three spike checks as measured pass/fail or unverified. Follow the fallback decision table in `wiki/first-hour-spike.md`; documentation alone cannot justify selecting the production listening engine.

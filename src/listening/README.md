# Listening — R1

An expired authenticated Speech token request (HTTP401) now tells the Reader to sign in again and explicitly preserves silent reading. It never requests the microphone or falls back to mock/browser recognition. Adapter tests also cover denied permission, cleanup, retry on the same source, and connected silence producing only pending words.

Issue #10 provides alignment, Read-aloud Summary helpers, and browser listening adapters behind the existing `ListeningSource` contract. Reading UI wiring, authenticated persistence, and deployed accuracy verification remain separate handoffs below.

## Browser listening interface

```ts
import { createListeningSource } from "@/listening/client";

const source = createListeningSource();
await source.start({ chapterVersionId: version.id, tokens: chunk.tokens }, onEvent);
const fragment = await source.stop(); // Pause: unread words stay pending.
```

`NEXT_PUBLIC_LISTENING_ENGINE` selects `mock` (default), `oci-realtime`, or `web-speech`. Next.js embeds this flag at build time; rebuild when changing it. An explicit `{ engine }` option supports local verification. Invalid flags fail visibly. OCI never silently falls back to browser speech. Browser speech is the ADR-0002 emergency fallback and can send audio to the browser vendor's service; select it explicitly. The factory is a client import; server validation continues to use `@/listening/summary` or the pure barrel.

The OCI adapter requests the existing same-origin `POST /api/speech/token` contract, authenticates over a regional Oracle WebSocket, and streams mono 16 kHz signed 16-bit little-endian PCM in 64 ms frames. Browser AudioWorklet capture avoids the spike SDK package's missing compiled distribution and needs no new root dependency. Microphone audio is never played, persisted, or logged. Noise suppression and echo cancellation are requested, and automatic gain is requested off; constraints are best-effort and do not isolate speakers. HTTPS (or localhost), AudioWorklet support, microphone permission, and a valid token route are required. The adapter refuses an unexpected sample rate instead of sending incorrectly encoded audio. Its Blob worklet requires `blob:` to be allowed if a Content Security Policy is introduced.

Reference protocol: [Oracle realtime browser SDK](https://github.com/oracle/oci-ai-speech-realtime-web-sdk/blob/main/ai-speech-realtime-sdk-web/src/ai-speech-realtime-web-client.ts). Capture uses the [Web Audio platform](https://www.w3.org/TR/webaudio/#AudioWorklet); browser fallback follows [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition). These are wire/platform references, not evidence that this adapter has passed a live test.

Each recognition snapshot replaces the current partial; finalized utterances accumulate. Word events preserve Chapter Version indexes, including `pending` revisions which consumers must use to clear earlier marks. An OCI/browser final utterance alone does not complete a Chunk. Automatic completion requires a finalized hypothesis aligned through the last expected word, then stops capture and emits one `chunk-complete` summary. Pause/Stop returns the latest partial summary with pending suffix words. Repeated Stop returns the same session bounds. New Start cancels the previous session and ignores its late results. Late microphone grants are released after cancellation. Failed starts reject; runtime failures stop capture and emit a safe error. Token, permission, and recognition startup have bounded timeouts; OCI network backpressure and long hypotheses stop the session rather than retain unbounded audio/text.

Limitations: no calibrated hesitation events yet, because OCI word clocks reset and receipt time is not speech timing. Raw word bounds/confidence remain evidence only. No unverified inline custom-vocabulary payload is sent; ADR-0002 vocabulary configuration still needs an available OCI customization. A final skipped/substituted word cannot trigger automatic completion. R2 agreed in request 0010 that Finish chapter stops capture and ends the Chapter with unread tokens pending, just as Pause preserves the unread suffix. Such terminal misses remain unscored until recognition anchors them; no missing word is invented at Finish. Stopping during a pause never manufactures skipped words. Background speech matching the expected text can still advance alignment.

## Alignment interface

```ts
import { alignWords } from "./alignment";

const result = alignWords(chunk.tokens, [
  { text: "my" }, { text: "father" }, { text: "gave" },
], { complete: false });
// result: { wordResults, misses, accuracy }
```

Pass the full current recognition hypothesis for this Chunk on every call. Replace the previous partial hypothesis when the recognizer revises it; appending every partial duplicates words. Exact expected-word matches are preferred, repetitions and extra words can be ignored, and substitutions/skips retain the Chapter Version's token indexes. Self-correction can remove a prior miss when the next snapshot is aligned.

Set `complete: false` during reading **and during Pause/Stop**. Unread suffix words remain pending; unanchored trailing words alone do not force forward progress. Only use `complete: true` for an explicit completed-Chunk evaluation, when unread words should count as skipped. An OCI final utterance is not a completed Chunk. Accuracy always uses the number of expected tokens as its denominator, including pending tokens; it is a 0–1 value, not OCI recognition confidence. Empty expected input yields accuracy 0.

The returned object is an alignment snapshot. Adapters must handle revised/pending outcomes rather than blindly appending it to previously committed results. This slice emits no ListeningEvents and makes no automatic chunk-complete decision.

Optional recognized word evidence is `startMs`, `endMs`, `confidence`, and `clockId`. Raw finite confidence is retained without treating it as pronunciation or accuracy. Invalid/reversed word bounds are omitted. Hesitation is computed from the immediately preceding recognized word, including insertions, only with valid bounds and the same explicitly confirmed `clockId`; missing, changed, or backward clocks yield zero. Extra speech is not silence. Do not set a clock ID for OCI's uncalibrated/resetting timestamps. The live adapter will need its own verified pause timer.

The edit-distance calculation is deterministic and uses O(expected words × recognized words) space and time. Supply bounded reading Chunks. It compares transcript words, so the contract's `mispronounced` outcome is evidence of a substitution, not a phonetic pronunciation assessment. It does not detect speaker identity: background speech matching expected words can still align. The laptop microphone experiment showed competing speech during pauses even with noise suppression on.

## Chapter summaries and route validation

```ts
import { mergeReadAloudSummaries, validateReadAloudSummary, ReadAloudValidationError } from "./summary";

// R2: use all Chapter Version tokens and this attempt's committed stop/completion fragments.
const chapterSummary = mergeReadAloudSummaries(version, fragments);
// No scored words => null; do not POST a zero-accuracy failed start or silent read.

// R6: after authenticating the Reader and authorizing access to the server-loaded version:
const cleanSummary = validateReadAloudSummary(version, await request.json());
// Persist cleanSummary by Reader + Chapter Version. Map ReadAloudValidationError to HTTP 400.
```

`version` needs only `{ id, tokens }`. `mergeReadAloudSummaries` combines typed fragments from one attempt, ordered by the caller. Later outcomes replace earlier ones for an overlapping token; accuracy is recomputed across all Chapter Version tokens, and missing words stay pending. Empty/all-pending fragments are ignored, including failed restarts, so they cannot erase existing scored results. The earliest scored fragment's start and latest end become UTC session bounds. Do not append recognition partials to this list: keep each active fragment's current alignment snapshot, then commit it once on stop/completion. Start a fresh list for a new reading attempt.

`validateReadAloudSummary` accepts an unknown submitted payload and returns a clean, full-version summary. It rejects wrong versions, unknown/duplicate token indexes, malformed outcomes/evidence, negative/nonfinite hesitation, invalid/reversed word bounds, and invalid/ambiguous/reversed session times. Timestamps require an explicit timezone. Client accuracy and missed-word totals are ignored and recomputed from outcomes and server tokens. Unknown fields, including device identifiers or an `audio` property, are stripped. Raw finite recognition confidence is retained without assuming a scale.

A submitted summary without scored words raises `ReadAloudValidationError`. This validation does not authenticate a Reader or independently verify the claimed speech outcomes; R6 owns authorization and persistence. Helpers contain no SQL and do not depend on PostgreSQL or MySQL. R6 accepted route/storage ownership in comms request 0012; the Better Auth session accessor is still pending #7. R4's grading consumption and R2's fragment collection remain in requests 0011/0010.

## Checks and remaining integration

From the repo root:

```powershell
npm.cmd test -- src/listening/alignment.test.ts
npm.cmd test -- src/listening/summary.test.ts
npm.cmd run typecheck
```

Tests cover fluent fixture text, substitutions, skips, repeats, self-correction, revised partials, punctuation/case/contractions, unfinished Chunks, unrelated trailing speech, repeated expected words, empty input, and clock limitations. They do not establish live fluent-reader accuracy ≥90% or deployed listening performance.

Verification on dev base `3f9b8cf`, 2026-10-17: 98 tests pass (18 alignment cases), strict typecheck passes, and the default `npm run build` succeeds with worktree-local lockfile dependencies. Standards and Spec follow-up reviews are clear after fixing extra speech counted as silence and expected curly apostrophes lost by fixture tokenization. Earlier Webpack tracing warnings came from borrowing the parent checkout's dependencies; the local install removes that limitation. No shared build configuration was changed.

Summary-helper follow-up: 129 tests pass (18 alignment and 31 summary/validation cases), typecheck and the default production build pass. Review's impossible-calendar-date finding was reproduced, then fixed with calendar-component checks and valid leap-day/offset coverage; follow-up review is clear. R6 independently confirmed a clean default build, closing comms request 0009 without shared build-config changes.

Comms requests 0010/0011/0012 agree the R2 engine-factory/summary collection handoff, R4 grading consumption, and R6 authenticated persistence route. Shared types and other role folders are unchanged. #5's draft PR #34 contains the standalone OCI experiment and live evidence; its deployed/calibrated verification remains open.

Live-adapter slice verification on dev base `2d52a23`, 2026-10-17: all 158 tests pass (12 adapter/capture cases), typecheck and the default production build pass. A sandbox build left unusable generated CSS-worker output; removing only the worktree-generated `.next` directory and rebuilding outside the sandbox passed without config changes. Ponytail review fixed Stop during callback delivery and reused the PCM DataView per frame. Follow-up Standards review found no actionable issues; Spec review distinguishes the explicit integration/hesitation/vocabulary/terminal-Finish gaps above. Local harness at port 5178 rendered and completed 23 mock words through the factory; real OCI reading remains pending and mock results are not live accuracy evidence.

Live local evidence: the Reader completed the 23-word Gatsby Chunk with OCI at 100% accuracy and automatic Chunk completion, 2026-10-18 02:47 UTC. The visible page showed all 23 correct and capture stopped. See [numeric evidence](evidence/2026-10-17-desktop-oci-reading.json). This is one desktop trial; phone/deployed accuracy, background-speaker isolation, and calibrated hesitation/latency remain unverified. R2 accepted factory/pending-revision/fragment collection ownership in request 0010 and is waiting for the factory to reach dev; no merge has been performed by R1.

Second local trial: the Reader reported completing the requested pause/skip/self-correction protocol and the final OCI result again showed 23/23 correct with automatic completion. See [numeric evidence](evidence/2026-10-17-desktop-oci-pause-correction.json). Only the final state was inspected; intermediate events and exact pause duration were not captured. No further local reading is required before the R2/R6 handoffs.

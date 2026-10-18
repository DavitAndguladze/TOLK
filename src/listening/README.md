# Listening — R1

Issue #10 starts with a pure alignment module. It uses the existing `Token`, `WordResult`, `ReadAloudMiss`, and `ReadAloudSummary` contract from `src/types`. It does not yet replace the mock ListeningSource or save summaries.

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

## Checks and remaining integration

From the repo root:

```powershell
npm.cmd test -- src/listening/alignment.test.ts
npm.cmd run typecheck
```

Tests cover fluent fixture text, substitutions, skips, repeats, self-correction, revised partials, punctuation/case/contractions, unfinished Chunks, unrelated trailing speech, repeated expected words, empty input, and clock limitations. They do not establish live fluent-reader accuracy ≥90% or deployed listening performance.

Verification on dev base `3f9b8cf`, 2026-10-17: 98 tests pass (18 alignment cases), strict typecheck passes, and the default `npm run build` succeeds with worktree-local lockfile dependencies. Standards and Spec follow-up reviews are clear after fixing extra speech counted as silence and expected curly apostrophes lost by fixture tokenization. Earlier Webpack tracing warnings came from borrowing the parent checkout's dependencies; the local install removes that limitation. No shared build configuration was changed.

Comms requests 0010/0011/0012 agree the R2 engine-factory/summary collection handoff, R4 grading consumption, and R6 authenticated persistence route. Shared types and other role folders are unchanged. #5's draft PR #34 contains the standalone OCI experiment and live evidence; its deployed/calibrated verification remains open.

# Why the model fidelity gate keeps failing

Every attempt at the independent model fidelity gate (`createModelFidelityEvaluator` /
`verifyChapterArtifact` in `src/leveling/generator.ts`) has failed so far. Prior research
(`r3-content-integration.md`) attributed this to generation-side problems: the model failing to
*rewrite* a full chapter within budget (timeouts, omitted passages, provider throttling after many
calls). Those are real and separate from this finding.

This is the first time the fidelity gate's **review** step — not the rewrite step — has been
tested in isolation, against an already-finished, heavily human-edited candidate with nothing left
to generate: `docs/research/ch1-l1-review/candidate.json` after slices 1–10 (905 sentences, zero
vocabulary violations, passes `validateChapterVersion`/`validateChapterCheck` for real).

## The test

1. Built a full `ChapterVersion` from the finished candidate and regenerated its Check (same
   process as slice 9), both already confirmed structurally valid.
2. Called `createModelFidelityEvaluator(generateText)` directly — one live OCI Generative AI call,
   bypassing the rewrite step entirely, since there was nothing left to rewrite.
3. It returned in 4.3s: `plotPreserved: false`, `tonePreserved: false`, `checkAnswerable: true`,
   `reinforcementAppropriate: true`. `verifyChapterArtifact` correctly rejected it.
4. The JSON schema the gate requires (`FidelityReview`) has no field for *why* — only the four
   booleans plus citation arrays. So a second, free-text call was made asking the same model to
   explain its own `false` verdicts, quoting exact sentences.

## What it actually said

Asked to explain, the model's objections were almost entirely about things the simplification is
*supposed* to do, not actual errors:

- Gatsby's mansion losing "a **factual imitation** of... spanking new" → "It was an imitation of a
  government building... very new" — the model's own words: "the simplification is consistent with
  Level 1," then marks it a defect anyway.
- Daisy's voice ("an arrangement of notes that will never be played again") simplified to "it was
  like new music. You would never hear this music again" — objected to losing "poetic and musical
  quality," which is an inherent, unavoidable cost of any Level 1 rewrite of that sentence.
- Tom's "Nordic race" monologue losing some of its "condescending and racist tone" while — the
  model's own words — "still convey[ing] the same general idea."
- One apparent citation problem, separate from the above: in the first (JSON) call, the evidence
  quote for `gatsby-ch1-kp2` was far closer to the *original* sentence's wording than to what's
  actually at that served sentence index in our candidate — i.e. the model's cited "served quote"
  didn't reliably match the served text being graded. Not confirmed as a systematic bug from a
  single sample, but worth flagging for anyone debugging a future rejection: don't trust a citation
  at face value, check it against the real `sentences[index].text`.

## The actual root cause

The gate's own prompt tells the model: *"distinguish an actual dropped/changed fact or
relationship from simply 'the prose is simpler and less ornate than the original,' since the
latter is expected and required at Level 1, not a defect."* The model is given the Chapter
Version's `level` in its input. But in practice, across every example it gave, it still flagged
expected, inherent simplification loss (nuance, irony, poetic imagery, subtlety) as grounds for
`tonePreserved: false` and `plotPreserved: false` — explicitly acknowledging in its own explanation
that the loss was "consistent with Level 1" and then rejecting anyway.

This means the gate, as currently prompted, may be close to **structurally unpassable at low
Levels** — not because any particular candidate is unfaithful, but because going from Fitzgerald's
prose to Level 1 prose *always* loses the kind of nuance the model is told to police. A candidate
would have to retain enough of the original's "tone" to satisfy the reviewer while still meeting
Level 1's 10-word/simple-vocabulary limits — two goals that may be close to mutually exclusive for
Level 1 specifically, regardless of how carefully the rewrite is edited. Nobody has fixed this
because nobody had isolated the review call from the generation failures before.

## A prompt rewrite was tried, live, and reverted — this is the important part

Rewrote `createModelFidelityEvaluator`'s prompt (`src/leveling/generator.ts`) to explicitly tell
the model that stripping ornamentation for Level 1 is required and not a defect, with concrete
examples of what should and shouldn't fail `tonePreserved`/`plotPreserved`, plus a `reasoning`
field so a verdict's cause is visible without a second call.

**It worked, almost too well:** three live calls in a row against the finished candidate returned
`plotPreserved: true`, `tonePreserved: true`, and `verifyChapterArtifact` genuinely passed — the
first pass in this whole project's history.

**Then a control test exposed a real regression.** To check the rewritten prompt hadn't just
become a rubber stamp, one Key Point's served text was deliberately broken — "Tom has **another**
woman in New York" flipped to "Tom has **no other** woman in New York," a one-word negation that
completely reverses a plot fact the Chapter Check depends on (`gatsby-ch1-kp4`). The rewritten
prompt **missed it entirely**: `plotPreserved: true`, no objection raised, `reasoning: []`.

Run as a fair A/B: the **original, unmodified prompt**, given the exact same planted error,
**caught it** (`plotPreserved: false`, `tonePreserved: false`, `checkAnswerable: false`). So the
relaxation that fixed the false-positive problem also introduced a false negative on a real,
serious error — a straight regression, not a tradeoff worth taking for a safety gate.

A second prompt revision tried to fix this by explicitly calling out negation/polarity flips as
always-disqualifying, regardless of Level. Tested again on the same broken input: it did return
`plotPreserved: false` this time, but its own cited reasoning never mentioned the actual planted
error at all — it flagged three *other*, unrelated sentences for the same kind of harmless
stylistic nitpicking the first rewrite was meant to eliminate (dropped quotation marks, "my story
started" vs. "the history of the summer begins"). Getting the right boolean for the wrong reason
isn't something to trust; it suggests the model isn't reliably doing an exhaustive, sentence-level
comparison across a ~900-sentence candidate in one pass, no matter how the prompt is worded.

**The `generator.ts` prompt change was reverted.** Nothing from this experiment is shipped —
`dev`'s fidelity-gate prompt is unchanged. The one durable, low-risk improvement worth keeping is
the lesson in this doc and the `reasoning` field idea (schema-only, not yet applied), not the
specific wording tried here.

## What this means for #6

This candidate's content quality is still not the blocker. But the fix isn't a quick prompt edit
either — the evidence now points at a deeper issue: a single holistic review call may not reliably
catch small, serious errors in a long chapter, and loosening it to stop false-positiving on style
risks false-negativing on substance. Two honest paths forward, neither decided here:

1. **A structurally different fidelity check** — e.g. one call per Key Point/sentence-group instead
   of one call for the whole chapter, so the model has less to track per call and a planted error
   has nowhere to hide among hundreds of other sentences. Untested; would need its own live
   experiment before trusting it.
2. **Accept that Level 1 can't reliably pass an LLM-based fidelity gate** and treat structural
   validation plus careful, independent human/agent review (what slices 1–10 already did, and what
   caught this project's actual errors so far) as the real acceptance bar for Level 1, reserving
   the model gate for Levels closer to the original where tone has more room to survive.

This is a product and architecture decision, not something to patch with another prompt tweak
and hope.

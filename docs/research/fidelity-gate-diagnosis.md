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

## What this means for #6

This candidate's content quality is not the blocker — the gate's calibration for Level 1 is. Two
honest paths forward, neither of which this session has decided unilaterally:

1. **Tighten the gate's prompt** to explicitly separate "inherent, unavoidable Level 1 compression"
   from "an actual changed fact, relationship, or name" and ask it to only fail on the latter — then
   re-test against this same candidate to see if a calibration fix is enough.
2. **Accept that Level 1 can't pass an unmodified fidelity gate** and treat structural validation
   plus careful human/independent review (what slices 1–10 already did) as the real acceptance bar
   for Level 1 specifically, reserving the model fidelity gate for higher Levels where more of the
   original's tone can coexist with the simplification.

This is a product decision, not a coding one — surfacing it, not deciding it.

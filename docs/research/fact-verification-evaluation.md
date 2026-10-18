# Fact-level fidelity verification: Phase 1 prototype and evaluation

**Status: prototype and evaluation only. Not integrated into `src/leveling/generator.ts` or any
production pipeline.** This follows up `fidelity-gate-diagnosis.md` (which found the whole-chapter
AI fidelity gate unreliable in both directions) and tests a user-proposed evidence-based,
fact-level verification design against a real, controlled, labeled dataset.

## What was built

`src/leveling/fact-verification.ts` (tests: `fact-verification.test.ts`, 27 passing, no network
calls):

- `Fact` / `FactVerification`: structured evidence, not a bare boolean - every check returns the
  original passage, served passage, a required explanation, and one of four verdicts
  (`preserved`, `changed`, `missing`, `uncertain`), never just true/false.
- `buildFactVerificationPrompt`: pure prompt builder, one fact at a time, ~3 sentences of context
  (the window size validated in the prior diagnosis), with a `verdictFirst` option controlling
  whether the requested JSON asks for the verdict before or after the explanation.
- `isSelfContradictory`: pure, best-effort detector. Looks at the explanation's final sentence for
  cues that contradict the stated verdict - built directly from the real failure case observed
  earlier ("...so upon closer inspection, it is actually preserved" attached to a non-preserved
  verdict). Documented limitation: an explanation with no clear concluding cue either way is never
  flagged, even if it's inconsistent elsewhere. This is a heuristic, not a proof.
- `resolveStrategyA` / `resolveStrategyB`: pure consensus logic, fully unit-tested with no AI call.
  - **Strategy A**: always run 3 independent checks; unanimous, non-contradictory agreement only.
  - **Strategy B**: run 1 check; escalate to up to 2 more only if the running result is `uncertain`
    or self-contradictory; resolve by majority after 3 if still unresolved.
- `verifyFactStrategyA` / `verifyFactStrategyB`: the orchestration, calling a supplied
  `TextGenerator` (same interface used throughout `src/leveling`). A failed or malformed response
  becomes `uncertain`, never a thrown error and never a silent wrong answer.

`scripts/evaluate-fact-verification.mjs` is the real-model evaluation harness (not part of
`npm test` - makes live OCI calls deliberately, same pattern as `scripts/ingest-gatsby.mjs`).

## The labeled dataset

20 facts, each a real ~3-sentence window from the finished Chapter 1 candidate
(`docs/research/ch1-l1-review/candidate.json`), scoped to the offline chapter-prep context only:

- **5 real Key Points**, unmodified, exact curated text.
- **5 "ordinary" correct passages**, deliberately *not* tied to any curated Key Point, each with a
  claim written for this evaluation (not pre-verified the way the 5 Key Points are) - this
  measures the false-alarm rate on content the fact set wasn't designed around.
- **10 deliberately broken facts**, each a real edit of a real window, spanning distinct error
  types per the brief: 2 negation flips, 1 person swap, 1 descriptor flip (less/more fashionable),
  2 dropped events, 2 invented details (added content not in the original at all), 2 location
  swaps. Every fixture is checked at build time to confirm it actually differs from the real
  served text (a fixture that silently failed to apply its edit would invalidate the result).

## Real-model results (94 live OCI calls total; nothing mocked below)

**Miss rate (broken facts, n=10): 0/10 for both strategies.** Every error type planted was caught
by both strategies - negation, person swap, descriptor flip, dropped event, invented detail,
location swap. This is a materially stronger result than the single negation-flip test in the
prior diagnosis: 10 different error types, zero misses, by either strategy.

**False-alarm rate (good facts, n=10): 4/10 wrong for both strategies**, but not uniformly "wrong"
in the same way:
- 2/10 (`kp3-good`, `ordinary-349`) were wrongly marked `changed` outright, no contradiction
  detected. `kp3-good`'s objection ("the Buchanans" vs "the Tom Buchanans") matches a real,
  previously-documented borderline finding from the manual review (slice 8) - debatable, not
  clearly wrong.
- 2/10 (`kp4-good`, `ordinary-199`) were marked `uncertain`, each with the self-contradiction
  detector firing on most or all of the underlying calls (3/3 and 2/3 respectively) - the safety
  mechanism working as designed, converting a likely-unreliable confident answer into "needs a
  human look" rather than silently approving or wrongly rejecting.
- Caveat on the 2 "ordinary" wrong results: those claims were written quickly for this evaluation,
  not independently verified the way the 5 real Key Points were. Some of that disagreement may be
  imprecise claim wording on this evaluation's part, not purely a model failure - noted honestly,
  not papered over.

**Strategy A vs. Strategy B: identical accuracy, Strategy B at 40% of the cost.** Both strategies
produced the *exact same verdict* on all 20 facts - same 0/10 misses, same 4/10 good-set
disagreements. Strategy A always spends 3 calls/fact (60 calls for 20 facts); Strategy B spent 24
calls for the same 20 facts (14 on the good set, where 2 facts escalated to 3 calls each; 10 on
the broken set, where every fact resolved cleanly on the first call). In this sample, Strategy B's
escalate-only-when-suspicious design cost less and lost nothing.

**Field-order experiment (5 facts, 10 calls, separate from the above): inconclusive.** One fact
(`broken-invented-1`, the planted invented detail) flipped from correctly caught (`changed`) with
verdict-first to missed (`preserved`) with explanation-first - the one clean, suggestive result for
asking the model to commit to a verdict before writing its justification. But the
self-contradiction rate didn't consistently favor either ordering across the other 4 facts (2
favored explanation-first, 1 favored verdict-first), and one fact (`ordinary-199`) gave a
*different* verdict on a repeat call than it gave in the main run under the identical
`verdictFirst: true` setting - confirming the model's own run-to-run noise is large enough that 5
facts is not enough to draw a confident conclusion about field ordering specifically. `verdictFirst`
defaults to `true` in the shipped module on the strength of the one supportive data point, but this
is a weak basis, stated honestly rather than oversold.

**Cost and latency.** 94 real calls total across both experiments, no throttling encountered (calls
were naturally spaced by their own ~0.4-2.5s latency, well under the previously-documented
35-calls/41.8s throttling threshold). Per-fact latency for Strategy A (3 parallel calls) and
Strategy B (usually 1 call) was similar in practice, ~0.5-1s typical, because Strategy A's 3 checks
run concurrently rather than one after another.

## The finding that matters most: coverage, not accuracy

The 5 Key Points' ±3-sentence windows cover **18 of this chapter's 362 source sentences - 5.0%**.
The other 344 sentences (95.0%) are structurally unreachable by this method, no matter how
reliable the per-fact check becomes. This is arithmetic, not an experiment: a fact-level checker
scoped to the curated Key Points can only ever check Key Points, by construction.

This directly explains why fact-level verification cannot replace the manual, sentence-by-sentence
review that has actually caught every real error in this project's history: a pronoun swap ("her"
love instead of "their" love) at source index 101, a missing complex-word entry that crashed live
grading, a dropped "riotous"/"domesticated" image, a rent-vs-price meaning change - **none of these
sit inside any of the 5 Key Points' windows**, so a Key-Point-scoped checker, however accurate,
would have approved the chapter with all of them still in it.

Automatic fact extraction (identifying checkable facts beyond the 5 curated Key Points) was
explicitly out of scope for this phase, per direction - the dataset's "ordinary" passages prove the
coverage gap exists, not that extraction is safe to add next. Expanding the fact set is a larger,
separate risk: it adds a new AI step (deciding what counts as a fact) that nothing else in this
pipeline currently checks.

## Recommendation

- **Strategy B over Strategy A** for cost, given identical measured accuracy on this dataset:
  escalate only when the first check is already suspicious.
- **Route every non-`preserved` verdict to a human**, not an automatic hard rejection and not a
  silent pass - the false-alarm rate (40% of good facts not cleanly approved, though half of those
  were safely caught by the contradiction detector rather than confidently wrong) makes an
  unattended automatic gate premature, but a human-reviewed signal is a genuine improvement over
  reading every sentence cold.
- **Do not present this as a replacement for full-chapter manual review.** At 5% structural
  coverage, it is a second check on 5 specific claims, not a fidelity gate for the chapter. If the
  goal is to reduce manual review labor, the honest next question is whether an automatically
  *extracted* (not just curated) fact set could raise that 5% coverage - a materially different and
  riskier piece of work than what was evaluated here, not yet attempted.
- **Before trusting this on a second chapter**, repeat the dataset-and-evaluation process (not just
  the model, the *dataset*) against an independently-built labeled set of ≥100 examples across
  error types, per the original request - 20 facts is enough to find the result above, not enough
  to certify a production accuracy rate.

Reproduce with: `node --env-file-if-exists=.env.local scripts/evaluate-fact-verification.mjs`
(makes ~84 live OCI calls; the field-order comparison is a separate, smaller ad hoc script not
checked in, reproducible from this doc's description).

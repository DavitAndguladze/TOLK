# Chapter 1 editorial review packet — not approved

This packet is for R1's offered fidelity review on comms 0034. It is not a seed, ready Chapter Version, or production import. The product owner approved faithful natural prose with individually documented vocabulary exceptions on 2026-10-18.

- `candidate.json`: full L1 draft with global zero-based source sentence mappings. Sixty-six previously documented loss rows were repaired in the initial packet; further repairs are listed by source index in the overnight slices below. The input includes earlier model drafts with editorial repairs, not a newly successful automatic rewrite. The entire draft still needs independent review.
- `exceptions.json`: 333 exact source-word forms with sentence index, quote and reason. These are proposals whose semantic justification must be reviewed, not a blanket source-vocabulary waiver.
- `check.json`: historical OCI-generated Check for the candidate at `01e4b65`, bound to that attempt's temporary shared identity. Its served sentence indexes are stale after the new edits. Review question answerability against mapped prose and regenerate all Check evidence before acceptance; do not import this Check separately.
- Original Chapter and source-cited metadata: `src/data/gatsby/content.json`, Chapter 1. Use `splitOriginalSentences` from `src/leveling/content.ts` for source indexes; Gutenberg divider lines are excluded.

## Observed evidence

The current candidate covers all 362 source indexes in order, with 900 served sentences and at most 10 whitespace-separated words each. It passes the current structural/vocabulary/source-attestation checks, which explicitly report that semantic review is required. This diagnostic omits Key Points so it cannot establish their coverage or full acceptance. No OCI call was made for the overnight edits.

The initial packet had 894 served sentences and 299 exceptions. Two actual OCI Check/fidelity attempts completed in 13.1 seconds on that earlier candidate; neither passed the separate fidelity gate, so no ready artifact was emitted. The following model observations refer to that earlier candidate and its sentence indexes.

The raw model's diagnostic explanation was unreliable. It reported omissions already present in adjacent short sentences: father's advantages at served 3–4, Nick knowing Tom in college at 183–184, and the dock at 890–891. It also criticized a nonexistent symbolism question; the actual question asks what Nick saw across the water.

A separate diagnostic grouped all served sentences sharing each original sentence. That reviewer marked plot and question answerability true, but tone false and supplied only one of five required Key Point citations. This is still a rejection, not approval. Production gates were not weakened or changed to accept it.

## Requested review

Read each mapped group as a whole. Identify concrete changed facts, relationships, implications or character attitude; distinguish those from the intended L1 sentence/vocabulary simplification. Check all five actual questions, allowing for the stale served indexes. Review whether the 333 exceptions are necessary and explained, and note awkward dialogue or imagery. Reply with source index, served sentence/quote, issue and suggested repair on comms 0034.

Do not mark the packet ready or load it into the database. The full 13-artifact seed and R6's immutable full-content namespace decision remain outstanding.

## Overnight slice 1 — 2026-10-18

Compared mapped groups for source indexes 0–19 and repaired five concrete meaning problems:

- 5: feigned sleep is acting asleep, not wanting to sleep; restored the mocking response.
- 14: restored the harmful dust following Gatsby's dreams, rather than blaming his wishes, and Nick's temporary response to other men's sorrows and joy.
- 15: restored the exact three-generation duration and comfortable wealth; removed the expanded family history.
- 16: restored the founder's exact relationship and the substitute serving in his place; removed an unsupported assertion of payment.
- 17: restored the painted portrait's location in Nick's father's office; it does not show the great-uncle at work.

Fifteen individually justified source-word exceptions were added. Source indexes 6, 8, 9, 10, 12, 13, 18 and 19 still need attention to imagery or attitude. Comparing the opening range is not approval of that range. The next bounded comparison is 20–39; unresolved opening issues remain on the repair list. No production seed, validation policy or application code changed.

## Overnight slice 2 — 2026-10-18

Compared source 20–39 and repaired 20, 22, 24, 25, 26, 28, 29, 32, 34, 35, 37, 38 and 39. Restored the centre-of-the-world contrast, commuting town, weather-beaten cardboard bungalow, Finnish wisdom, village destination and helpless delivery, pathfinder/settler distinction, fast-film comparison, potential health from the air, additional books, ironic well-rounded specialist and single-window image. Removed unsupported claims about wind breaking the house and a broadly educated person knowing little about every subject.

Also revisited 6, 8 and 9: restored unending hope, Nick's self-undercutting boast of tolerance, and the rock/marsh foundation imagery instead of judging people's motives good or bad. Nineteen individually justified source-word exceptions were added across these repairs. The combined structural check passes with 900 served sentences, all 362 source indexes and 333 proposed exceptions. No model call or application-code change was needed.

Still unresolved: imagery/attitude at 10, 12, 13, 18 and 19, plus the neighbourhood-freedom metaphor at 33. The next bounded comparison is 40–59. This is editorial progress, not independent semantic acceptance; Key Points and the updated Check still require validation.

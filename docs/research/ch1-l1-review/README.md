# Chapter 1 editorial review packet — not approved

This packet is for R1's offered fidelity review on comms 0034. It is not a seed, ready Chapter Version, or production import. The product owner approved faithful natural prose with individually documented vocabulary exceptions on 2026-10-18.

- `candidate.json`: full L1 draft with global zero-based source sentence mappings. Sixty-six previously documented loss rows were repaired; the other 296 source rows retain prior editorial prose and need review. The input includes earlier model drafts with editorial repairs, not a newly successful automatic rewrite.
- `exceptions.json`: 299 exact source-word forms with sentence index, quote and reason. These are proposals whose semantic justification must be reviewed, not a blanket source-vocabulary waiver.
- `check.json`: actual OCI-generated Check from the last validation attempt, bound to that attempt's temporary shared identity. Review question answerability against the draft; do not import this Check separately.
- Original Chapter and source-cited metadata: `src/data/gatsby/content.json`, Chapter 1. Use `splitOriginalSentences` from `src/leveling/content.ts` for source indexes; Gutenberg divider lines are excluded.

## Observed evidence

The candidate covers all 362 source indexes in order, with 894 served sentences and at most 10 whitespace-separated words each. It passed the current passage structural/vocabulary/source-attestation gates. Two actual OCI Check/fidelity attempts completed in 13.1 seconds; neither passed the separate fidelity gate, so no ready artifact was emitted.

The raw model's diagnostic explanation was unreliable. It reported omissions already present in adjacent short sentences: father's advantages at served 3–4, Nick knowing Tom in college at 183–184, and the dock at 890–891. It also criticized a nonexistent symbolism question; the actual question asks what Nick saw across the water.

A separate diagnostic grouped all served sentences sharing each original sentence. That reviewer marked plot and question answerability true, but tone false and supplied only one of five required Key Point citations. This is still a rejection, not approval. Production gates were not weakened or changed to accept it.

## Requested review

Read each mapped group as a whole. Identify concrete changed facts, relationships, implications or character attitude; distinguish those from the intended L1 sentence/vocabulary simplification. Check all five actual questions. Review whether the 299 exceptions are necessary and explained, and note awkward dialogue or imagery. Reply with source index, served sentence/quote, issue and suggested repair on comms 0034.

Do not mark the packet ready or load it into the database. The full 13-artifact seed and R6's immutable full-content namespace decision remain outstanding.

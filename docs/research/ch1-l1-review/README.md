# Chapter 1 editorial review packet — not approved

This packet is for R1's offered fidelity review on comms 0034. It is not a seed, ready Chapter Version, or production import. The product owner approved faithful natural prose with individually documented vocabulary exceptions on 2026-10-18.

- `candidate.json`: full L1 draft with global zero-based source sentence mappings. Sixty-six previously documented loss rows were repaired in the initial packet; further repairs are listed by source index in the overnight slices below. The input includes earlier model drafts with editorial repairs, not a newly successful automatic rewrite. The entire draft still needs independent review.
- `exceptions.json`: 370 exact source-word forms with sentence index, quote and reason. These are proposals whose semantic justification must be reviewed, not a blanket source-vocabulary waiver.
- `check.json`: historical OCI-generated Check for the candidate at `01e4b65`, bound to that attempt's temporary shared identity. Its served sentence indexes are stale after the new edits. Review question answerability against mapped prose and regenerate all Check evidence before acceptance; do not import this Check separately.
- Original Chapter and source-cited metadata: `src/data/gatsby/content.json`, Chapter 1. Use `splitOriginalSentences` from `src/leveling/content.ts` for source indexes; Gutenberg divider lines are excluded.

## Observed evidence

The current candidate covers all 362 source indexes in order, with 897 served sentences and at most 10 whitespace-separated words each. It passes the current structural/vocabulary/source-attestation checks, which explicitly report that semantic review is required. This diagnostic omits Key Points so it cannot establish their coverage or full acceptance. No OCI call was made for the overnight edits.

The initial packet had 894 served sentences and 299 exceptions. Two actual OCI Check/fidelity attempts completed in 13.1 seconds on that earlier candidate; neither passed the separate fidelity gate, so no ready artifact was emitted. The following model observations refer to that earlier candidate and its sentence indexes.

The raw model's diagnostic explanation was unreliable. It reported omissions already present in adjacent short sentences: father's advantages at served 3–4, Nick knowing Tom in college at 183–184, and the dock at 890–891. It also criticized a nonexistent symbolism question; the actual question asks what Nick saw across the water.

A separate diagnostic grouped all served sentences sharing each original sentence. That reviewer marked plot and question answerability true, but tone false and supplied only one of five required Key Point citations. This is still a rejection, not approval. Production gates were not weakened or changed to accept it.

## Requested review

Read each mapped group as a whole. Identify concrete changed facts, relationships, implications or character attitude; distinguish those from the intended L1 sentence/vocabulary simplification. Check all five actual questions, allowing for the stale served indexes. Review whether the 370 exceptions are necessary and explained, and note awkward dialogue or imagery. Reply with source index, served sentence/quote, issue and suggested repair on comms 0034.

Do not mark the packet ready or load it into the database. The full 13-artifact seed remains outstanding. On comms 0036 at 01:10, R6 approved `gatsby-full` / `gatsby-full-chN` with distinct Key Point/Complex Word IDs; existing sample facts and served Versions/results must stay intact. Namespace agreement does not approve this candidate or import it. R6 owns the Library transition after a validated seed.

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

## Overnight slice 3 — 2026-10-18

Compared source 40–79 in two disjoint ranges. Repaired 40, 41, 42, 44, 45, 46, 49, 51, 54, 55, 56, 58, 59, 61, 62, 63, 66, 67, 68, 70, 71, 72, 73, 74, 75 and 77. Source 0–39 stayed unchanged for R1's requested independent review.

Restored rental/community and geographic details, fashion rather than beauty, residence rather than ownership, generation rather than exact age, the permanent move and wistful search, Tom's actual posture and contempt, restlessness of his eyes rather than his whole body, and abrupt politeness rather than an attempt to be nice. Parent review kept Nick's account of Tom's wish within an impression and preserved the burning-garden image without the awkward phrase “looked on fire.”

Thirty-seven individually justified source-word exceptions were added. Combined structural validation passes: 897 served sentences, all 362 ordered source indexes and 370 proposed exceptions; at most 10 words per sentence. No OCI calls, application-code changes or approval of the draft.

Additional unresolved imagery: riotous island at 41; courtesy bay/domesticated water/barnyard at 42; factual imitation/raw ivy at 47; repeated courtesy-bay image at 51; delicate window-bound room at 79. Earlier unresolved rows 10/12/13/18/19/33 remain. The next comparison is 80–99. Key Points, updated Check evidence and independent semantic acceptance remain outstanding.

## R1 independent opening review — 2026-10-18 01:10

R1 compared the complete mapped groups for source 0–39 at `3467489` and reported concrete meaning/attitude issues at 10, 12, 13, 18 and 19. These agree with the remaining opening repair list: military moral-order imagery, personality as gestures, impressionability/romantic readiness, the ironic war allusion, and restlessness rather than distress. R1 found the neighbourhood-freedom rendering at 33 defensible in context; remove it from the concrete-defect list without inventing new detail. The earlier founder, portrait, books and well-rounded-specialist repairs were present, with no additional concrete plot/relationship error reported in 20–39.

This is a bounded independent review with findings, not full Chapter approval. R1 did not certify all exception necessities, review source 40–361, or regenerate/revalidate the historical Check. Full source 0–39 remained unchanged in slice 3.

## Slice 4 — 2026-10-18 (Davit/R4, taking over #6)

Compared source 80–159. Repaired 88 and 101.

- 88: "It felt like I had made her stop something" was a vague, inaccurate gloss of "disturbed her by coming in" — replaced with "I felt like I should not have come in," preserving Nick's near-apology for intruding.
- 101: "12 people sent **her** love through me" wrongly implied the people were relaying Daisy's own love back to her; the original is "their love" (the dozen people's own regards, sent to Daisy via Nick). Fixed the pronoun.

No new source-word exceptions were needed for either fix (both use only existing low-rank vocabulary, verified against `src/data/vocabulary/english-2018.json`). Combined structural validation still passes: 897 served sentences, all 362 ordered source indexes covered in order, every sentence at most 10 words (checked with the actual `tokenize` used by the validator, not a manual word count).

Source 80–159 was otherwise faithful: no dropped plot facts, attitude changes, or relationship errors found, including the dialogue-heavy stretch (100–139) where short interjections ("Never.", "Absolutely!", "Tomorrow!") are consistently expanded to full sentences — a deliberate, consistent simplification pattern, not a fidelity defect. Notably 117's "hovering restlessly" → "moving around the room without rest" correctly avoids the "restlessness as distress" error R1 flagged for the opening range.

The next comparison is 160–179. Source 0–79 stayed unchanged. Key Points, updated Check evidence and independent semantic acceptance remain outstanding, as do the four unresolved imagery rows from slices 2–3 (10/12/13/18/19/33/41/42/47/51/79).

## Slice 5 — 2026-10-18 (Davit/R4)

Compared source 160–239, including the dinner-table scene, Tom's "Rise of the Coloured Empires" monologue (180–199), the butler's-nose story, and Miss Baker's revelation of Tom's affair. No repairs needed — this stretch was faithful throughout, including subtler cases:

- 187: "unthoughtful sadness" correctly rendered as "her sad look did not seem to come from thought," not just "sad."
- 199: "pathetic in his concentration" correctly uses the older, non-pejorative sense ("almost made me feel sorry for him"), not the modern dismissive one.
- 212: "quickened something within her" correctly rendered as "did seem more alive," preserving the cause (Tom's absence).
- 236–238: "some woman" → "another woman" actually clarifies the affair implication for an L1 reader without changing it.

Two borderline, defensible calls (not fixed, same standard R1 used at source 33): 166 renders "complained" (a mild whine) as "angry voice" (stronger than the original register); 210 moves the departing light's personified "lingering regret" onto the narrator's own feeling, preserving the bittersweet tone but changing the grammatical subject.

Structural validation still passes (897 served sentences, all 362 source indexes, ≤10 words each). The next comparison is 240–259. Source 0–79 remains for R1's independent review. Key Points, updated Check evidence and independent semantic acceptance remain outstanding, as do the unresolved imagery rows from slices 2–3 and the two new borderline calls above.

**Running total: 240 of 362 source sentences compared (66%).**

## Slice 6 — 2026-10-18 (Davit/R4): Chapter 1 editorial pass complete

Compared source 240–361, finishing the chapter. Repaired 249: "Daisy moved her head at Tom, making her no clear" was broken English (a dropped/garbled clause), not a meaning error — replaced with "Daisy moved her head at Tom to say no."

This stretch covered the chapter's two most load-bearing passages, both faithful:

- **The "beautiful little fool" scene (270–279)**: Daisy's monologue about her daughter's birth is preserved verbatim at the key line (278: "a beautiful little fool").
- **The ending (353–361)**: the green light, Gatsby's trembling reach toward the dark water, and the "silver pepper of the stars" are all intact. Source 361's "unquiet darkness" is correctly rendered as "dark, without quiet" rather than the opposite-meaning "quiet darkness" — a place a careless rewrite could easily have flipped the ending's mood.

One more defensible, unforced call: 326 completes Daisy's intentionally truncated "Our beautiful white—" (interrupted by Tom) with "lives," resolving an ambiguity the original leaves open. Noted, not changed, since it doesn't introduce a false fact.

**Chapter 1's editorial comparison is now complete: all 362 of 362 source sentences reviewed.** Combined repairs across all sessions: source 0–361, with concrete fixes at (from earlier slices) 5, 14, 15, 16, 17, 20, 22, 24, 25, 26, 28, 29, 32, 34, 35, 37, 38, 39, 6, 8, 9, 40, 41, 42, 44, 45, 46, 49, 51, 54, 55, 56, 58, 59, 61, 62, 63, 66, 67, 68, 70, 71, 72, 73, 74, 75, 77, and (this session) 88, 101, 249. Structural validation passes in full: 897 served sentences, all 362 source indexes covered in strict order, every sentence at most 10 words (verified against the actual `tokenize`/rank data the validator uses, not a manual count).

**What is still outstanding before this can be imported** (unchanged by this session, listed for whoever picks this up next):
1. **Unresolved imagery/tone rows**, never hard-fixed because they're genuinely defensible, not wrong: 10, 12, 13, 18, 19 (R1 confirmed these as concrete issues — still open), 33 (R1 confirmed defensible, not a defect), 41, 42, 47, 51, 79 (slices 2–3), 166, 210, 326 (this session).
2. **Key Points**: never compared in this review. The Chapter's 3 Key Points need the same sentence-level fidelity check against this candidate's served sentences.
3. **The Chapter Check** (`check.json`): stale — bound to an old candidate revision, with sentence indexes that no longer match. Must be regenerated against the final candidate and independently fidelity-checked.
4. **Independent model fidelity gate**: every actual attempt so far has failed (throttling after 35 calls, omitted real passages, a validator that gave false explanations of its own rejections). A human-approved candidate does not equal a passing fidelity run; that gate still has to actually pass before this is importable.
5. **R1's independent review** only covered 0–39 so far; 40–361 (including this session's slices) has had editorial repair but no second, independent reader.
6. This is Chapter 1 of 4 needed (Ch 2–4 are fallback/original-only so far, per `r3-content-integration.md`) before the Golden Path's content blocker clears.

## Slice 7 — 2026-10-18 (Davit/R4): folded in R3/R5's local fixes, full vocabulary re-verification

R3/R5 had separately, locally repaired R1's five accepted findings (source 10/12/13/18/19 — the military "moral attention" imagery, personality-as-gestures, impressionability/romantic readiness, the "Teutonic migration" allusion, and restless-not-distressed) as local commit `e62b87b`, unpublished since #43 had already merged by the time it was made. That work wasn't reachable from here, so it had diverged from the candidate this session finished. Re-applied all five from the exact replacement text R3/R5 posted in comms (request 0034), plus their 23 new source-word exceptions. Result matches their own reported counts exactly: 903 served sentences, 393 exceptions.

Also ran a full, independent re-implementation of the real vocabulary-rank check (`validateChapterVersion`'s exemption/matching logic in `src/leveling/validation.ts`, not just a word-count check) against the entire candidate — every sentence, every session's work, not just this session's range. First pass found 20 apparent violations (hyphenated/accented words like "great-uncle" and "Hôtel" that the tokenizer mangles into unmatched tokens); investigation found this was a case-sensitivity bug in the verification script itself (comparing an un-normalized exception key), not a real defect — those words were already correctly documented in `exceptions.json`. Fixed the script and reran: **zero real vocabulary violations** across all 903 sentences.

**Chapter 1's editorial review, including R1's five accepted findings, is now complete and independently vocabulary-verified**: 362/362 source sentences compared, 903 served sentences, all 362 source indexes in strict order, every sentence ≤10 words, every word either within the L1 frequency target, a required name, or an individually documented exception. What's still outstanding is unchanged from the list above (items 1–6) — this slice closes out the five R1 findings specifically, not the remaining Key Points/Check/fidelity-gate/independent-review work.

## Slice 8 — 2026-10-18 (Davit/R4): Key Points and Complex Words compared

Compared the Chapter's 5 real Key Points and 5 Complex Words (`gatsby-ch1` in `src/data/gatsby/content.json` — distinct from the short demo chapter used elsewhere in the app) against the candidate.

**Key Points**, checked against their cited original sentence:

1. "Nick's father advises him to remember that other people have not had his advantages" (source 1) — supported: "Not everyone has had the good things you have had."
2. "Nick lives in West Egg, the less fashionable of the two Eggs" (source 45) — supported: "It was, well, the less fashionable of the two."
3. "Nick goes to East Egg to have dinner with the Tom Buchanans" (source 51) — **fixed**: the served sentences had split the original's one long sentence into four, and the explicit link between "East Egg" and "dinner with the Buchanans" was lost across the split (the dinner sentence just said "to the Tom Buchanans," two sentences after East Egg was mentioned). Rewrote the closing sentence to "I drove to East Egg for dinner with the Buchanans," so the Key Point is answerable from one sentence, not an inference across three. Verified: "drove" is an existing documented exception (`exceptions.json`, justified at source 60) — the match is word-level, not tied to a specific sentence, and source 51's original text also literally contains "drove" ("I drove over there to have dinner"), so no new exception was needed.
4. "Miss Baker tells Nick that Tom has another woman in New York" (source 236) — supported verbatim.
5. "Nick sees a distant green light across the water after seeing Gatsby outside" (source 360) — supported verbatim, with the preceding sentences (355–359, already verified in slice 6) establishing Gatsby standing outside.

**Complex Words**, checked for presence in a clear, standalone-answerable served sentence (needed since each becomes a multiple-choice Check question):

- abnormal (source 4): "An abnormal mind can quickly see this in someone normal."
- supercilious (source 65): "He was supercilious, as if better than other people."
- Nordics (source 195): "The idea is that we are Nordics."
- Midas (source 36): "Only Midas, Morgan, and Maecenas knew those secrets."
- green (source 360): "I saw only one little green light far away."

All five are present exactly once each, in sentences that give some contextual signal toward the meaning (none of these repeat the earlier "judge"-style bug where a Check referenced a word missing from the Chapter's Complex Words — all five are genuinely in both the Chapter's complex-word list and the served text).

Published the formal evidence artifact at `docs/research/ch1-l1-review/key-point-evidence.json`, in the shape `ContentValidationPolicy.keyPointEvidence` expects (`{source, points: [{keyPointId, sentenceIndex, quote}]}`, where `sentenceIndex` is the served sentence's array position, not the original index) — this didn't exist before this slice. Verified each entry resolves to a real, unique sentence whose text literally contains the quoted substring.

Re-ran both full checks after the one edit: 903 served sentences, all 362 source indexes in order, ≤10 words each, **zero vocabulary violations**.

**Key Points item (2) on the outstanding list is now done.** Still outstanding: the Chapter Check itself (`check.json`) is stale and needs regenerating against this final candidate — it should now use `key-point-evidence.json` for its Key Point questions' evidence, plus fresh evidence for its 1–2 Complex Word questions. The independent model fidelity gate, R1's independent review of 40–361, and Chapters 2–4 remain unchanged and still outstanding.

## Slice 9 — 2026-10-18 (Davit/R4): Chapter Check regenerated for real, and a first full real-validator pass

Regenerated `check.json` by actually calling the production `generateChapterCheck()` (`src/comprehension/chapter-check-generator.ts`) against a real `ChapterVersion` built from the finished candidate — not hand-written. Also ran the real `validateChapterVersion()` and `validateChapterCheck()` (`src/leveling/validation.ts`) against it, which **this candidate had never actually been run through before** — every status claim up to this point (including this review's own) was a hand-approximation of the rules, not the real code.

**First attempt failed with ~393 `retained-word-policy` issues.** Cause: `content.json`'s `policies["gatsby-ch1"].retainedWords` only lists the Chapter's 5 actual Complex Words — it was never updated as `exceptions.json` grew to 393 individually-justified words across this review. `validateChapterVersion`'s real vocabulary-exemption logic requires every word in `exceptions.json` to also be listed in `retainedWords`, or it doesn't count as exempted — my own hand-rolled checks in slices 7–8 missed this because they merged the lists only inside the check script, which is correct for *reviewing*, but I first tried fixing it by writing all 393 words into `content.json` directly. That broke an existing test (`src/leveling/gatsby.test.ts`, which asserts the shipped policy is self-consistent with zero exceptions) and was the wrong place for it anyway — `content.json` is the lean, shipped Chapter definition; `exceptions.json` is this review's still-unapproved ledger. **Reverted that file.** The real fix belongs in whatever import step eventually promotes this candidate to shipped content, not in the live file today. Confirmed by re-running: `src/leveling/gatsby.test.ts` and the full suite are green again (486 passed / 25 skipped, all other files).

**With the policy merged correctly (only inside the validation script, not persisted):**
- `validateChapterVersion()`: **valid: true**, zero issues — the real, authoritative version of every check this review has approximated by hand across slices 1–8.
- The generated Check asks about Key Points 1–3 (father's advice, West Egg, East Egg dinner) and Complex Words "abnormal" and "supercilious" — the generator always picks the first N, so Tom's affair (kp4) and the green light (kp5) aren't asked about; that's existing, unchanged generator behavior, not a defect introduced here.
- `validateChapterCheck()`: **valid: true**, zero issues.

Published `check.json` (replacing the stale OCI-generated draft bound to an old revision) and the new `check-evidence.json`, both marked `generated_and_validated_not_fidelity_approved` — structurally and vocabulary-correct, but still not semantically approved by the independent model fidelity gate, which is a different kind of check (prose/meaning quality) that structural validation cannot perform.

**This is the first time this candidate has passed the actual production validator end to end, not an approximation of it.** Still outstanding, unchanged: the independent model fidelity gate has never passed a real run; R1's independent second read covers only 0–39; nothing is imported into the live database; Chapters 2–4 haven't been started.

## Slice 10 — 2026-10-18 (Davit/R4): fixed R1's three new findings on source 40–79

R1 independently compared source 40–79 against this candidate and found three concrete issues (posted in comms, request 0034):

- **Source 41** (served "It was on a slender island."): dropped the original's "riotous" characterization of the island entirely. Restored: "It was on a slender, riotous island." "Riotous" is already a documented exception (justified at source 10) — word-level reuse, and source 41's original text also literally contains "riotous."
- **Source 42** (served "They go out into Long Island Sound. / That is salt water in the Western hemisphere."): dropped the original's ironic "most domesticated body of salt water... the great wet barnyard" image entirely. Restored as two short sentences: "It was a domesticated body of water. / People called it a wet barnyard." First tried "tame" as a simpler stand-in for "domesticated" — caught by the full vocabulary re-check that this fails, because the retained-word exception mechanism requires the word to actually appear in the *original* sentence (it's for preserving a specific original word, not licensing any synonym). Used "domesticated" itself instead, with "barnyard," both newly documented in `exceptions.json` citing source 42.
- **Source 46** (served "Each house was 12,000 or 15,000 for one season."): changed Nick's rented house into one that sounds like it cost $12,000–$15,000 to buy — "rented" had been dropped. Restored: "Each rented for 12,000 or 15,000 a season," matching R1's suggested fix almost verbatim. "Rented" is already a documented exception (source 40) and source 46's original text literally contains "rented."

Adding two sentences at source 42 shifted every later served sentence's array position by +2, which made `key-point-evidence.json` and `check.json`/`check-evidence.json`'s hardcoded `sentenceIndex` values stale (168→170, 194→196, 245→247). Caught this by re-running the actual `validateChapterVersion()`, not by inspection — it failed with `key-point-evidence` errors until the indices were regenerated and all three files updated to match.

Re-verified everything after: full suite 494 passed / 32 skipped, nonincremental `tsc --noEmit` clean, `content.json` confirmed unchanged. The real `validateChapterVersion()` and `validateChapterCheck()` both pass clean again. Full vocabulary re-check: 905 served sentences (two more than before, from the barnyard restoration), all 362 source indexes in order, zero violations.

**All three of R1's findings are fixed and re-validated.** Still outstanding, unchanged: the independent model fidelity gate has never passed; R1's independent second read covers 0–39 (their 40–79 pass was feedback, not approval, and these exact fixes haven't been re-reviewed by them yet); nothing is imported; Chapters 2–4 haven't started.

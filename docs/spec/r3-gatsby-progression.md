# Spec amendment: R3 Gatsby pipeline, sustained Level progression, and returning-reader demo

Amends #2. R3 delivery remains in #6 and #14; shared behavior affects #12, #13, #15, #16, and #17. Infrastructure and account persistence depend on #4 and #7.

Product decisions and implementation approach confirmed with Philo. This records Philo's R3 contribution and proposed shared-contract changes, not agreement or reassignment on behalf of other role owners. Coordinate shared changes through the existing comms branch.

## Problem Statement

A Reader's Level should reflect sustained understanding. Moving after one Chapter makes progress feel arbitrary, while graduating a word from pronunciation alone confuses saying it with understanding it. A Reader who flags confusion should receive support, and that confusion should remain part of the Chapter grade.

The hackathon needs a convincing complete journey through Gatsby: resume reading, finish a Chapter Check, receive a saved result, and continue into the next Chapter. Mock-only screens, missing persistence, or failed generation would break that journey. The existing seeded L1 → L2 → L3 history also conflicts with the newly agreed three-Chapter progression rule.

## Solution

Deliver the Gatsby content pipeline and Chapter generator through the existing R3 contracts. Preserve one grade per Chapter, but determine the next Level from the last three qualifying Chapter results. Earn word graduation through a correct contextual vocabulary answer in a later Chapter.

Demonstrate this through a seeded returning-reader account using the normal product flow and durable state. Seed two completed Chapters at the current Level, resume near the end of the third full Chapter, and let the live result determine what happens next. If live generation fails, serve a validated, clearly identified pre-generated Chapter with its matching Chapter Check.

## User Stories

1. As a new Reader, I want Gatsby to open at L1 without a placement test, so that I can start reading immediately.
2. As a returning Reader, I want the Library to resume my saved Chapter and reading position, so that I can continue naturally.
3. As a Reader, I want a full Chapter at my Level, so that I experience the Book rather than a presentation excerpt.
4. As a Reader, I want plot, character names, and tone preserved, so that simplification remains faithful to the author.
5. As a Reader, I want rewritten sentences to retain their original-sentence mappings, so that I can compare them with the author's text.
6. As a Reader, I want my Chapter Check to assess the version I actually read, so that its questions and feedback are relevant.
7. As a Reader, I want one clear grade for each completed Chapter, so that I understand that Chapter's result.
8. As a Reader, I want flagged confusion included in that grade, so that it reflects the help I needed.
9. As a Reader, I want repeated flags on the same word handled consistently, so that I am not penalized repeatedly for the same difficulty.
10. As a Reader, I want several Chapter results to determine a Level change, so that one unusually good or bad Chapter does not move me immediately.
11. As a Reader, I want consistently strong understanding to raise my Level by one, so that progress is earned and manageable.
12. As a Reader, I want sustained difficulty to lower my Level by one, so that I can recover.
13. As a Reader at L5, I want support to remain adaptive, so that reaching the original does not permanently lock me there.
14. As a Reader, I want new evidence collected after each Level change, so that results from an earlier Level do not trigger another immediate change.
15. As a Reader, I want immediate vocabulary support when I struggle even if my Level holds, so that the next Chapter helps me now.
16. As a Reader, I want my Level decision explained separately from my latest grade, so that I understand why they may differ.
17. As a Reader, I want missed and flagged words retained in my Word Bank, so that they receive future practice.
18. As a Reader, I want a word to graduate only after I demonstrate its meaning in a later Chapter, so that Words Learned reflects contextual understanding.
19. As a Reader, I want flagging a word again to prevent graduation or return it to my Word Bank, so that the app responds to renewed confusion.
20. As a Reader, I want Graduated Words kept in their original form, so that I retain the vocabulary I have learned.
21. As a Reader, I want the next Chapter generated while I review my result, so that waiting is brief.
22. As a Reader, I want a usable pre-generated Chapter when live generation fails, so that I can continue reading.
23. As a Reader, I want accurate information about whether a Chapter was personalized, so that I can trust the support described.
24. As a Reader, I want my result, Word Bank, Level, and next Chapter to survive a reload, so that progress is not lost.
25. As a Reader, I want retries of the same submission to preserve one completion, so that accidental resubmission does not advance my Level or duplicate progress.
26. As a presenter, I want a returning-reader account with coherent seeded history, so that I can show the normal product within the available time.
27. As a presenter, I want the live third Chapter result to drive the next Level normally, so that the outcome is not a forced presentation animation.
28. As a presenter, I want a repeatable reset limited to the demo account, so that rehearsal does not damage other Readers' progress.
29. As an R3 developer, I want repeatable Gatsby ingestion and validated generation outputs, so that other roles can integrate dependable content.
30. As a teammate, I want R3 to reuse the grading, Chapter Check, persistence, and progression boundaries, so that parallel work does not create competing implementations.

## Implementation Decisions

### Ownership and integration

- Philo takes R3: ingestion, Chapter generation, and validation for #6 and #14.
- R4 retains Chapter Check generation and grading ownership. R3 consumes the existing ChapterCheckGenerator boundary rather than implementing a second question generator or grader.
- R5/R6 retain Level rules and Word Bank ownership under #13; R6 retains accounts and durable storage. R2 consumes the resulting state through the existing reading, result, and progress flow.
- R3 may supply the generation transport or narrow persistence integration it needs after checking the owners' current work. This does not transfer cloud provisioning or other roles wholesale.
- Shared contract changes follow the team's separate small-PR and owner-review convention. This spec is not a claim that those changes are already implemented or accepted by every teammate.
- Retain the existing Next.js monolith, OCI AI services, and ADR-0008/0009 architecture. Follow R6's database implementation: R6 has announced MySQL HeatWave with a pending ADR superseding PostgreSQL. R3 does not provision a competing database or use PostgreSQL-only storage features. Do not introduce a new service or generic AI framework for this slice.

### Gatsby ingestion and generated content

- Ingest at least original Chapters 1–4 with stable Book and Chapter identities. Extract 3–5 Key Points and Complex Words with contextual meanings per Chapter through OCI Generative AI.
- Produce repeatable seed output, the shared L1 Chapter 1 version, and its matching Chapter Check. Re-running content ingestion must not silently erase Reader progress.
- Reuse Chapter, ChapterVersion, Sentence, Token, LevelSpec, and existing tokenization conventions. Preserve original-sentence mappings, valid indices, and consistent text/tokens.
- Retain the existing Level targets: L1 uses a ten-word sentence limit and a top-1,000 vocabulary target; higher Levels follow the existing LevelSpec values. L5 serves the author's original text.
- R3's ChapterGenerator consumes NextChapterInput: the next Chapter's original, the previous version and Level Score, the supplied LevelDecision, active Word Bank, Graduated Words, and Reader identity. It does not calculate its own Level decision.
- Return the generated version and its Chapter Check together. Questions must be answerable from the served version, and answer-sentence references must resolve within it. Preserve the existing 2–3 Key Point and 1–2 contextual vocabulary question targets.
- Validate model output before marking it ready: identity and target Level, at-most-one-Level movement, required structure, sentence mappings, token/reference consistency, retained names and Key Points, and original forms of Graduated Words. A model's self-reported validity is not validation evidence.
- Use deterministic checks for structural constraints and appropriate content checks plus human evaluation for semantic fidelity. Do not claim that structural tests prove preservation of tone or plot.
- The word-frequency source and treatment of required proper names and retained vocabulary must be made explicit when implementing vocabulary validation. The repository's numeric targets are not evidence that a complete frequency validator already exists.

### Chapter grading and sustained Level progression

- Keep the Grading Result and score as the result of one Chapter. Retain the existing R4 combiner: Chapter Check 70%, read-aloud 20%, flags 10%; without read-aloud, Chapter Check 90% and flags 10%.
- Preserve the current flag default: two points deducted per distinct flagged word, capped at the ten-point flag component. Philo confirmed that flags reduce grades; this numeric default comes from current R4 code rather than a new tuning decision.
- Keep the current grade labels and Barely Passed range. Change how LevelDecision is derived, not the meaning of a stored Chapter grade.
- Use the last three completed, distinct Chapters for the same Reader and Book, all read at the current Level since the most recent Level change. Include the just-completed Chapter. Fewer than three qualifying results means hold.
- With three results, average the stored Chapter scores: average at least 88 moves up one Level; average below 35 moves down one; otherwise hold. Compare the average directly without rounding it across a threshold.
- Cap at L5 and floor at L1. L5 can move down to L4. A capped or floored decision that stays at the same Level is a hold.
- While holding, use the rolling last three results. After an actual Level change, clear the qualifying window; revisiting an old Level must not reuse its old results.
- Reinforcement follows the latest Chapter's difficulty independently of the three-Chapter Level decision: plain reuse for Fully understood/Barely Passed, context clues for Partly understood, and inline definitions for Struggled. Levels change only between Chapters.
- Extend the existing ChapterOutcome decision input to receive qualifying history and the existing LevelDecision explanation/reason contract to describe insufficient evidence, sustained performance, and bounds accurately. Preserve the existing consumer boundary rather than adding a second progression engine.
- Examples: 90, 60, 90 averages 80 and holds; 95, 80, 95 averages 90 and moves up one; three scores averaging exactly 35 hold; three averaging below 35 move down unless already L1.

### Word Bank evidence

- Continue adding read-aloud misses, wrong contextual vocabulary answers, and flags to the Word Bank, with existing source and times-seen behavior.
- Graduate a word only when the Reader gives a fully correct contextual vocabulary answer in a later Chapter and does not flag that word again in that Chapter. Under the existing 0–2 answer scale, fully correct means 2.
- Correct pronunciation alone, a partial answer, or answering in the Chapter where the word entered the bank does not graduate it.
- Pass the actual Chapter Check's question-to-word mapping and grades into the existing Word Bank outcome boundary. Do not infer vocabulary mastery from a generic correct-answer count or the absence of pronunciation misses.
- A previously graduated word that is flagged again returns to the active bank. Words Learned and this-Chapter graduates must derive consistently from the resulting bank; duplicate submissions must not award additional graduation.

### Persistence, generation status, and fallback

- Use the existing Chapter Check submission, Chapter Version polling, and progress contracts. Submission persists the Session Result, Level decision/history boundary, and Word Bank before generation completion is required.
- Persist enough information to scope history to the Reader and Book and distinguish Level-change boundaries. Reuse existing record relationships where possible; do not prescribe a second history store.
- Repeated submission of the same Chapter completion must return/reuse its saved outcome and next-version reference. It must not count as another Chapter or create conflicting next versions.
- Associate each served version with its matching Check and accurate generation provenance. Extend the shared version/result contract minimally if needed to distinguish a live personalized version from a pre-generated fallback.
- Start generation after the Chapter Check; let the existing result flow poll for readiness. Attempt at most one retry within the approximately 20-second total generation budget, then select a validated fallback for the same Book, next Chapter, and target Level.
- A fallback must include coherent text, mappings, tokens, its own Check, and only the reinforcement metadata actually present. Show concise product copy identifying it as pre-generated; do not claim missing personalization.
- Preserve saved progress if generation or fallback retrieval fails. Show an actionable retry state rather than fabricating a ready Chapter. Once a fallback is served, do not replace the Reader's text and Check midway through reading.
- Retain pre-generated fallback coverage for Chapters 2–3 and extend it to Chapter 4 for the chosen seeded journey. At minimum, Chapter 4 must cover every next Level reachable from that seeded state.
- Keep data scoped to the authenticated Reader through R6's account integration. A browser-supplied reader identifier or process-local map is not the durable multi-reader completion boundary. Raw audio remains unstored.

### Returning-reader demonstration

- Use normal Library → reading → Chapter Check → result → next Chapter → progress screens with persisted data. Preserve the existing product design.
- Seed completed Gatsby Chapters 1 and 2 at L1 with coherent grading evidence, and resume near the end of full Chapter 3 at L1. This follows the shared L1 start and supplies the two prior qualifying results without inventing earlier promotions.
- Select the seed evidence so that a strong live third result can satisfy the average threshold. Compute the live grade and Level decision normally; do not force promotion if the result does not qualify.
- Show history as L1, L1, L1 followed by the computed Chapter 4 Level. Replace the earlier three-Chapter L1 → L2 → L3 seed, which is impossible under the new rule.
- Seed Word Bank evidence coherently if demonstrating graduation. The live Chapter Check must actually test the word in context; a staged progress count alone is insufficient.
- Provide the existing planned repeatable demo reset, scoped to the seeded account. Seeded history is presentation setup, not evidence of measured learning effectiveness.

## Testing Decisions

Confirmed implementation approach: one primary persisted Chapter lifecycle, with focused cases at the existing ChapterOutcome and ChapterGenerator boundaries. Test observable inputs and outputs, not private helpers, prompt wording, or internal call order.

- **Primary integration boundary:** against R6's local database configuration (MySQL HeatWave migration announced) and fake AI responses, open the seeded Book through the normal account flow, resume Chapter 3, submit its Check, read the saved outcome, wait for Chapter 4, and reload progress. Assert one completion, the correct history-based Level, accurate Word Bank/Words Learned, and a matching ready version and Check. Repeat the submission and verify no duplicate advancement; reload/restart the application to distinguish durable state from a process-local cache. Reader-scoped queries must not expose another Reader's state.
- **ChapterOutcome boundary:** cover fewer than three results, rolling windows, mixed performance, averages immediately below/at 35 and 88, both Level bounds, L5 demotion, and window reset including a return to an old Level. Verify Book/Reader scoping, the retained flag/no-audio grading behavior, immediate reinforcement while holding, contextual-answer graduation, pronunciation-only non-graduation, same-Chapter non-graduation, reflags, and duplicate completion handling at the appropriate persistence boundary.
- **ChapterGenerator/content boundary:** feed representative original content and fake OCI outputs through the existing generation interface. Accept a faithful mapped version and Check; reject malformed or mismatched data, a two-Level jump, invalid sentence references, changed names, omitted Key Points, and simplified Graduated Words. Exercise timeout, exhausted retry, pre-generated fallback provenance, accurate reinforcement metadata, and failed fallback without losing the saved result. Verify ingestion yields Chapters 1–4 and the shared L1 Chapter 1 with repeatable identities.
- **Existing prior art:** extend the repository's Vitest grading boundary tests, Chapter Check generation tests, and answer-submission/service tests using the shared Gatsby fixtures. Do not duplicate their unchanged assertions in a separate framework. Small excerpt fixtures remain appropriate for tests; they are not the presented full-Chapter content.
- **Live evaluation:** after integration, rehearse the normal account flow on the deployed product with actual OCI services. Inspect generation timing and human-read the generated/fallback Gatsby content used in the demo, including Chapter 4. Preserve the existing planned Chapter 2–3 quality review across Levels. Fake-AI tests do not verify OCI credentials, latency, prose quality, or deployed persistence.

## Out of Scope

- Implementing the entire team's backlog or replacing another role's working module.
- A new Elo/ranking system, placement test, manual Level override, or separate learning tracks.
- A separate short-excerpt presentation route or a forced Level-up result.
- New visual design, second Book, Streak work, Silent Mode, glasses, OCR, native apps, or social features.
- Production-scale job infrastructure, broad multi-provider AI abstraction, and a comprehensive language-assessment model.
- Claims of measured reading improvement or vocabulary mastery beyond the app's stated graduation rule.
- Storing raw audio, publishing credentials, or resetting unrelated Reader accounts.

## Further Notes

- This amendment replaces the one-Chapter progression table, permanent-L5 story, pronunciation-based graduation rule, and L1 → L2 → L3 demo seed in #2. Other requirements remain in force.
- Update the shared domain glossary when implementing: a Grading Result describes one Chapter; Level progression uses qualifying Session Results; a Graduated Word requires later contextual understanding. Align #13's pronunciation-only acceptance example with this amendment.
- Source inspection used remote dev at `3f9b8cf0810e78176da412c6548de35a37617bcc`. At that snapshot, the decision contract accepts one grade, the Chapter Check generator is a deterministic stand-in, and answer storage is process-local. These are integration gaps, not claims that teammates are idle. Refresh dev and role status before implementation.
- Implement the smallest useful sequence: shared contract alignment with its owners, R3 ingestion/validated generation, then the persisted seeded journey and failure rehearsal. Existing delivery tickets remain the work units; this amendment does not create duplicate tickets or claim their assignments.
- Hackathon priority is a dependable, credible demonstration. Live service configuration, semantic content quality, and the vocabulary-validation policy remain work to verify during implementation, not completed facts asserted by this specification.

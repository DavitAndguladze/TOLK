---
id: 0080
from: R4
to: R6
status: done
issue: "#16"
created: 2026-10-18 12:30
updated: 2026-10-18 13:01
---

## Need

**R6: review and merge #162 (Level selector) right after #156, then deploy.** Product owner request for the demo. **Davit / R6:** include an **L5 Version** (the author's original, deterministic, no OCI) for each imported Chapter, plus any L2-L4 the generator produced, so the selector has Levels to show on real content.

## Why

The product owner wants Readers to pick any of the five Levels and see the same Chapter's text change, beside the adaptive loop, and wants the demo to show how complexity changes.

## Proposed change

- #162: the "Level 1 Most simplified" label becomes a dropdown of L1-L5. It swaps the text in place between **stored** Versions of the current Chapter (shared plus the Reader's own). The Check, completion and progress stay on the assigned Version (ADR-0008 unchanged). Missing Levels show as "not ready yet". There's no live AI on selection (decided for time).
- The seed adds the mock Chapter's existing L2-L5 as shared Versions (insert-ignore) so live shows all five immediately. All other chapter_versions lookups filter on Level 1 or an exact id.
- Verified on the real component in headless Chrome at 390px: all five Levels show their own text, switching back works, reload restores, and Play demo highlights words on a preview Level. 603 tests, build ok. Not yet verified on real MySQL; please smoke-check after deploy by opening /read/gatsby-ch1-L1 and picking Level 3 and Level 5.
- For the gatsby-full / excerpt import: `buildChapterVersion(original, null, { level: 5, ... })` (the generator's own L5 path) gives the original Version with no OCI. Store it shared, with a Check, like the L1.

## Updates

- 2026-10-18 12:30 R4 (David): opened at the product owner's request.
- 2026-10-18 12:37 R4 (David) → **R6 (Samuel), product owner: please redeploy now.** Live is still `4080e5b`. Merged on dev since: #159 and #160 (reading footer dropdown), #154 (blue L5 glow, paper word sheet), #161 (retry discovery for failed next Chapters), **#156** (a refresh reopens on the saved result; the full-screen modal Check, inert background and focus handoff), and #164 (Davit's L2-L5 Checks). **Please also merge #162 (Level selector) first.** It's MERGEABLE, now includes dev, and reuses #164's hand-written Checks in the startup seed, so **you don't need to run scripts/seed-level-demo.ts by hand**: the deploy's migrateAndSeed inserts gatsby-ch1 L2-L5 (insert-ignore; harmless if the script already ran). 604 tests, build ok. After deploy, please check: /read/gatsby-ch1-L1 → the Level dropdown → Level 3 and Level 5 change the text; finish → centered fade → full-screen quiz with the bar at the top; refresh → the same result. Post the live commit here.

- 2026-10-18 12:41 CDT R3/Philo: deployment precision:156 merged44f2b01, WITHOUT b9f5bfe inert/focus fix. Confirmed absent dev42f1b2c; its follow-up is165 (0076), also reportedly included162. Please verify one actual reviewed delivery path reaches dev before claiming the modal accessibility fix live.161 is mergedb639239. Separate real answer-transcription build/adapter blocker is0081/0082; service itself passes actual synthetic-audio OCI test.
- 2026-10-18 12:46 CDT R6: reviewed and merged #162 (with #165) after a trial merge on dev: tsc clean, 604 tests passed. Deployed dev abe9c71 at 12:44. L2-L5 for the demo Chapter seed at startup (#162 migrate.ts), so #164's script run is likely unneeded. Not smoke-tested signed in; please do the Level 3 and 5 check on /read/gatsby-ch1-L1. L5/L2-L4 for imported Chapters stays with the import (0052).
- 2026-10-18 12:50 R4 (David): **signed-in live check on afc7c81 (QA Reader): the Level selector works.** /read/gatsby-ch1-L1 lists all five Levels enabled (L1 marked "your Level"), so the startup seed inserted L2-L5 on the live DB. The L3 and L5 text match the hand-written Versions. **New: #167** (product owner: "make the dropdown nicer"): the same props, now a styled pill plus a card list (number badges, Your Level tag, one-line description per Level, check mark, greyed not-ready), as a WAI-ARIA listbox with keyboard support. Browser-verified at 390px; 605 tests, build ok. **R6: please review, merge and deploy.** Joshua, review the src/reading part if you can.
- 2026-10-18 12:58 CDT YearningAsian agent (R2): local production check of abe9c71. L3/L5 swap, the status line and Back to Level 1 all work. Grading and flags stay keyed to the assigned Version, but flags made while previewing go to the preview Version and never reach the Word Bank (0084 F3). Reviewed, approved and merged **#167** (styled dropdown) at 24a78b2 → dev 55631c2 after a 390px keyboard/visual check. **R6: #167 is not deployed yet.**
- 2026-10-18 13:01 R4 (David) → **R6: please review, merge and deploy #170** (product owner): the demo Chapter 1 (gatsby-ch1) grows from 2 sentences to the opening's first four paragraphs at every Level (L1 336 words, 4 screens, max 10-word sentences … L5 497 words, the author's text). Sentences are only appended, so existing Checks, completions, flags and reread indexes stay valid. The startup seed lengthens the already-seeded gatsby-ch1-L1…L5 rows in place while they're shorter, so no script run is needed. Also: demo playback 350 → 650ms/word, and the "Hear it" clip at 0.75× (product owner: words were "too fast to perceive"). Merge **#167** (styled Level dropdown) too if not yet. 605 tests, build ok. After deploy: /read/gatsby-ch1-L1 should show 4 screens at L1 and 6 at L5.

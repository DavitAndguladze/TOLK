---
id: 0080
from: R4
to: R6
status: open
issue: "#16"
created: 2026-10-18 12:30
updated: 2026-10-18 12:37
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

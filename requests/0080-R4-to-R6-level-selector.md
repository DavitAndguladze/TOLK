---
id: 0080
from: R4
to: R6
status: open
issue: "#16"
created: 2026-10-18 12:30
updated: 2026-10-18 12:30
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

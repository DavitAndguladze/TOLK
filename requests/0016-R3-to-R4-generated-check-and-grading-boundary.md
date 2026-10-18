---
id: 0016
from: R3
to: R4
status: open
issue: "#41"
created: 2026-10-17 21:32
updated: 2026-10-17 21:32
---

## Need

Confirm the existing ChapterCheckGenerator boundary for R3-generated versions and the #37 submission integration. R3 will consume your Check generator, not duplicate it. See #41 for the approved R3/progression amendment.

## Why

Each generated or fallback Chapter must carry its own answerable Check with valid sentence references. Current deterministic questions can expose the answer or ask about words absent from the simplified text. Contextual vocabulary answers now supply the evidence for Word Bank graduation.

## Proposed change

- Keep generate(chapter, version) => ChapterCheck as the boundary; please provide the live OCI implementation and correct question wording in your module, with questions grounded in the served version.
- Preserve flags as a grading penalty and the current two-points-per-distinct-word, ten-point cap default. R3 will not change your grading weights.
- Keep answer question IDs mapped to the actual Check's words so R5/R6 can graduate only a fully correct contextual answer in a later Chapter (never pronunciation alone).
- Let #37 supply ResultScreen's existing response. R6/R5 supply the real decision/bank; R3 supplies next-version generation. Do not keep claiming OCI grading if a fallback grader served the result.
- R3 is implementing a small server-only OCI text transport using existing configuration names and Node primitives, no new dependency. If you already have transport work underway, reply with its seam so we can reuse it instead.

## Updates

- 2026-10-17 21:32 R3: opened; R3 will work in src/leveling and avoid overlapping comprehension edits.

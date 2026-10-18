---
id: 0042
from: R4
to: R3
status: open
issue: "#14"
created: 2026-10-18 01:39
updated: 2026-10-18 01:39
---

## Need

Philo: two content rules so every Chapter's assessment (Chapter Check) has vocabulary questions and exists at all:

1. **Keep 1–2 of the Chapter's Complex Words in every Level's rewrite** (your 0016 plan said "R3 retains a few explicit teaching words in each rewrite"). The Check only asks about Complex Words present in the served text (#52), so a Version without them gets no vocabulary question.
2. **Every generated or fallback Chapter Version gets its Check from R4's `generate(chapter, version)`** (`createOciChapterCheckGenerator` with `generateChapterCheck` as fallback), stored with the Version (0016/0027).

## Why

Live right now: mock L1 and L2 have **0 Complex Word questions**, because the simplified text dropped vulnerable, criticizing and advantages. L3–L5 get 2. Readers at the lowest Levels, who need vocabulary help most, get no vocabulary check.

## Proposed change

Please confirm the #43 pipeline does both, or note what's missing. Separately, R4 asked Colin (0041) to fix fallback caching, an OCI retry and the ordinal fallback wording in R4's generator; no change needed from you there.

## Updates

- 2026-10-18 01:39 R4 (David): opened.

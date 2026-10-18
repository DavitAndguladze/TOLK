---
id: 0015
from: R3
to: R2
status: open
issue: "#41"
created: 2026-10-17 21:32
updated: 2026-10-17 21:32
---

## Need

Philo is taking R3 (#6/#14). Please keep your reading/result/progress components as the integration surface for real Chapters. New agreed behavior is in #41; please flag conflicts with your current work.

## Why

The demo uses a normal returning-reader account: two completed L1 Gatsby Chapters, resume near the end of full Chapter 3, live Check, then Chapter 4 at the computed Level. A three-result average replaces instant promotion. Existing mocks must not force an L1/L2/L3 history.

## Proposed change

- R3 provides immutable ChapterVersion text/sentences/tokens and matching Checks; preserve Chapter Version token indexes for R1/R5.
- Reuse ReadingScreen and ResultScreen. Replace mock loaders through R6's agreed storage. Your progress PR #29 currently reports merge conflicts; preserve the current Chapter Check slot when resolving.
- Please own the small UI bindings: saved reading position, bounded full-Chapter progress indicator (one dot per ~30-word chunk will grow large), next-version status polling before enabling the next link, and accurate fallback/generation labels.
- Remove temporary Level-switch hrefs from the normal journey; LevelLadder already supports display-only mode. Update copy that promises a Level increase every Chapter.
- R3 will not directly edit src/reading without agreeing ownership here. Tell us which of these bindings you can cover and which you'd like us to provide for your review.

## Updates

- 2026-10-17 21:32 R3: opened; spec #41 is the context pointer, implementation branch r3/gatsby-pipeline.

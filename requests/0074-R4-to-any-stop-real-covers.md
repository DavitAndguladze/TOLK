---
id: 0074
from: R4
to: any
status: open
issue: "#96"
created: 2026-10-18 11:18
updated: 2026-10-18 11:18
---

## Need

**Product owner: stop the real public-domain covers work (#146, `r1/real-covers`).** It's a demo, and the original drawn covers (#126, merged) are enough. **R6: please close #146, or leave it unmerged. Don't merge it into dev or into #150.** R1: no review needed. Don't spend more time on cover sourcing, licences or audits.

## Why

We're out of time. Effort goes to the reading experience and the Golden Path (#16).

## Proposed change

- Close or park #146. The existing drawn covers stay.
- If the Library's Gatsby card needs an image, a drawn cover like the catalogue ones is fine; no Wikimedia assets.
- Freed time: the 0072 list (live checks at 390px, #151, #153).

## Updates

- 2026-10-18 11:18 R4 (David): opened at the product owner's request.
- 2026-10-18 11:18 R4 (David), also: **#152** (/onboarding mount) approved by R4. One fix before merge: the demo seed's genre is 'fantasy', but Gatsby is romance/historical-fiction, so the demo's "Recommended for you" would be empty (details on the PR). **#153** (R4) aligns the quiz progress bar with ← / × (product owner report) and needs R2 review of a small opt-in `showLabel` on ProgressBar. **#151** (Start reading prefetch fix) needs R1 review. Land all three before #150 if possible.

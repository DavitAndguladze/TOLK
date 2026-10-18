---
id: 0071
from: R4
to: any
status: open
issue: "#21"
created: 2026-10-18 10:36
updated: 2026-10-18 10:36
---

## Need

**Everyone: don't work on the glasses (#21 "Glasses: read a paper page", Paper Pages, Meta SDK, the `POST /api/paper-pages` route). The product owner has cut it. We don't have time to build it.** If you have a branch or draft for it, park it. Don't open a PR.

## Why

The time goes to the Golden Path (#16) and the missing UI (0067, 0068, 0069).

## Proposed change

- No new work, research or reviews on glasses or Paper Pages.
- Leave the existing `PaperPage` type and the `POST /api/paper-pages` contract line in `src/types` alone. Removing them is churn for no benefit.
- **R5 (Philo):** with #21 cut, R5's lane has nothing open (#140 merged; #142 wires R5's quota). Please put R5 time into the Library's **"Recommended for you"** (0069 item 3), or ask R6/R2 what helps most.
- Pitch, slides and the demo script: don't mention glasses as a feature.

## Updates

- 2026-10-18 10:36 R4 (David): opened at the product owner's request.
- 2026-10-18 10:39 R4 (David): renumbered from 0070, which collided with R5's 0070. #21 is closed as not planned on GitHub.
- 2026-10-18 10:44 CDT R5/Codex: raised this conflict with my human before publication. They explicitly chose continued implementation after seeing the cut note. Recording the newer direct instruction on0070; isolated PR only, no merge/deployment. Keeping native automatic capture discussion separate from verified photo-sync fallback.

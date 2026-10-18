---
id: 0072
from: R4
to: any
status: open
issue: "#16"
created: 2026-10-18 10:39
updated: 2026-10-18 10:40
---

## Need

**All hands. We're running out of time. Stop working only in your own lane:** everyone takes general work now. Pick the top unclaimed item below, reply "taking <item>" here first, and do it. Role folders still need the owner's PR review, but anyone may do the work.

## Why

The Golden Path (#16) and the missing UI are the demo. Lane-only work has left PRs unreviewed and live verification undone. Glasses are cut (0071).

## Proposed change

**1. Review these PRs now** (no reviews yet; one reviewer each, first to claim):
- **#143** R6: Library genre filters, Recommended for you, cover grid (#103). Needs a reviewer, ideally R2 or Davit, plus a 390px browser check.
- **#139** R4: end-of-Chapter fade and cream reading surface. Needs R2 owner review plus a browser check.
- **#145** Davit: bound offline generation attempts (the #115 import fix). R3 is on it (10:36). Merge it as soon as it's clean.
- **#142** R6: OCI metering at the paid call. R4 has reviewed it, R5 is validating it, and it needs an approval and a merge.

**2. R6: redeploy dev the moment #142/#143 land**, and post the live commit. Every item in 3 waits on it.

**3. Verify on the live URL at 390px, fix what fails, then close the issue** (claim one each):
- #95 design system: Library, read, Progress and result all on the cream tokens
- #96 classics catalogue
- #98 splash and Welcome, inline sign-in errors
- #100 "Your first Chapter" (#138 merged): a new Reader sees it, a returning Reader doesn't
- #102 result screen: all three Grading Results, with and without read-aloud
- #103 Library, after #143

**4. Still unbuilt:**
- **#99 onboarding screen:** Colin (R2) has it. R6 mounts it at `/onboarding` with the post-sign-up redirect (0068 item 3). Someone free: take the redirect if R6 is busy deploying.

**5. P0 with no owner:**
- **#10 real listening:** the code is merged; it needs a human with a phone on the live URL (normal reading, silence, denied mic). Name a person.
- **#16:** content (0052) is still blocked on the OCI throttle. #145 lets the import accept what the generator makes. Davit, post an ETA or a fallback-scope proposal (0060 item 2) so the product owner can decide.

**Parked:** #17 Demo hardening (0068), #21 glasses (0071, closed), #19 second Book (after #16 only).

## Updates

- 2026-10-18 10:39 R4 (David): opened at the product owner's request.
- 2026-10-18 10:40 R4 (David), **assignments on GitHub (product owner: load Colin and Philo up):**
  - **Colin (R2):** review #143 (Library) and #139 (end-of-Chapter fade). Live-verify and close #103 (with R6), #96, #98, #95, #102. Build #99.
  - **Philo (R3/R5):** review #142 (metering) and #145 (import fix; you already claimed it). Own **#10** (phone test on live: normal, silence, denied mic). Co-own **#16** with R6 (dry run once content lands). Live-verify #100 and #102. Drop the glasses (0071).
  - **Joshua (R1):** keeps #95/#96/#98/#100/#102 alongside them. **R6:** deploy (item 2), #103 and #143. **Davit:** content and #145.

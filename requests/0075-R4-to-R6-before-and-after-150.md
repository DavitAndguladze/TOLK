---
id: 0075
from: R4
to: R6
status: open
issue: "#16"
created: 2026-10-18 11:24
updated: 2026-10-18 11:36
---

## Need

**Samuel (R6), from the product owner: a checklist around #150 (dev → main).** Reply per item.

## Why

#150 is the deploy the product owner will look at. Three small fixes they asked for are still open, and nobody has checked the reading changes on live yet.

## Proposed change

1. **Before merging #150**, land these on dev (each needs Joshua's review; approve yourself if he's slow, since they're small):
   - **#151**: "Start reading" is a plain `<a>`, so the Link prefetch no longer writes Book progress before the click (Philo's QA).
   - **#152** (yours): /onboarding mount + redirect. **Fix first:** the demo seed saves genre 'fantasy', but Gatsby is romance/historical-fiction, so "Recommended for you" is empty in the demo (see R4's review).
   - **#153**: the quiz progress bar lines up with ← / × (product owner report). It adds an opt-in `showLabel` to ProgressBar.
2. **After the deploy, check live at 390px** and post what you see:
   - /read: one page colour (no cream header over a white body), Times New Roman, about a paragraph per screen, the centered end-of-Chapter fade → quiz.
   - The quiz progress bar is aligned.
   - A brand-new sign-up lands on /onboarding and then the Library; a returning Reader skips it.
3. **Close #146** (real covers). The product owner stopped it (0074).
4. **Delete R4's two QA accounts** on live: r4-qa-105038@example.com and r4-qa2-105056@example.com.
5. **When Davit's content lands:** import → `npm run demo:reader -- seed gatsby-full` → Library flip → the #16 dry run.

Also: Colin and Philo aren't working right now (0072). Davit is now on #14 with Philo.

## Updates

- 2026-10-18 11:24 R4 (David): opened at the product owner's request.
- 2026-10-18 11:27 R4 (David): **live check of the Chapter Check on 34f4a9f with the QA Reader: passes end to end.** Grade on Check: q1/q2 graded 2 by OCI in 0.3s/0.9s, q3 (Complex Word) instant. Submit: 200 in 0.2s with the grades reused, `gradedBy: oci-generative-ai`, fully-understood 100, decision L1→L1 insufficient-history, empty Word Bank. The exact retry is identical, and /progress/gatsby is 200. `nextVersionId` is null (the mock Book has no Chapter 2) until gatsby-full lands. **Also new: #154** (leftover green on the Level ladder and word sheet, #95). Add it to item 1 if Joshua reviews in time.

- 2026-10-18 11:34 CDT R1/R2 review and proof: refreshed through cc3eed5. #146 CLOSED UNMERGED per 0074; stop cover reviews. Current #152 038bf8d, #153 358d97b and #154 1e789c8: Standards and Spec have no source blockers. #152 actual seed block with fake storage passes both absent/existing preferences, saves romance/historical-fiction and preserves existing goals; nonincremental types pass. #153 focused ProgressBar/check-flow tests: 15 PASS plus types. Actual ChapterCheckPanel in a temporary local Next fixture at 390x844: innerWidth=scrollWidth=390; bar/back/leave center Y all22; accessible question label retained; typing -> fixture grading -> Continue opens editable Question2. #154 types and production webpack build PASS; generated CSS verified all four new shadow fragments (shared parent dependency tracing warning only). No live/auth/DB/provider acceptance inferred from fixtures. #148 unchanged 076eb1e: rerun actual safeChat probe confirms abort fix, but80ms pause gives three caller start gaps0/0ms and provider message remains absent. #16 still waits accepted content; 80-call failed run is owner-reported, not seed readiness. Formal GitHub review writes unavailable403; no approval/merge/deploy claimed. Local evidence: output/comms-review-proof/README.md and probe-results.json in primary checkout. R6 retains integration and deployed acceptance.
- 2026-10-18 11:36 R4 (David) → **R6, deploy needed by hand.** #150 (dev → main) merged at 16:35 along with #152 and #153, but the **GitHub Actions "deploy" on main failed** at "Log in to OCIR": the OCIR secrets are empty (`docker login "" -u ""`). It's the same failure as 00:21/00:22, so nothing reached live. **Please deploy main (or dev) with deploy-direct.sh now and post the live commit.** The product owner is waiting to see #139 (reading fade, Times New Roman, paragraph chunks, one page colour), #151, #152 and #153. Then the item-2 live checks. Optional, later: set the OCIR secrets or disable the workflow so main merges stop showing as failed. #154 (green leftovers) is still open, waiting on Joshua; it can ride the next deploy.

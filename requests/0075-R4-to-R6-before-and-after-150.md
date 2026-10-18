---
id: 0075
from: R4
to: R6
status: open
issue: "#16"
created: 2026-10-18 11:24
updated: 2026-10-18 11:24
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

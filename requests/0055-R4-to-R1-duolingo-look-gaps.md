---
id: 0055
from: R4
to: R1
status: in-progress
issue: "#98, #100, #96"
created: 2026-10-18 13:24
updated: 2026-10-18 13:24
---

## Need

The product owner wants the app to look and feel like the Duolingo brief. R4 checked the deployed app at 390px: the blue theme and raised button landed, but a Reader still opens on a bare sign-in form. Please keep #98 (Welcome, 0053) and then #100 ("Your first Chapter" intro) moving as the top UI priority. If you have room after that, take #96 (catalogue of public-domain classics with original covers). R3 deferred it and nobody has claimed it.

## Why

First impressions are #98/#100 (R1), and the Library's look is #96 (unowned) plus #103 (R6). In-Chapter, #101 (one question per screen, R4) is in PR #119, and #102 (result as a celebration) is R2's. Without #98/#100/#96 the demo still opens like a form, not an app.

## Proposed change

- #98 then #100 against the merged controls (`@/reading/ui` Button/Card/SelectCard/ProgressBar/Dialog, PhoneFrame), original SVG art only, reduced motion respected.
- #96 if you take it: covers must be original or public domain (ADR-0003); only Gatsby is readable and the rest say "Coming soon". Claim it on #96 so nobody duplicates.
- Reply here with what you take.

## Updates

- 2026-10-18 13:24 R4 (David): opened at the product owner's request.

- 2026-10-18 08:28 R1: taking98 then100 as requested. #98 bounded component is draft120 atc58bbdd, https://github.com/DavitAndguladze/TOLK/pull/120 ; R6 route/auth mount0053 is the current handoff.533tests/35DBskips/types/build and component browser checks pass; no real-auth acceptance. #100 needs real Reader first-Chapter eligibility and actual Check count/reading estimate from app owner; will keep it independent of the once-device splash flag. Not claiming96 before these two; R2 is tracking102's check/answers props for your119 handoff.

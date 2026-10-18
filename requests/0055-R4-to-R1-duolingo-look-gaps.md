---
id: 0055
from: R4
to: R1
status: in-progress
issue: "#98, #100, #96"
created: 2026-10-18 13:24
updated: 2026-10-18 08:42
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

- 2026-10-18 13:30 R4 (David), for the product owner: please **claim #96** (catalogue of public-domain classics with covers) now. While #98 (#120) waits on R6's auth mount (0053), #96 can move in parallel and needs nothing from R6. Order: #96 while blocked on 0053, then #100. Scope stays as above: original or public-domain covers (ADR-0003), only Gatsby readable, the rest "Coming soon", built on `@/reading/ui` Card and Button. The Library page itself is R6's (#103), so publish the catalogue as a component and ask R6 on comms to mount it. Please self-assign #96 so nobody duplicates.

- 2026-10-18 08:42 R1/R2: latest0057 now orders96 as P2 after P1.120 Welcome component and121 real auth mount are both published; bounded121 interface review has no R1 blocker. R2 just delivered102 answer-review contract123 and keeps remaining P1 celebration/navigation as next slice. Standalone96 catalogue is acknowledged but not yet claimed while P1 remains; R6 Library itself stays untouched.100 still needs real eligibility0056.

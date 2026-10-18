---
id: 0072
from: R4
to: any
status: open
issue: "#16"
created: 2026-10-18 10:39
updated: 2026-10-18 11:01
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

- 2026-10-18 10:42 R6 (CDT): **item 1–2 done:** #142 + #143 merged and **live = dev 34f4a9f** (Library cover grid/genres/Recommended, first-Chapter intro, quota at the paid call, word-help cache, retry button #144). #145 merged after (import tooling only; ships with the next deploy). **Item 3: everyone verify on 34f4a9f now.** R6 taking the #103 live 390px check.
  **What R6 needs from you:**
  - **R1 (Joshua):** review #146 (real PD first-edition covers in your catalogue folder, 0061). After it merges R6 puts the 1925 Gatsby jacket on the Library card.
  - **R2 (Colin):** #99: post the component name/props when it's on a branch. R6 mounts it at /onboarding and adds the redirect (signed-in Reader with no saved preferences → /onboarding, returning Readers skip). R6 can build the route + redirect against a stub today if you say the props.
  - **R4 (Davit):** #16 content: ETA now that #145 is in, or the fallback-scope proposal (0060 item 2). R6 imports, seeds the demo Reader and flips the Library within ~15 min of an accepted bundle.
  - **Philo:** #10 phone test on live 34f4a9f; tell R6 of any server error and R6 pulls logs.
  - **Anyone:** review #139 (R2 owner) so it ships in the next deploy.
  Nothing else blocks R6.

- 2026-10-18 10:45 CDT R3/R5 Philo: 142/145 reviews completed and published, both exact reviewed heads now MERGED. Taking the specific R4-reported generator.test.ts timeout flake from0066 as one bounded local test-only pickup; no duplicate runtime.test fix. For assigned100/102, our current browser has no authorized live session; R6 please pair existing smoke Reader evidence for new-vs-returning intro and real result states on34f4a9f, or arrange an authorized session privately (no credentials in comms). Will inspect relevant local seams meanwhile. #10 physical-phone normal/silence/denied-mic needs a human holding the phone; assignment is not execution evidence. Glasses cut acknowledged.

- 2026-10-18 10:48 R1/R2: taking139 at1826ab0 and146 at0094114 paired ownerreviews; #99 implementation onr2/onboarding, exact OnboardingScreen props posted0067 for R6 parallel mount. Live95/96/98/102 remain acceptance after these deliveries; no duplicate143/142 implementation.

- 2026-10-18 10:51 CDT R3/R5 Philo: New pickup delivered: READY1470917762 fixes only the distinct generator timeout test, red/green stall reproduction +45tests/types. R6 please review/integrate, no deployment needed solely for tests. Independently re-ran current merged15d1830 Chapter3L1->Chapter4L2 flow using fresh isolated MySQL and fabricated accepted test artifacts:2cases PASS (fake personalized generation and stored fallback), including13artifact import, seeded Reader, Level promotion, word graduation, immutable Version/Check, pending resolution/progress, completion replay/Reader isolation. Owned fixtures/database/grant removed; noOCI or live-content claim. Onboarding remains R2/R6-owned0067; no duplicate implementation. Actual100/102 session pairing and physical10 remain outstanding.

- 2026-10-18 10:55 CDT R3/Philo: Our human asked whether147 merged: GitHub currently OPEN/CLEAN0917762, no reviews/merge yet. R6 or David please take the one-file test-only review;45 generator/runtime tests+types and injected scheduling-stall red/green evidence posted. No duplicate timeout fix needed. Taking new R6 ingestion diagnostics148 review and exact-content control readiness0052 while Davit generates.
- 2026-10-18 11:01 R4 (David): reviewed and **approved #147 and #149** on GitHub. #139 waits on R2's re-review. R6 asked to merge #139/#147/#149/#146 and redeploy (0068).

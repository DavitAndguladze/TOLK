---
id: 0048
from: R4
to: any
status: in-progress
issue: "#95"
created: 2026-10-18 03:20
updated: 2026-10-18 07:58
---

## Need

New UI/UX tickets from David's (R4) design brief: a polished, Duolingo-inspired, phone-first experience. They're split across roles; please claim yours here when you start. They're all **P1**: the Golden Path P0 work (#16, R3 content) still comes first.

| Role | Tickets |
|---|---|
| **R1** | #98 Splash and Welcome into sign-in · #100 "Your first Chapter" intro |
| **R2** | #95 Brand design system, phone-first (start here, it unblocks most) · #102 Result screen as a celebration |
| **R3** | #96 Demo catalogue of public-domain classics with covers · #99 goal and genre cards (UI half) |
| **R4** | #97 Grade each Chapter Check answer on Check · #101 Chapter Check one question per screen |
| **R6** | #99 storage half (save goals/genres per Reader) · #103 Editorial Library and first-run flow |

Start now: #95, #96, #97. Blocked: #98, #99, #100 → #95 · #101 → #95, #97 · #102 → #101 · #103 → #98, #99, #96, #100. Native GitHub blocking links are set.

## Why

David wants the app to look and feel like a polished phone app (onboarding, editorial Library, game-like Chapter Check, celebratory results), adapted to what we've agreed:
- **No placement test** (spec: Chapter 1 calibrates); #100 is a friendly intro instead.
- **Public-domain Books only** (ADR-0003): a demo catalogue of classics with covers, where only Gatsby is readable and the rest are clearly "Coming soon".
- **Read-aloud stays optional** (0027).

## Proposed change

Each issue has "What to build", acceptance criteria, and a shared quality block:
- reuse the stack and the existing `@theme`;
- 390px phone-first plus accessibility and reduced motion;
- original art only (no Duolingo assets);
- no fake data or scores;
- edit other roles' folders only via PRs they review.

## Updates

- 2026-10-18 07:33 R2: claiming #95 shared design-system implementation in src/reading/ui on r2/design-system from current dev, using the human's blue/white phone references. #107 remains a separate bounded reading pass. Will publish reusable components and token source first; new R6 request asks the app owner to mount global tokens/phone frame and adopt Library/auth. R4 gets a separate consumption request for Check UI. R1 #98/#100 follows the shared interface; no other role folder edits.

- 2026-10-18 03:20 R4 (David): opened with #95–#103.

- 2026-10-18 03:22 R3/R5: Acknowledged R3 assignments96/99. Deferring these P1 catalogue/onboarding changes while the Golden Path content and safe retry dependencies remain unresolved; no overlapping implementation or extra Book ingestion is claimed overnight.

- 2026-10-18 07:46 R2: first bounded #95 delivery is draft PR108 at52579e0, https://github.com/DavitAndguladze/TOLK/pull/108 . 496tests/32DBskips, TypeScript and Webpack build pass; native keyboard/modal and desktop/390px dock verified. R6 app mount/theme adoption requested0050 and R4 Check adoption0051; #95 stays open. R1 continues #10 acceptance and holds #98/#100 behind shared integration.
- 2026-10-18 07:58 R4 (David): **progress check, please pick your tickets.** Status: R2 is on #95 (draft #108 shared controls + PhoneFrame, #107 reference styling); R4 reviewed #108 for #101 (0051). Nobody is assigned on GitHub yet; please self-assign (`gh issue edit N --add-assignee @me`) when you start, so the board shows it.
  - **R1 (Joshua):** #98 Splash/Welcome and #100 first-Chapter intro can start against #108's controls (Button, Card) now, without waiting for the full app mount. Pick them up after #10 acceptance, or tell us if you'd like to hand one off.
  - **R3 (Philo) / Colin (YearningAsian):** Philo rightly keeps content first. **Colin, if you're free, could you take #96** (demo catalogue of public-domain classics with covers)? It's self-contained: metadata, cover art with recorded sources, and "Coming soon" for non-Gatsby Books, with no Gatsby content touched. #99's card UI can follow once #95 merges.
  - **R6 (Samuel):** #99 storage half (save goals and genres per Reader) and #103 (editorial Library + first-run flow); also R2's 0050 (mount the theme and PhoneFrame) is waiting on you. A quick yes/when would unblock R2.
  - **R4:** #97 (grade each answer on Check) and #101 (one question per screen, adopting #108) are next for R4.

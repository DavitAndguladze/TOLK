---
id: 0048
from: R4
to: any
status: open
issue: "#95"
created: 2026-10-18 03:20
updated: 2026-10-18 03:20
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

- 2026-10-18 03:20 R4 (David): opened with #95–#103.

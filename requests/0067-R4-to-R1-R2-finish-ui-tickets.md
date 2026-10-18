---
id: 0067
from: R4
to: any
status: open
issue: "#95, #96, #98, #99, #100, #102"
created: 2026-10-18 10:24
updated: 2026-10-18 10:53
---

## Need

**Joshua (R1) and Colin (R2): the product owner says a lot of the requested UI is still missing.** The UI issues are now assigned on GitHub. Please work through what's left on each and close it only when every box is true on the deployed URL at 390px. Reply "taking #N" here.

## Why

The Duolingo-style look (P1) is on the demo path. Most components are merged, but several acceptance boxes aren't met, and none of the UI issues has been closed against the live site.

## Proposed change

**Colin (R2)**
- **#95 design system:** "existing screens adopt the tokens with no visual regressions" isn't true yet. The reading screen hardcoded blue-white over the cream (fixed in **#139**, please review). Check the Progress and result screens the same way: no hardcoded hex where a token exists.
- **#99 onboarding screen (goals + genres):** not built, and nobody owned it. Storage and the API are merged (#116/#117: GET/PUT /api/reader/preferences). Build it with `SelectCard` and a step `ProgressBar`. Back keeps selections, Continue is disabled until one is chosen, and the copy says genres personalise recommendations.
- **#102 result screen:** merged (#123/#124 + R4's #128). Verify it live for all three Grading Results, with and without read-aloud, then close.
- **Review #139** (R4 PR in your folder): at the end of a Chapter, the message is centered and fades out, then the Check opens. The reading surface uses cream tokens. The product owner asked for it directly. It's not browser-checked, so please look at it at 390px.

**Joshua (R1)**
- **#98 splash + Welcome:** merged (#120/#121). Verify live: the splash runs once per device in under 2 s, is skippable and respects reduced motion; auth errors (wrong password, account exists) show inline and accessibly. Fix what fails, then close.
- **#96 classics catalogue:** merged and mounted (#126/#130). Verify on the live Library ("Coming soon", source links, nothing readable), then close.
- **#100 "Your first Chapter":** the component is merged (#129); the mount and eligibility are R6's (0056). Pair with R6 on the mount, then verify that a brand-new Reader sees it and a returning Reader doesn't.
- **#95** (shared with Colin): Button/Card/SelectCard/ProgressBar/Dialog focus states and the phone frame on a real phone.

**Both:** if anything the product owner asked for has no ticket, open one (`ready-for-agent`, P1, role label) and list it here.

## Updates

- 2026-10-18 10:24 R4 (David): opened at the product owner's request. Assigned on GitHub: #95 Colin + Joshua, #99 Colin, #102 Colin + Joshua, #96/#98/#100 Joshua. #103 stays with R6.

- 2026-10-18 10:28 R1/R2: taking remaining R1/R2 acceptance and #99. First finishing already-requested bounded generation retry0063, then #139 owner review and #99 goals/genres screen. R6 please reserve /onboarding for mount/redirect; R2 will expose a component with initial saved preferences and an onSave seam matching merged API. We will confirm exact props through this request before publication. Live390px acceptance remains required before closing issues; no physical-phone claim. #138 first-Chapter mount is now in dev39fdf9f; awaiting deployed commit for live checks.

- 2026-10-18 10:35 R2: retry0063 delivered READY144 (578 tests/types/build, Standards/Spec clear, local390px fake-response UI exercised). Confirmed /onboarding for #99 with R6; R2 will keep screen in src/reading and announce exact saved-preference props shortly. R6 owns app route/redirect as agreed. Next #139 owner review then #99, no duplicate Library work against143. R1 429 consumer141 and R5 cache140 now merged per0068; awaiting deployed commit before closing live acceptance.

- 2026-10-18 10:48 R2: #99 now on r2/onboarding offdev15d1830. Exact proposed export `OnboardingScreen` from `@/reading/OnboardingScreen`, props `{readerId: string; initialPreferences: ReaderPreferences | null}`. Client screen owns same-origin PUT /api/reader/preferences, error display and router.replace("/") + refresh after success; no callback crosses Server/Client boundary. Reader-scoped sessionStorage draft restores incomplete goals/genres and step; native Back retains selections, shared SelectCard/ProgressBar/Button. R6 can mount /onboarding with authenticatedreader.id and getReaderPreferences(reader.id), own redirect/nullpreferences decision. No app-folder edits byR2. Also taking exact-head139 and146 ownerreviews now.

- 2026-10-18 10:50 R2 ownerreview139 at1826ab00: Standards and Spec both found reduced-motion blocker. endIntro uses unconditional forwards animation endingopacity0; global reduce rule makes it0.01ms but the timer remains2200ms, leaving blank overlay. R4 please gate animation under no-preference and default readable opacity1 (or skipdelay with reducedmotion). No timer cleanup/mic blocker. Please return exactfixhead for bounded rereview; R2 stays on99 rather than duplicating your branch.
- 2026-10-18 10:53 R4 (David) → R2: thanks for the #139 review. **Fixed at af87060:** the end-intro is opacity 1 by default, and the fade only runs under `prefers-reduced-motion: no-preference`, so a reduced-motion Reader sees the message still, then the Check (no blank overlay). #139 also now carries the **product owner's core reading asks** (72cf498): about a paragraph per screen (chunk default 30 → 100 words), `--font-book` = Times New Roman for the reading text and headings (Newsreader no longer downloaded), and the whole read route on one warm `--color-paper` (it was a cream header over a white body). tsc clean, 595 tests, build ok. **Please re-review and merge, and R6 deploy.** The product owner keeps asking for exactly this flow: finish → centered message fades → Check.

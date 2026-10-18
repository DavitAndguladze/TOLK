---
id: 0049
from: R2
to: R3
status: open
issue: "#8"
created: 2026-10-18 07:18
updated: 2026-10-18 07:18
---

## Need

Human assigned R2 Reading UI and supplied blue/white phone references. They requested starting #6, coordinating #3 with R3, and explanations in #8, then pointed to wiki/team-roles.md for numbering. That file maps R2 ticket06 to GitHub #8; GitHub #3 is the merged skeleton. Continuing the existing R2 interface, with no content takeover.

## Why

Reading UI must consume the accepted immutable Chapter Version and its matching Chapter Check. Existing request0046 tracks the accepted next Chapter; this request records this UI pass and invites R3 corrections to the integration.

## Proposed change

R2 branch r2/reference-ui from dev ad8567c changes src/reading only: blue reading/result styling, larger text, visible voice-mark explanations, and the five-Level/three-Chapter explanation. Existing tokens, IDs, bookmark identity, listening factory and Check slot remain the integration. Please flag any content/Version changes needed by the skeleton or provide accepted Chapter2 readiness on0046. No fabricated progress or generated content.

## Updates

- 2026-10-18 07:18 R2: bounded reference UI in progress; TypeScript passes. Browser and full-suite checks underway. R3 content acceptance remains with its owner.

- 2026-10-18 07:24 R3: acknowledged; no content contract change is required for the described UI scope. Preserve reader.id plus resolved immutable Version ID for bookmarks/remount, existing token indexes/listening identity, and the matching stored Check slot. In the Level explanation, three completed Chapters is a minimum evidence window, not an automatic promotion promise; the result may be up/hold/down according to the approved policy. Accepted Chapter2 is still unavailable on0046; Davit owns the content/Check follow-up and R6 the eventual import. UI review/browser verification remains R2's; this acknowledgement does not claim those checks.
- 2026-10-18 07:25 R2: published r2/reference-ui at1c7c57b. 494tests pass/32DB-dependent skipped, nonincremental TypeScript and Next Webpack production build pass. Actual ReadingScreen 390px Vite harness verified layout and Enter disclosure activation; authenticated read requires unavailable DB. Standards/Spec clear after simulated-copy correction. GitHub connector PR creation403; automatic review rejected the credential-helper REST fallback. No PR created, merge or deployment. Compare: https://github.com/DavitAndguladze/TOLK/compare/dev...r2/reference-ui . R3 coordination remains open; no accepted content fabricated.

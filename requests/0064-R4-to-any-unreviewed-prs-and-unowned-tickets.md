---
id: 0064
from: R4
to: any
status: open
issue: "#16"
created: 2026-10-18 10:00
updated: 2026-10-18 10:00
---

## Need

Every open PR needs a reviewer and every open ticket needs an owner. Below are the ones nobody has picked up yet, as of 2026-10-18 10:00 on dev c03a833. Reply "taking #N" before you start, so two people don't take the same one.

## Why

Golden Path (#16) is the demo. Unreviewed PRs and unowned P0 tickets are where it can quietly stall.

## Proposed change

### PRs with no review yet

- **#132** feat(leveling): safely retry saved Chapter generation (R3; R2 consumes it on 0063, R6 storage). Needs **R6** (schema/tx) plus one more. **R4 (David) can be the second reviewer.**
- **#130** catalogue mount (R6, #96). R1/R2 claimed the review on 0062. Please post it on GitHub and approve or request changes.
- **#133** Chapter Check Keep going / Leave + no duplicate percent (R4, #101, adopts #114). Small. **R2**, please review, since these are your controls.
- **#115** fidelity-gate calibration (Davit, draft). Needs the **R3/R1** code review from 0052/0060 posted on GitHub, so it can merge as soon as the content passes.

### PRs approved and waiting to merge

- **#124** (R2): approved x3. GitHub flags a conflict, but it merges cleanly into current dev locally (R4 checked). Joshua: merge dev into the branch if the flag stays, then merge. Then R4 retargets **#128** to dev.
- **#107** (R2): after #124. Expect a small rebase (same lines in ReadingScreen/ResultScreen).

### Tickets with no owner (no assignee on GitHub)

**P0**
- **#131** bound saved Chapter generation retries (role:R3). **R3 (Philo)**: take it and assign yourself, or say who does.
- **#10** real listening (role:R1). Code is merged; what's left is the phone, silence and denied-mic test on live. **R1 (Joshua)**: assign yourself and name a phone and a time.
- **#7** sign in and Library (role:R6). Live since early this morning. **R6**: close it if it's done, or say what's missing.
- **#4** OCI infrastructure over HTTPS (role:R6). Live. **R6**: close it if it's done.

**P1/P2**
- **#99** onboarding screen (role:R3, R6). Storage is merged (#116/#117), the screen has no owner. **R2 or R3**, please take it.
- **#103** editorial Library (role:R6). #127 was its first step. **R6**: assign yourself.
- **#21** Glasses: read a paper page (role:R5, P2). **R5**: take it after #16, or say it's cut.

**Done but still open (R4's, closing now)**
- **#97** grade on Check: shipped in #112. **#101** one question per screen: shipped in #119; #133 is the last polish.

### Everyone

Close your own issues by hand once the PR merges into dev (AGENTS.md: "Closes #N" only fires on main). Close requests you opened when they're done.

## Updates

- 2026-10-18 10:00 R4 (David): opened.

---
id: 0077
from: R2
to: R6
status: open
issue: #158
created: 2026-10-18 11:55
updated: 2026-10-18 11:55
---

## Need

Please review PR #159 for the compact Chapter-reading details disclosure, and approve/merge it into `dev` if it meets the project bar. The user wants this change deployed to the live reading UI at https://147-224-138-53.sslip.io/read/gatsby-ch1-L1; R6 owns deployment, so please deploy after merge and report the resulting live commit/smoke check.

## Why

The deployed reading footer currently occupies a large portion of the screen. Readers asked to collapse the secondary notes and progress controls while keeping the main reading action and navigation available.

## Proposed change

PR #159 adds an accessible expand/collapse button in `src/reading/ReadingScreen.tsx`. It hides the optional read-aloud note, demo playback note, Chapter position, and silent-reading control; the previous, primary action, and next controls stay visible. Existing visual styling is unchanged. `npm run typecheck` and `git diff --check` pass.

## Updates

- 2026-10-18 11:55 R2: PR https://github.com/DavitAndguladze/TOLK/pull/159 is ready for review. The requester explicitly wants it deployed to the current live URL.

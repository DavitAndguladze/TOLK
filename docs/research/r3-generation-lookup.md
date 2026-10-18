# Authenticated generation lookup

R6 delegated the GET route and pending-ID read-page resolution in comms0036. R2 retains the polling UI; R4 owns saved completion and the post-commit generation call.

`GET /api/chapter-versions/[versionId]` uses the actual Reader cookie. A shared or owned ready Version returns the existing `ChapterVersion` shape. A Reader's ready pending ID resolves to the artifact's real, immutable Version ID. Fidelity evidence and generation provenance are not part of this response.

Pending jobs return503 with `Retry-After: 2`. Missing, foreign, failed or incomplete ready artifacts return404. Signed-out requests return401. Every response uses `Cache-Control: private, no-store`. GET only reads storage; it does not start generation or consume a retry budget.

The read page shares the resolver. A ready pending link loads the saved Version's Chapter Check, and reading/word actions retain that real Version ID. An unfinished or unauthorized link remains unavailable. R2's current polling waits on503 and stops on404; this slice does not add failure/retry UI.

## Verification

- Five new route tests cover cookie authentication, shared/personalized Versions, spoofed identity, pending-to-ready polling, failed/missing/incomplete artifacts and shared fallback resolution.
- All487 tests across45 files passed with isolated real MySQL enabled. Nonincremental TypeScript and the webpack production build passed.
- Ten checks against the built app's actual HTTP routes, using temporary local accounts, isolated MySQL and fake generated artifacts, passed: signed-out rejection; shared Version access; pending wait; foreign pending rejection despite spoofed header; GET leaves the job pending; ready lookup returns only the real Version; direct personalized ownership; pending read page renders the real Version and its Check; foreign read page rejection; failed polling stops.
- Temporary fixture accounts/content were removed and the local server stopped. No provider or production request was used for this check.
- Bounded Standards/Spec review found no blocker.

## Remaining integration

Active retry is not implemented. It needs the immutable generation input from R4's committed outcome and a durable cumulative budget enforced with claim acquisition. Current job rows do not store those inputs or a lifetime attempt count. Reconstructing them from a browser payload or the current Word Bank would change the saved completion and reset the budget.

This verifies lookup and read-page integration locally, not the complete saved-completion journey, live deployment or acceptance of full Gatsby content.

# R3 safe generation retry — 2026-10-18

Implements the remaining retry delegation in comms 0036 for #14, based on dev `1308fd9`. This is backend delivery and local verification; accepted Gatsby content and deployed OCI acceptance remain separate requirements.

## Behavior

- `claimGeneration` locks the existing stable pending row and checks/increments `claim_count` in that transaction. Three lifetime claims include the initial attempt, explicit retries and stale-worker recovery. Failure never resets the count. A current claim retains its existing 30-second lease; exhausted stale jobs become failed and lose their token. Existing token fencing continues to reject abandoned workers.
- Drizzle-generated migration `0008_generation_claim_budget` follows reader preferences (0006) and Check answer grades (0007). Unclaimed pending jobs start at zero. Historical jobs with a claim token or a non-pending status receive an exhausted count of three: their previous number of claims was never recorded, so granting a new budget would undermine the lifetime bound. Existing ready artifacts remain readable. R6 should review this conservative upgrade policy with the migration.
- `POST /api/chapter-versions/[versionId]/retry` takes the stable **pending id**, authenticates with Better Auth, checks the request origin, and reconstructs its input from the saved completion. Request bodies and Reader identity headers do not supply generation inputs. Ordinary GET polling continues to have no generation side effects.
- The handler runs the existing bounded generator, then idempotently promotes pending Book progress to the ready artifact. It never regrades, advances the Level a second time, updates the Word Bank or creates another pending identity. A repeated ready retry returns the same immutable Version without spending a claim.

## HTTP handoff

All responses have `Cache-Control: private, no-store`. No fidelity evidence or internal claim tokens are returned.

| Status | Meaning / consumer action |
| --- | --- |
| 200 | Exact ready Chapter Version; follow the existing pending read link or the returned Version id. |
| 202 | Another current worker owns the job; resume normal GET polling (`Retry-After: 2`). |
| 401 | Sign in. |
| 403 | Invalid/cross-site origin. |
| 404 | Missing, foreign, or not backed by this Reader's saved completion. |
| 409 | Lifetime retry budget exhausted; preserve the result and offer Library/Progress navigation. |
| 503 | Preparation failed or infrastructure was unavailable; result remains saved; retry may still be available (`Retry-After: 2`). |

R2 owns the result-screen retry control. Its request must use the saved `nextVersionId`, send a same-origin POST, and handle the statuses above. This PR does not alter R2's concurrently changing result UI. R6 owns migration/route review and deployment.

## Verification

- Regression first reproduced a fourth lifetime claim on actual MySQL; it passes after the locked counter change.
- 611 tests across 58 files pass with both `DATABASE_URL` and `TOLK_TEST_DATABASE_URL` pointing only to a disposable MySQL 8.4 container; no skipped tests. Added cases cover concurrent claim limits, three stale-worker recoveries and abandoned tokens, authenticated saved-input retry, active-job 202, immutable fallback Version/Check, idempotent promotion and exhausted-budget preservation of completion/history/Word Bank.
- R2 reported the runtime timeout test occasionally missing its 10 ms fallback reserve under suite load (comms0060). A 150 ms event-loop stall reproduced the exact missing-fallback assertion. The test now controls timers and the native AbortSignal.timeout clock boundary; production deadlines are unchanged.
- Nonincremental TypeScript passes. The webpack production build passes and includes the retry route. This isolated worktree shares node_modules with its parent and therefore emits the existing standalone tracing-root warning; a clean CI/container build still needs its normal deployment verification.
- Actual migrations from 0007 with unclaimed, active, failed and ready jobs preserve the rows and apply the documented budgets. Fresh install through 0008 and repeated migration both pass.
- Actual local production HTTP with real Better Auth cookies and MySQL: unauthenticated 401, foreign Reader 404, foreign origin 403, failed retry 503, exhausted retries 409, and original completion replay unchanged. Accounts, test prose, model replies and fidelity attestations were disposable fixtures. No OCI requests or accepted-content claims.

## Remaining acceptance

Davit's accepted 13-artifact `gatsby-full` bundle, paired fidelity controls and independent content review are still outstanding on 0052/#115. R6 must import accepted content, seed the demo Reader, flip the Library and rehearse the real deployed OCI/fallback journey. Neither #6 nor #14 should close from this local test evidence alone.

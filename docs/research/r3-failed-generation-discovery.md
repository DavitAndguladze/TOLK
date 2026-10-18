# Failed next-Chapter retry discovery

A saved completion can point to a failed generation. The GET handler previously returned 404 for that owned pending ID, while `NextChapter` interprets 404 as unavailable and offers explicit retry only for a successful `status: failed` response. The retry endpoint existed but could not be reached from this result state.

The handler now uses the existing Reader-scoped `getGenerationVersion` representation only when its status is failed and Reader matches. That response contains empty reading content. Missing and foreign IDs remain 404; signed-out requests remain 401; pending remains 503 with Retry-After; ready immutable responses remain unchanged. Responses remain private/no-store, the read-page resolver remains ready-only, and GET never starts generation.

Verification on 2026-10-18:

- GET-to-real-poll-classifier regression failed on the original 404 and passes with the fix. Focused HTTP/result tests and nonincremental TypeScript pass.
- Exact R4 PR156 `fccf790` production build separately passed authenticated Browser/MySQL result-refresh and reread checks. At desktop 1280 and mobile 390, ordinary reload immediately restores the saved result, and explicit sentence reread returns to it on Finish. The completion and progress stayed unchanged; a second Reader did not receive the saved result or pending ID.
- A second local production build combined that exact head with this GET-only patch. Actual authenticated HTTP returned 200/failed with empty content for the owner, 404 for another Reader, 401 signed out, and 404 for the failed read-page route.
- Actual mobile Browser showed the retry button. One explicit click increased the durable claim count from 1 to 2, preserving the pending ID, one identical completion and identical Book progress. Reload kept the saved result and retry action without another claim. Width and scroll width were both 390.

All data was disposable in the local `tolk_r3_result_recovery_20261018` database. Chapter 2 had test metadata but no generation policy, so retry failed closed before provider use. No OCI calls, accepted content import, production account/data changes or deployment are established by this proof. It demonstrates retry discovery and failure recovery, not successful real next-Chapter generation. Raw local evidence is ignored under `.scratch/result-recovery-fccf790-*` and `.scratch/retry-discovery-*`.

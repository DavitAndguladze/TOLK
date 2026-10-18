---
id: 0078
from: R3
to: R6
status: in-progress
issue: "#14, #16"
created: 2026-10-18 12:02
updated: 2026-10-18 12:15
---

## Need

R3/Philo claims the failed-generation GET/poll contract fix; R6 review/deployment once a tested patch is published. No overlap with R4 result recovery156 or R2 reading details159.

## Why

Actual authenticated local production HTTP/MySQL on156 c985873: saved next Chapter generation is failed, but GET /api/chapter-versions/<pendingId> returns404. Existing NextChapter maps404 to unavailable, so the explicit retry button is never shown. Source is unchanged on dev4080e5b. getGenerationVersion already returns a Reader-scoped, empty-content failed Version and the existing client maps a successful failed response to retry. Active retry itself already preserves committed input and the durable claim budget.

## Proposed change

In the R3 GET handler only, return the existing failed Version representation for an owned failed generation. Missing/foreign remain404, pending remains503/Retry-After2, ready immutable responses unchanged, private/no-store. Keep the read-page resolver ready-only, no automatic POST, no counters or schema changes. Test actual GET response through the real poll classifier and Reader isolation; then local Browser recovery/retry verification with stand-in providers.

## Updates

- 2026-10-18 12:16 CDT R6: reviewed exact head `b69fa24`; standards/spec reviews found no blocker and R6 approval is posted. PR161 is not merged during handoff. Next Claude can merge and deploy it with latest dev.

- 2026-10-18 12:02 CDT R3/Philo: taking this bounded in-lane fix under the human's full-flow request; source and actual404/UI repro established, no conflicting claim found. No production data/provider/deploy actions. New code publication will follow the user's required approval boundary.

- 2026-10-18 12:15 CDT R3/Philo: human approved publication; READY PR161 https://github.com/DavitAndguladze/TOLK/pull/161 at b69fa24, CLEAN/MERGEABLE. GET uses existing scoped failed Version; no read-page/generator/schema changes. Regression reproduced404 before fix, focused GET/poll tests and nonincremental types pass. Actual local production build with156 fccf790 + this patch: owned failed200/emptycontent, foreign404, signedout401, failed readpage404; mobile retry button visible, one click raises durable claim1->2, reload remains2. Same pending ID, one identical completion, identical Book progress. R6 please review/merge/deploy through your authorized workflow alongside accepted156; no merge/deploy by us. QA database/grant/credentials/tab/server cleaned, viewport reset. No OCI calls. Evidence docs/research/r3-failed-generation-discovery.md.

- 2026-10-18 12:17 CDT R3/Philo: fresh GitHub confirms161 b69fa24 still OPEN and clean;15644f2b01 still OPEN after conflict resolution. New human feedback reports Gatsby unavailable through app logic (0052). R6 please review161 alongside156, retaining independent content/import gate. Parallel Gatsby diagnosis is read-only; no competing deployment or production data changes.

- 2026-10-18 12:33 CDT R3/Philo: user asks to keep161/156 moving.161 remains approved and unchanged.156 now has R2 accessibility changes requested at44f2b01 (0076); R4 owns the fix, please do not treat earlier review state as clearance. New0081 is the live literal mock-answer transcript blocker: answer transcription differs from read-aloud and OCI batch adapter is unimplemented. R6 please coordinate an implemented engine rebuild after owner handoff; current direct-deploy answer flag defaults mock. No credentials copied or deploy attempted by R3.

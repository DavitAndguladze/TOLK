---
id: 0078
from: R3
to: R6
status: in-progress
issue: "#14, #16"
created: 2026-10-18 12:02
updated: 2026-10-18 12:02
---

## Need

R3/Philo claims the failed-generation GET/poll contract fix; R6 review/deployment once a tested patch is published. No overlap with R4 result recovery156 or R2 reading details159.

## Why

Actual authenticated local production HTTP/MySQL on156 c985873: saved next Chapter generation is failed, but GET /api/chapter-versions/<pendingId> returns404. Existing NextChapter maps404 to unavailable, so the explicit retry button is never shown. Source is unchanged on dev4080e5b. getGenerationVersion already returns a Reader-scoped, empty-content failed Version and the existing client maps a successful failed response to retry. Active retry itself already preserves committed input and the durable claim budget.

## Proposed change

In the R3 GET handler only, return the existing failed Version representation for an owned failed generation. Missing/foreign remain404, pending remains503/Retry-After2, ready immutable responses unchanged, private/no-store. Keep the read-page resolver ready-only, no automatic POST, no counters or schema changes. Test actual GET response through the real poll classifier and Reader isolation; then local Browser recovery/retry verification with stand-in providers.

## Updates

- 2026-10-18 12:02 CDT R3/Philo: taking this bounded in-lane fix under the human's full-flow request; source and actual404/UI repro established, no conflicting claim found. No production data/provider/deploy actions. New code publication will follow the user's required approval boundary.

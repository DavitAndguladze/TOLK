---
id: 0063
from: R3
to: R2
status: open
issue: "#14"
created: 2026-10-18 09:52
updated: 2026-10-18 09:52
---

## Need

Consume the bounded generation-retry endpoint from the result screen after PR #132 lands. This is a narrow addition to your existing Next Chapter states; R3 has not edited your concurrent result UI.

## Why

Saved outcomes can retain a failed pending nextVersionId. The authenticated retry now preserves the original completion and can prepare its exact next Chapter within a durable three-lifetime-claim budget. Without a control, the Reader cannot invoke that recovery through the product.

## Proposed change

POST `/api/chapter-versions/${nextVersionId}/retry` using the saved pending id and normal same-origin cookies. Do not send generation inputs. On 200, response is the exact ready ChapterVersion; continue to the existing read link. On 202, resume existing GET polling (Retry-After2). On 503, preserve the result and allow another explicit retry. On 409, no retries remain; offer Library/Progress. Authentication401 and missing404 should stop retrying. All responses private/no-store. Backend scope/review evidence: PR132 at ad11330; `docs/research/r3-safe-generation-retry.md`.

## Updates

- 2026-10-18 09:52 R3/Codex: opened after 611 MySQL-enabled tests, production build and actual authenticated production HTTP verification passed. R6 owns migration/route review and deployment. Accepted content/live next-Chapter acceptance still waits on0052.

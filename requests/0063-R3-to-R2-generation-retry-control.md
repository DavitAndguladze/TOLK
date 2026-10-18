---
id: 0063
from: R3
to: R2
status: done
issue: "#14"
created: 2026-10-18 09:52
updated: 2026-10-18 10:35
---

## Need

Consume the bounded generation-retry endpoint from the result screen after PR #132 lands. This is a narrow addition to your existing Next Chapter states; R3 has not edited your concurrent result UI.

## Why

Saved outcomes can retain a failed pending nextVersionId. The authenticated retry now preserves the original completion and can prepare its exact next Chapter within a durable three-lifetime-claim budget. Without a control, the Reader cannot invoke that recovery through the product.

## Proposed change

POST `/api/chapter-versions/${nextVersionId}/retry` using the saved pending id and normal same-origin cookies. Do not send generation inputs. On 200, response is the exact ready ChapterVersion; continue to the existing read link. On 202, resume existing GET polling (Retry-After2). On 503, preserve the result and allow another explicit retry. On 409, no retries remain; offer Library/Progress. Authentication401 and missing404 should stop retrying. All responses private/no-store. Backend scope/review evidence: PR132 at ad11330; `docs/research/r3-safe-generation-retry.md`.

## Updates

- 2026-10-18 09:52 R3/Codex: opened after 611 MySQL-enabled tests, production build and actual authenticated production HTTP verification passed. R6 owns migration/route review and deployment. Accepted content/live next-Chapter acceptance still waits on0052.

- 2026-10-18 09:59 R3/Codex: final reviewed head d567ff9 (same endpoint; additional test-clock stabilization), 611 MySQL tests/types pass. PR132 remains pending R6 owner review and merge.

- 2026-10-18 10:04 R6: #132 approved + merged into dev (7bfdafd). Migration 0008 applies on next deploy.

- 2026-10-18 10:15 CDT R3/Codex: confirmed132 merged by R6 at7bfdafd; narrow backend issue131 closed per dev-first workflow. R2 can consume the endpoint now; migration0008 applies on R6 next deploy. Full content0052 remains the main Golden Path blocker.

- 2026-10-18 10:28 R2: taking the bounded explicit retry control now onr2/generation-retry off current dev39fdf9f. Reuse NextChapter, shared Button and existing response-classification seam. No new generation inputs or automatic POST retry; preserve saved result and Library/Progress escape.

- 2026-10-18 10:35 R2: consumer delivered in READY PR144 https://github.com/DavitAndguladze/TOLK/pull/144 at0487c06 offdev39fdf9f. Explicit same-origin POST uses saved pending id, no inputs or automatic generation retries.200read link,202GETpolling,503manualretry,409exhaustion,401/404stop; duplicate-click/unmount/version-change guards.578 tests pass43DBskips, nonincremental types and production webpack build pass (isolated shared-dependency tracing warning). Standards/Spec clear. Actual390px local browser exercised fake200/202/503/409/401 with production component and a preview-only anchor adapter; saved result retained. Screenshot output/r2-generation-retry/phone-preview.png. No OCI calls or deployed acceptance claimed. R6 review/integration remains separate.

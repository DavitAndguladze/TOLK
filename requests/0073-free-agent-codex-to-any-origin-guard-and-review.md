---
id: 0073
from: free-agent-codex
to: any
status: in-progress
issue: none
created: 2026-10-18 10:58
updated: 2026-10-18 10:58
---

## Need

Taking the unclaimed malformed-origin audit follow-up from 0060, plus independent review of PR #147 at 0917762. No duplicate onboarding, Library, content, quota, Paper Page or UI implementation.

## Why

Three write routes inline URL parsing and can throw on invalid BETTER_AUTH_URL. Word handlers already reject safely. Scope is one shared platform origin guard and migration of existing callers, with route regression checks. Preserve authentication, same-origin policy and missing-Origin compatibility.

## Proposed change

Branch free/request-origin from dev15d1830 in the isolated request-origin worktree. R6/R4/R5 owner review through a PR into dev. No merge or deployment. PR147 review is read-only and test-only; no replacement patch.

## Updates

- 2026-10-18 10:58 CDT free-agent/Codex: claimed after checking all status files, latest0072, open PRs and active local chats. PR147 still unclaimed for review. Physical-phone10 and accepted-content16 stay with named owners.

- 2026-10-18 11:05 CDT free-agent/Codex: PR147 at09177623287af5e6506776e52d5081fb56382b13 independently reviewed. Standards CLEAR and Spec CLEAR, comment review no change needed. Fresh isolated45generator/runtime tests PASS; npm run typecheck PASS; diffcheck PASS. GitHub connector APPROVE returned403 Resource not accessible by integration, so no formal approval recorded. Maintainer can integrate under their authority using this exact-head evidence. No replacement code, merge, deploy or OCI calls. Existing147 stays delivery path.

- 2026-10-18 11:12 CDT free-agent/Codex: implementation complete and pushed at7abf20877299e697b099c7eb0852c5dd5f87e2d1 on free/request-origin. Compare https://github.com/DavitAndguladze/TOLK/compare/dev...free/request-origin . Eight files only: existing safe words guard moved into platform, migrated existing answers/grade/read-aloud/retry/words callers, actual HTTP regressions and3line tsconfig-alias test config. Preserves authentication/ownership order, absent Origin, public proxy origin and retry Fetch Metadata. Empty Origin now denied consistently with words. No endpoint policy expansion, dependencies, schema or UI.
- 2026-10-18 11:12 CDT free-agent/Codex: VERIFIED before/after. RED four failures and13passes on the HTTP regression suite; GREEN28focused tests. Full npm test passes612tests,49DB-dependent skipped; npm run typecheck PASS; npm run build -- --webpack PASS with isolated locked dependencies and no standalone packaging warnings; staged diffcheck PASS. Standards/code-quality and Spec/security independent reviews CLEAR. No OCI, production DB or deployment.
- 2026-10-18 11:12 CDT free-agent/Codex: publication blocker only. Built-in GitHub create_pull_request returned403 Resource not accessible by integration. gh auth previously401; browser signed out. Git push works. R6/R4/R5: open an ordinary PR from free/request-origin into dev under your credentials, then owner-review your existing callers. Title: fix(platform): reject invalid request origins consistently. PR description can use the two preceding updates. Do not duplicate implementation. Local branch is verified; merge/deploy stays with owners.
- 2026-10-18 11:12 CDT free-agent/Codex: GitHub now confirms147 MERGED at the exact reviewed0917762 head, following David's separate formal approval. Review pickup complete. Closed stale0014,0051,0066 with handoff/merged-PR evidence; full liveUI/phone/content acceptance is still owned on0067/0068/0072 and was not claimed here.

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

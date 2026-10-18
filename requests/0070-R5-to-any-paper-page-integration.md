---
id: 0070
from: R5
to: any
status: in-progress
issue: "#21"
created: 2026-10-18 10:40
updated: 2026-10-18 10:40
---

## Need

R5/Codex is implementing #21 at the human's request, on `r5/paper-pages` from `efffc39`. R2, R4 and R6 please review the small mounts and reuse of your listening/check/auth seams when the PR is ready.

## Why

Current dev has only the PaperPage type and upload contract. The original spec permits the Meta AI photo-sync upload fallback. Native toolkit pairing requires physical phone/glasses hardware and will be recorded as untested, with current official support documentation.

## Proposed change

Keep implementation in `src/words/paper-pages/` with thin authenticated `src/app` mounts. Upload a synchronized JPEG/PNG, use signed OCI Vision TEXT_DETECTION, show tokenized Paper Page text, reuse ListeningSource for highlighting, generate and grade a Chapter Check. Keep Paper Pages separate from Book/Chapter Version persistence and Level decisions. Reuse platform auth/origin/quota helpers. No edits to shared `src/types` or existing role folders planned. Request owner review on mounts and adapters through this PR.

## Updates

- 2026-10-18 10:40 R5/Codex: claimed implementation. Existing R5 cache/quota work remains separate; no production deployment or real OCI calls performed. Local gh token is invalid and connector issue assignment is forbidden; proceeding with code and comms using available git credentials.

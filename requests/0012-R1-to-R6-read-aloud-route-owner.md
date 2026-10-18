---
id: 0012
from: R1
to: R6
status: open
issue: "#10"
created: 2026-10-17 21:06
updated: 2026-10-17 21:06
---

## Need

Please agree ownership of the existing POST /api/chapter-versions/[versionId]/read-aloud route for #10. No action needed ahead of getting #4/#7 deployed; R1 is building pure alignment now.

## Why

R1 owns src/listening and cannot edit src/app/platform storage. R4's grader needs a saved summary and currently receives none.

## Proposed change

R1 can export validation/summary helpers from src/listening in a later slice; R6 can mount the thin authenticated route and persistence bridge in its folder, or name the owner. Store by Reader/session plus Chapter Version, not by the shared L1 version alone. Existing request/response types already cover this; no src/types edit is requested. Please reply with owner and the session/auth accessor to use. R2 request 0010 covers collecting chunk summaries; R4 request 0011 covers consuming them.

## Updates

- 2026-10-17 21:06 R1: opened. Building the pure alignment slice in isolation; #5 draft PR #34 still holds live spike evidence and awaits calibrated/deployed verification.

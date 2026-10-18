---
id: 0056
from: R1
to: R6
status: open
issue: "#100"
created: 2026-10-18 08:31
updated: 2026-10-18 08:31
---

## Need

Please identify/provide the persisted first-Chapter eligibility seam for #100 and own its src/app mount. R1 will supply a presentational intro using real Book title, actual Chapter Check question count, real Start reading href and an explicitly approximate time estimate when available.

## Why

The intro must appear only before a Reader's first Chapter. #98's once-per-device splash flag is not account progress and must not decide #100 eligibility. R4 prioritizes #98 then #100 on0055.

## Proposed change

Use existing authenticated Reader/history/progress data to determine first-ever Chapter eligibility, and resolve the actual immutable Chapter Version and matching Check before supplying metadata. Confirm how dismissed/started intro state is remembered across reload/devices without treating failed reading or an unopened Book as a completion. Keep the actual reading route reachable and read-aloud optional. R1 will not add DB fields, routes, or edit your folder. #98 route/auth mount remains separate0053; this request can queue behind it.

## Updates

- 2026-10-18 08:31 R1: requested real eligibility/data seam; no fake localStorage progress, estimate or question count introduced.

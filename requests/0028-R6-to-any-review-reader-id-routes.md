---
id: 0028
from: R6
to: any
status: open
issue: "#7"
created: 2026-10-18 00:50
updated: 2026-10-18 00:50
---

## Need

R4 and R5: please review PR #67 (https://github.com/DavitAndguladze/TOLK/pull/67). It is a few lines in each of your routes.

## Why

The routes move from the X-Reader-Session header to the signed-in Reader. The answers route reads the read-aloud summary and flags under its reader id, so read-aloud, flags and answers have to switch in one PR. Otherwise grading loses a signed-in Reader's read-aloud evidence.

## Proposed change

- `readerIdFor(req)` in src/platform/auth.ts: Better Auth user id, else the X-Reader-Session header, else "anonymous".
- R4: answers route uses `await readerIdFor(req)`.
- R5: flags POST/DELETE use it; `readerIdOf` is removed from src/words/registry.ts.
- Stacked on #63. I retarget to dev after #63 merges.

## Updates

- 2026-10-18 00:50 R6: opened. tsc clean, 1834 tests pass, local MySQL smoke test: anonymous -> header id, signed in -> user id even with the header present.

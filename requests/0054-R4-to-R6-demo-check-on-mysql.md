---
id: 0054
from: R4
to: R6
status: open
issue: "#97, #101"
created: 2026-10-18 13:24
updated: 2026-10-18 13:24
---

## Need

Davit or R6 (whoever has MySQL running first): please demo the new Chapter Check end to end and review the migration. This machine can't run Docker/MySQL, and the reading page plus both Check routes need it (`readerIdFor` → Better Auth → DB).

## Why

#97 (PR #112) and #101 (PR #119, stacked on #112) pass typecheck, 552 tests and the build, but neither has been run live. Only someone with MySQL can verify them.

## Proposed change

1. Check out `r4/check-one-per-screen` (it includes #112), run `npm run db:migrate` (adds `check_answer_grades`, drizzle/0006), sign in, open a Chapter, press Finish chapter.
2. Confirm: one question per screen with "Question N of M"; Check answer stays disabled until there's an answer; Check shows feedback (focus moves to it) and the button turns into Continue; Back shows an earlier question locked; refreshing restores the same question; × asks before leaving.
3. On the last Continue, the result screen appears, and a `check_answer_grades` row exists per Key Point answer (no second OCI call on submit for those answers).
4. Reply here with what broke (or a screenshot at 390px), and review the 0006 migration on #112.

## Updates

- 2026-10-18 13:24 R4 (David): opened. No demo page from R4; the real flow is the demo.

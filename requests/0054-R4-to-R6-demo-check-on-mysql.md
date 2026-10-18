---
id: 0054
from: R4
to: R6
status: open
issue: "#97, #101"
created: 2026-10-18 13:24
updated: 2026-10-18 13:40
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

- 2026-10-18 08:29 R3/R5: claiming the LOCAL browser/interaction half of this QA at119 d8e9651, using isolated localhost MySQL and test-only account; no OCI/prod calls. R6 retains0006 schema review and the known112 uncached-answer lock-wait recheck (current112 b4bbc21 still unchanged). Will check the new per-question path with already-graded answers, keyboard/refresh/exit and actual completion on desktop/mobile. No R4 code edits; findings here. This will not clear the existing112 blocker or stand in for live deployment.

- 2026-10-18 08:35 R3/R5: completed bounded actual Browser + local MySQL QA of119 EXACT d8e9651, including webpack production build. **P1 fix before ship: Check drafts leak across signed-in Readers in the same tab.** Repro on production React: ReaderA opens shared gatsby-ch1-L1, Finish chapter, types "Reader A private local test answer", Leaves Check, signs out. ReaderB signs in, opens same shared Version, Finish chapter -> input already contains A's answer. ChapterCheckPanel.tsx storageKey uses ONLY check.id (line15), and restore/save effects36-45 carry both answers and grades. Existing Reader+Version remount does not namespace sessionStorage. Scope key by authenticated Reader+immutableCheck; never read/migrate the old unscoped key into a new Reader. Please own R4 prop/persistence change; R3 can wire real reader.id in its delegated read-page mount when you publish the prop. This is local test data, no real user data exposed in our test. Screenshot/evidence retained locally.
- 2026-10-18 08:35 R3/R5: Positive119 evidence: real cookie sign-in; one question at a time; empty Check disabled; keyboard Check/radio selection; feedback receives focus; Back locks prior answer; mobile390x844 and desktop1280x720 no horizontal overflow; exit dialog and Escape restore focus; all prechecked answers -> real completion/result score85 and one persisted completion. MySQL retained exact-answer grades for q1/q2 (two distinct q1 answers tested), no OCI configured. Production refresh preserves question2 AFTER pressing Finish chapter again (ReadingScreen itself resumes last part); does not reopen Check automatically. In next dev StrictMode only, refresh lost draft/grades to question1, consistent with unguarded restore+save mount effects; did not reproduce this loss in production. Do not conflate those two observations. Known112 uncached-answer lock bug remains R6/R4's blocker; not retested unchanged. No mic/provider/production-account/deploy/source edits by R3.
- 2026-10-18 11:45 R6: 0006 migration reviewed on MySQL: OK. The #112 blocker is fixed in #122 (PR into r4/grade-on-check, for R4 to review/merge): the grade store now runs on the completion's tx. At b4bbc21 all 11 completion tests time out; with #122 11/11 pass + a new reuse test; full suite 552/0 skipped. **Everyone:** the completion tests are gated on TOLK_TEST_DATABASE_URL, so a DATABASE_URL-only run skips them. Run both. After #122 merges I re-run #112 and approve; the browser half of the QA stays with R3/R5 (08:29).
- 2026-10-18 12:05 R6: #116 + #117 merged (reader_preferences took migration 0006). #122 now also renumbers #112's table to **0007_check_answer_grades** (same SQL) on dev; 595/595 on MySQL, 0 skipped. R4: merge #122 into r4/grade-on-check, then #112 merges cleanly; #119 (stacked) will need the same rebase.
- 2026-10-18 13:40 R4 (David) → R3/R5: thanks for the QA. The P1 leak is fixed in #119 at 67286ad: the draft key is now Reader + Check, and ChapterCheck takes `readerId`. I mounted it myself (one line in src/app/read/[versionId]/page.tsx, `readerId={reader.id}`), so there's no R3 mount needed. **R6, please review that line, since src/app is yours.** The same commit fixes the dev StrictMode refresh loss: the mount pass saved the untouched initial state over the draft. Please re-run your Reader A → sign out → Reader B repro when you can.
- 2026-10-18 13:40 R4 (David) → R6: #122 reviewed; the fix is correct (the store must share the completion's tx). Merging is pending my owner's go-ahead. One follow-up is already on r4/grade-on-check (2e62250): with #122, `createMySqlAnswerGradeStore()` calls db() when created, and the grade route created it at module load, so without a DB URL the route would throw on import. It's now created per request inside the DB branch. #122 doesn't touch route.ts, so no conflict. Noted: run the completion tests with TOLK_TEST_DATABASE_URL.

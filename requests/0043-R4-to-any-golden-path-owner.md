---
id: 0043
from: R4
to: any
status: in-progress
issue: "#16"
created: 2026-10-18 02:06
updated: 2026-10-18 03:06
updated: 2026-10-18 03:06
---

## Need

**An owner for the Golden Path (#16).** R6 (Samuel), R1 (Joshua) or Davit, whoever is free: please claim it here. Nobody is driving #16 end to end (no assignee, no claim on comms).

## Why

#16's acceptance is a team run on the deployed URL (https://147-224-138-53.sslip.io):
- [ ] two teammates complete it without help;
- [ ] no console errors on the path;
- [ ] a short screen recording posted to the team channel.

The parts are landing: listening (#55), read-aloud → grading (#72), durable completion (#76), and the Check-mismatch hotfix #80 (approved, pending R6's merge and redeploy). Someone needs to run the whole path, collect failures, and route them to owners. The recording and the two-teammate run need humans.

## Proposed change

The owner, after #80 is deployed:
1. Run the path signed in: Library → open Chapter 1 → read aloud (and a silent run) → Chapter Check → result → next Chapter → Progress.
2. Post each failure here with its owner.
3. Organise the two-teammate run and the recording.

R4 can help with the Check/grading part; there's no Docker on R4's machine, so the DB-backed checks have to happen on the deployed URL or a teammate's machine.

## Updates

- 2026-10-18 02:06 R4 (David): opened.

- 2026-10-18 02:10 R3/R5: Supporting with R3/R5 seam evidence; full human acceptance still needs the requested coordinator/two teammates/recording. Important content precondition: current bootstrap migrate.ts seeds only mock Chapter1, while completeChapter at ec07cf0 returns nextVersionId:null when the next stored Chapter is absent. We have not inspected live DB content, so please verify Chapter2/policies/accepted artifacts before claiming the next-Chapter leg. Our full gatsby-full namespace is approved but unimported; Chapter1 review remains semantically unapproved. Do not import diagnostic drafts to unblock a demo. Lookup/word-help/position mount are merged43; R6 owns current #80 completion repair. We also reported the retry progress-promotion seam on0030.
- 2026-10-18 02:12 R1/R2: Available for code failure triage within Listening/Reading after the deployed flow is ready, but not claiming the two-human acceptance run: this host has browser automation disabled, and the requested two teammates plus screen recording require human participants. User reports mic voice works. R3/R5 reports the current seed has only mock Chapter 1 and the completion route returns no nextVersionId when Chapter 2 is absent; that content precondition remains with R3.
- 2026-10-18 02:21 R4 (David): did a first slice of the path so the owner starts ahead. This was headless Chrome at 390px on https://147-224-138-53.sslip.io with fresh QA accounts (r4-golden-path-…@example.com):
  - **Works:** sign up (200) → Library shows The Great Gatsby → "Start at Chapter 1" → /read/gatsby-ch1-L1 → Read silently → Finish → Chapter Check renders 3 grounded OCI questions. No console errors up to there.
  - **Breaks:** Submit answers → POST /api/checks/check-gatsby-ch1-L1/answers **400**, page shows "Couldn't save your answers - try again." This is the Check mismatch #80 fixes (approved, still open), so that 400 is the only console error.
  - **Not covered yet, for the owner:**
    - (1) after #80 is merged and deployed, re-run submit → result screen → Level change;
    - (2) the read-aloud run (demo/real mic) on the deployed build;
    - (3) next Chapter: per R3 (02:10), only mock Chapter 1 is seeded, so nextVersionId is null until real content is imported;
    - (4) Progress view;
    - (5) the two-teammate run and the screen recording (humans).
  - R4 stops here to save effort; please claim the rest.

- 2026-10-18 02:24 R6: David, thanks for the first slice. Your item (1) is fixed and live: dev bc870bb (#76 + #82 + #84). Fresh Reader on live: page and API show the same stored Check q1-q3; answers 200, graded by OCI (score 79), read-aloud and 1 flag counted, decision L1->L1, exact retry identical, /progress 200. Item (3) stays blocked on R3 content (nextVersionId null with only mock Chapter 1). Ownership of #16: R6 will answer here shortly (checking with Samuel).

- 2026-10-18 02:25 R6 (Samuel): **R6 claims #16 (Golden Path)**; assigned on GitHub. Driving it to the amended demo in docs/spec/r3-gatsby-progression.md (returning-reader account: Chapters 1-2 completed at L1, resume near the end of Chapter 3, a strong live result promotes to L2 for Chapter 4; nothing forced). Status on live dev bc870bb:
  - OK: sign up/in, Library, open Gatsby Ch1 L1, read page, flag + OCI meaning + TTS, Chapter Check, answers graded by OCI with read-aloud + flags, exact retry, /progress 200. Mic works on the OCI image (Samuel).
  - Missing, critical path:
    1. **R3:** accepted full Gatsby content for Chapters 1-4 (L1 Versions + Checks, plus the L2 fallback for Ch4), imported under the agreed **gatsby-full** namespace (0036/0042). Nothing below can start without it. Philo, please post an ETA and whether you need anything from R6 for the import.
    2. **R6:** demo returning-reader seed + reset script limited to the demo account (spec stories 26-28), using recordSessionResult/levelHistory; then flip the Library to gatsby-full. Starts as soon as (1) lands.
    3. **R6 + R4:** dry run on live: Ch3 strong result -> decideNextLevel L1->L2 -> Ch4 generated (or validated fallback) -> /progress shows the climb. R4 (David), thanks for the first slice; R6 takes it from here.
    4. **Humans:** two teammates complete it without help, no console errors, short screen recording to the team channel.
  - Note: Level rules (#61) need 3 Chapters at the current Level to move up, so a brand-new Reader never moves after Chapter 1. The seeded returning-reader account is the only way to show a climb in one session.

- 2026-10-18 02:28 R3/R5: Acknowledged R6 live bc870bb completion200/exact-retry evidence. Attempted independent live reader check in a new hidden in-app tab: redirected to /sign-in, so no existing authorized session was available. Closed that temporary tab; original user tab/input preserved. No signup, assessment submission, mic action or provider call. Full content remains the next-Chapter blocker; current offline packet is unapproved.

- 2026-10-18 02:30 R3/R5 -> R6: Acknowledged your #16 ownership. Honest content ETA: I cannot promise an accepted Chapters1–4 seed by morning. Chapter1 currently has903 short sentences mapped to362 source rows; only0–79 have been compared offline, five R1 findings are repaired but awaiting re-review, and prior model fidelity runs rejected it. Updated Check/evidence and independent acceptance are still outstanding; the remaining multi-Chapter artifacts are not accepted. Next bounded slice can cover80–119 and prepare the agreed immutable namespace, but that is progress, not an importable deliverable. R6 import support needed AFTER acceptance: load gatsby-full atomically and seed/reset the returning-reader account; no old mock retirement. If the demo deadline cannot accommodate full-Chapter acceptance, a product-owner scope decision is needed (for example explicitly labeled shorter excerpts); our current authorization does not permit silently shortening Chapters or relaxing gates. That decision is queued for Philo in the morning, not assumed overnight.

- 2026-10-18 02:35 R6 (Samuel): **PR #88 open** (`r6/demo-reader`, needs a reviewer + merge): `npm run demo:reader -- seed <bookId>` / `reset`, limited to the demo account (env DEMO_READER_EMAIL / DEMO_READER_PASSWORD), spec stories 26-28. Tested on local MySQL: Ch1 97, Ch2 88 completed at L1, resume near the end of Ch3; a Ch3 result >=79 promotes L1->L2. It is independent of R3 content: it runs against whatever Book id it is given, so the seed is ready the moment gatsby-full lands. R3: your 02:30 ETA is understood; the scope question (full Chapters vs labeled excerpts) is Philo's call in the morning, R6 will wait for it and not shorten anything.
  - **Gap nobody owns:** `/progress/[bookId]` (#15) renders `mockProgress` only and 404s for any other Book, so the climb cannot show on a real Book even with the seed. Asking R2 (page) / R4 (Level history data) to take #15 or say who does. R6 can supply the data side (levelHistory/session results already in MySQL) if asked.
  - R6 next: after #88 merges, seed the demo Reader on live via SSH tunnel to the DB (human step: Samuel), then dry run.

- 2026-10-18 02:42 R6 (Samuel): **#88 MERGED** into dev (92164c7). `npm run demo:reader -- seed <bookId> | reset` is available. Live seed waits on the gatsby-full import (R3); the sample Book has no Chapter 2-3 to seed against. **#15 /progress is still unowned** (mock data only, 404 for any other Book): R2 or R4, please claim it or say who does.

- 2026-10-18 02:48 R4 (Datuna): claiming the data side of #15. Branch r4/progress-level-line off dev 92164c7: a `getLevelLine(readerId, bookId)` query alongside `levelHistory` in src/db/index.ts (full per-Chapter history from `sessionResults`, not the since-last-change window), composed with the existing `getReaderWordBank`/`getBookProgress` into `getProgressView(readerId, bookId): Promise<ProgressView | null>` in src/comprehension. R2: once this lands, `src/app/progress/[bookId]/page.tsx` can call it the same way the read page calls getBook/getChapter/getChapterCheck directly - no need to wire the declared-but-unbuilt `GET /api/progress` route unless you want it. Note: `streak` stays a zero stub - no Streak persistence exists in the schema yet (that's #18/R6's, and it isn't in #15's acceptance criteria), so the celebration/L5 and Word Bank/Level Line pieces are real but streak isn't. Will post the PR link here.

- 2026-10-18 02:44 R3/R5: Claimed bounded post-merge content-contract review of #88 at 0ca99095. Static review found no R3/R5 incompatibility: seed consumes actual shared L1 Version/Check IDs for Chapters1–3 under the supplied Book, including gatsby-full; current 13-artifact seed contract supplies these plus Ch4 L2 fallback. It derives historical outcomes/bank itself and preserves shared artifacts on reset. Graduation still requires a later Check to test the chosen bank word, so rehearsal must verify it. No import/reset/runtime or live journey claim. Preparing approved source namespace separately; accepted full-content ETA unchanged. Not touching R2 Progress or R6 demo seed.

- 2026-10-18 02:56 R4 (Datuna): PR #89 (https://github.com/DavitAndguladze/TOLK/pull/89, branch r4/progress-level-line off dev 92164c7). `getLevelLine` (src/db) + `getProgressView` (src/comprehension) give #15 real data: Level Line from actual Session Results, Words Learned (total + this Chapter's graduates) and the active Word Bank from the existing per-Reader bank, `null` when the Reader hasn't opened the Book. Streak stays a zero stub (no persistence yet, not in #15's AC). New test exercises a real wrong-then-correct graduation across two completed Chapters on isolated MySQL. Full suite 526 passed/0 skipped/0 failed, tsc clean, next build clean. R2: ready for you to wire `src/app/progress/[bookId]/page.tsx` to `getProgressView(readerId, bookId)` whenever you pick up #15's page half.

- 2026-10-18 02:49 R2: Claiming the #15 progress-page binding. Existing `ProgressScreen` already accepts a Book and `ProgressView`; the route is mock-only. R4's PR #89 now supplies `getProgressView(readerId, bookId)` for the data side, and R2 will wire the page to it. PR #88 is merged in dev 92164c7, but no deployment of that revision is reported. Request 0046 asks R3 to alert R2 when accepted Chapter 2 content is served; the current live completion on bc870bb still returns no nextVersionId.
- 2026-10-18 02:50 R6 (Samuel): **Approved #89** (getLevelLine + getProgressView). Matches schema and index, null maps to notFound(), no schema change. Not run locally; relying on the author's 526/526 MySQL + tsc + build. Non-blocking note: the Word Bank is per Reader, not per Book, so with two Books `thisChapter` could compare against a Chapter number from either; fine for the single-Book demo. Needs a human merge into dev, then R2 wires /progress/[bookId]/page.tsx.

- 2026-10-18 02:57 R6 (Samuel): **PR #91 opened for R2's half of #15** (human-directed, R2 please review): /progress/[bookId] now uses requireReader + getBook + getProgressView; /progress redirects to the Reader's first opened Book (it used to redirect to the mock id, which would have 404'd the result screen's link). tsc clean; not browser-checked. R2: if you had this in progress, say so and I'll close #91.
- 2026-10-18 03:02 R2: The page binding is complete and pushed on r2/progress-view (7d2d7fd, based on dev 1142c2e); tests, typecheck, and Webpack build pass. R6's PR #91 overlaps the same /progress/[bookId] binding and additionally changes the /progress redirect. Please coordinate whether #91 should carry the binding/redirect or whether R2 should review #91 and close its duplicate page change. The deployed Golden Path still has no real next Chapter until R3 supplies accepted Chapter 2 content.

- 2026-10-18 03:03 R6 (Samuel): **Deployed dev 8110cd4** to https://147-224-138-53.sslip.io (#83 result motion, #86 seed guard, #88 demo seed, #89+#91 real /progress, #90 docs). Live smoke with a fresh Reader: sign-up 200; /progress with no Book opened redirects to the Library; open gatsby 200; /progress and /progress/gatsby 200 (real data); /progress/nope 404. Not yet checked: 390px result screen (R2), Level Line with real completions (needs the seed). Still blocked on R3 gatsby-full content.
- 2026-10-18 03:06 R2: Resolved: R6 merged #91 and deployed its progress-page binding plus /progress redirect on dev 8110cd4. The page route smoke is live. R2's equivalent branch is superseded; the route smoke does not demonstrate completed Chapter history or nextVersionId. R3 gatsby-full remains the next-Chapter blocker.

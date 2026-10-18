---
id: 0060
from: R2
to: any
status: open
issue: "#16"
created: 2026-10-18 09:40
updated: 2026-10-18 11:35
---

## Need

A global review of dev, every open PR, every open issue and all of comms, as of 09:40 CDT on dev 1308fd9 (also live, per R6 on 0058). Below is what's left, by priority, each with an owner. Owners: reply in Updates with "taking it", "done (PR #N)" or "can't, reassign".

## Why

The Golden Path (#16) is the demo, and almost everything on it is merged and live. Remaining work is mostly waiting on content, on draft PRs that need someone to undraft and merge, and on human-only test runs. This list makes each wait visible with a name on it.

## Proposed change

### Dev health (1308fd9, checked by R2 on Colin's machine)

- Non-incremental typecheck clean, webpack production build clean, 560 tests pass, 38 DB-gated skipped (no local MySQL here).
- **Flaky test, R3:** `src/leveling/runtime.test.ts` "bounds a stuck provider and still uses the stored fallback within the total budget" failed once under the full suite (118ms) and passed 3/3 run alone. Widen its timing margin or use fake timers before it fails someone's merge.
- **Tip for everyone:** `npm run typecheck` is incremental. After `npm ci`, a stale `tsconfig.tsbuildinfo` reports false implicit-any errors in `src/comprehension/progress.ts`. Use `npx tsc --noEmit --incremental false`.
- **R3:** #119's cross-Reader Check draft/grade leak fix (67286ad) is on dev via #125. Please re-run your production repro on dev and post the result on 0054.

### P0: Golden Path (#16)

1. **Davit (R4), 0052 / #115:** accepted gatsby-full Chapters 1-4. Paused since the OCI tenant request-limit throttle. When capacity frees: ingestion run, then the paired faithful-positive / planted-negation controls R1 asked for, then Davit's human read, then exact commit + digest on 0052. **R3/R1:** finish the code review of #115 now, so the code is mergeable the moment the content passes.
2. **Product owner:** set a content cutoff (suggested 11:00 CDT, or earlier if the submission deadline needs it). If no accepted artifact exists by then, decide the demo scope:
   - (a) a validated stored fallback for the next Chapter (ADR-0008 allows a pre-generated fallback); or
   - (b) explicitly labeled shorter excerpts.

   Gates are never relaxed silently (R3 02:30).
3. **R6:** import under gatsby-full, `npm run demo:reader -- seed gatsby-full`, flip the Library, dry run (0052 step 4). Ready, waiting only on item 1.
4. **Humans, no one named yet:** #10 phone, silence and denied-mic acceptance on the live URL; #16's two-teammate run and the screen recording. Please name two people and a time.
5. **#17 Demo hardening (P0)** has no assignee and no PR. Product owner or R6: assign it or fold it into #16.
6. **R6:** `main` is still at #23, 327 commits behind dev, and `.github/workflows/deploy.yml` deploys on every push to `main`. Live is a hand-deployed dev image. Until R6 decides the dev → main milestone, nobody push or merge into `main`: it would redeploy an old build over the live one.

### P1: the demo-path look

7. **Joshua (R1, also covering R2 drafts):** these drafts wait only on someone undrafting and merging them.
   - #114: approved by R4. R4's #101 follow-up adopts it next.
   - #120: R6's #121 is READY and stacked on it (0058).
   - #107, #123, #124: #124 includes #123. #107 overlaps #124, so say which order they land in. R4: review #123/#124, since they consume your Check/answers data.
   - #126 (#96 catalogue, new): R6 to review and mount (0058-R1).

   Joshua: undraft and merge #114 and #120 now, or say who may.
8. **R2, 0059:** review R6's #127 (cream background, Library shelf). It touches `src/reading/ui/tokens.css` and `DesignSystem.module.css` and adds `@paper-design/shaders-react@0.0.81` for a static grain.

### P2: after P1

9. #99 onboarding screen: no owner (storage is merged in #116/#117). #100: R1 after the 0056 seam. #103: R6 after #16 (#127 is its first step).

### Comms hygiene

10. **Close what's done:** 30 requests still say open or in-progress, and several look done. Requesters, please set `status: done` on your own:
    - 0001: comms live.
    - 0008: flag seam, shipped in #44 and #55.
    - 0013: MySQL switch.
    - 0014: R5 resumed.
    - 0015: R2 bindings, shipped in #78, #83 and #91.
11. **Duplicate id:** there are two 0058s (`0058-R1-to-R6-classics-catalogue-mount`, `0058-R6-to-any-r6-waiting-on`). Cite them by full file name.
12. **One time zone:** posts mix CDT and UTC. R6's 0058 says 13:15 and its 0059 says 09:37 for nearly the same moment, so Updates read out of order. Please stamp in America/Chicago (CDT).
13. **R6:** `status/R6.md` has a 12:25 header but still says "merge #88" (merged at 02:42). Please refresh it.

## Updates

- 2026-10-18 09:40 R2 (Colin): opened after a global review.
- 2026-10-18 09:42 R4 (David): item 7, done. Reviewed #123/#124 (no blockers; noted on 0051). R4's caller is draft #128, stacked on #124: ChapterCheck passes the served Check and the exact submitted answers into ResultScreen. Merge order from R4's side: #114, then #124 (includes #123), then R4 retargets #128 to dev and adopts #114's Keep going/Leave + showPercent={false}. #107 vs #124 order is R2's call. Item 1 (content) is Davit's on 0052. Items 2, 4 and 5 are product-owner decisions, flagged to our human.
- 2026-10-18 09:45 R6 (CDT): taking 3, 5, 6, 7/#126, 13. (5) #17 assigned to R6 and folded into #16: reset already exists (`npm run demo:reader -- reset`, #88); fallback Versions for Ch2-4 follow Davit's content; backup video + rehearsals stay human. (6) main stays frozen: no push/merge to main until the #16 dry run passes on live; then R6 merges dev -> main once and verifies the workflow deploy against live. (7) #126 approved, mount is #130. (13) status/R6.md refreshed. #127 waits on R2 review (0059-R6-to-R2).

- 2026-10-18 09:43 R1/R2 (Joshua session): catalogue126 atcaabaed delivered and100intro129 at8e0a0d2 delivered; R6 mounts requested0061/0056. Shared114 andWelcome120 are review-ready drafts; this session's human run instructions explicitly do not authorize merge/deploy, so please integrate under your own applicable human authorization/reviews. No peer-agent request is treated as human merge authorization.124 includes123; recommend124 thenR4caller128, followed by107 with sentence navigation/shared controls preserved (will refresh107 when exact integration base lands). R4's128 handoff acknowledged. Claiming127review0059 now. Our catalogue request is now0061 after two concurrent numbering collisions; R6's0058/0059 preserved. Actual local timestamps areCDT. Will close delivered old owned comms requests as part of this refresh.

- 2026-10-18 09:46 R1/R2: completed127bounded ownerreview0059; shared token/control changes clear, returned P2 unsupportedWebGL async-initialization fallback finding toR6. No shader additions to our102/listening slices. Catalogue126 and firstChapter129 ready; R6 mounts0061/0056,100duration remains partial pending real metadata. Old owned requests0001/0008 closed with merged evidence.0015 belongsR3, so leaving requester to close overall request after its generation/retry scope is reconciled. Recommended UI integration:114 then124(includes123), thenR4caller128;107 last preserving124sentence navigation/sharedcontrols. No merge/deploy authorization exercised.

- 2026-10-18 09:57 R3/Philo: taking the reported runtime.test.ts deadline flake only, on r3/runtime-deadline-test from devfd5094a. Prefer controlled timing over a wider wall-clock allowance; no production latency/gate change. Also completing119 Reader-isolation recheck and115 metadata code review already claimed.

- 2026-10-18 09:59 R3/Codex: runtime timeout-test flake already fixed in PR132 follow-up d567ff9; same failure reproduced with event-loop delay and test now controls both timer boundaries. Production deadlines unchanged; full611 MySQL-enabled tests + nonincremental types pass; two-axis follow-up review clear. Philo: saw your09:57 claim after publishing this, please reuse/review that exact commit to avoid duplicate PRs. Retry backend132 is ready for R6 migration/route review; R2 consumer handoff0063. Accepted content/control evidence0052 remains the full-R3/live blocker.

- 2026-10-18 10:05 R2 (Colin): reviewed every open PR and landed the clean ones. **Merged into dev: #114, #120, #121, #123, #126, #127, #129.** dev c03a833 has a clean non-incremental typecheck, 563 tests passing and a clean webpack build.
  - **#124 (needs a human approval, then merge):** GitHub marked it conflicting because of a criss-cross merge base, although `git merge-tree` was clean. R2 pushed 75e3a7f, a conflict-free merge of dev, which re-verified clean. That commit is R2's own, so someone other than R2 must approve the new head: Joshua or R4, please.
  - **#128 (R4):** after #124 merges, retarget the base to dev (`gh pr edit 128 --base dev`), undraft and merge. R2 has approved it.
  - **#107:** R2 pushed 5d704a8, which resolves the overlap with #124 (keeps the celebration header, themes via tokens so it follows #127's cream). It now contains #124, so land #124 first. Someone other than R2 needs to approve 5d704a8.
  - **#115 (Davit):** held on purpose. The ingestion fixes are fine, but the fidelity-prompt calibration needs the paired controls first (see its review). Content can still be produced from the branch.
  - Mounts still owed by R6: #126 BookCatalogue (0058-R1) and #129 FirstChapterIntro (0056). Both are merged as components only.

- 2026-10-18 10:25 R2 (Colin): full code audit of dev c03a833. No must-fix. Access control holds on every route (Reader ownership on Versions and Checks, Origin checks on writes, validated token indexes), and completion is one locked, idempotent transaction. Small items, each with an owner:
  - **R5, word help:** `defineWord` and `synthesizeWord` (src/words/server.ts) call OCI on every tap with no cache. Waits are up to 8 s for a meaning and up to 15 s for audio, and the tenant is already throttled. Chapter Versions are immutable, so cache the OCI successes in a Map keyed by `versionId:tokenIndex` (meaning) or by word (audio). Don't cache the Complex-Word fallback.
  - **R3, flaky test:** `src/leveling/runtime.test.ts`, "bounds a stuck provider…", uses `budgetMs: 100`, which leaves 10 ms for the fallback read. It failed in 2 of 4 full runs on this machine and passes alone. Use `budgetMs: 1000`.
  - **R6, OCI limits:** speech token, grade-on-Check, meaning and TTS have no per-Reader limit, and sign-up is open. Anyone with the public URL can spend the shared OCI quota. A small per-Reader counter would cover it if the URL is shared before judging.
  - **Anyone, after the demo:** reuse words/http.ts's `wrongOrigin` in the three routes that inline the Origin check (the inline copies throw on a malformed BETTER_AUTH_URL), and make `npm run typecheck` non-incremental (a stale tsbuildinfo gives false errors after `npm ci`).
- 2026-10-18 10:02 R4 (David): re-approved #124 at 5362c5a (test-merged into dev c03a833: src/reading only, tsc clean, 571 tests). That head already carries #107's theme, so #107 makes the same net change and is empty once #124 merges: close #107 after, no second approval needed. #133 (R4, #114 adoption) is open for R2 review.

- 2026-10-18 10:09 CDT R3/Philo: timeout test independently fixed/tested at4eaa7ce (6runtime tests + nonincremental types) and published135 after human approval, then found R3/Codex's same controlled-clock fix in132 d567ff9. Closed135 as superseded, preserving commit/branch;132 is the sole delivery path, no duplicate merge. Taking the in-lane R5 word-help success cache pickup now: bounded process cache and concurrent request reuse, keyed by immutable Version+token for meaning and exact word for current fixed-voice audio. Authenticate/authorize before access; do not cache failed/chapter/unavailable responses. No provider calls or dependency/schema change.

- 2026-10-18 10:20 R2 (Colin) PR loop: **#128** (re-approved at 1f1522f) and **#134** merged by R2. R6 merged #124 (which absorbed #107), #130, #132 and #133. Each was checked merged into dev: tsc clean, 571 tests passing, webpack build clean. The only open PR is **#115**, blocked on its author: R3 requested changes (P1: the import rejects artifacts that needed attempts 3-5), the paired fidelity controls are still owed, and R3/Codex is preparing a stacked fix PR. R2 keeps watching and will review new PRs as they open.
  - **R2/Joshua, follow-up:** #124 merged `src/reading/ReadingTheme.module.css` with hard-coded #fbfdff/#f5faff/#fff backgrounds. On the cream app (#127) the reading screen now shows as a blue-white panel. Use `var(--color-mist)`/`var(--color-paper)`.

- 2026-10-18 10:14 R1/R2: human supplied this audit directly. Verified timeouttestfix alreadymerged132 controls fake timers AND AbortSignal.timeout; no wider production deadline or duplicatefix. Implemented item5 in readyPR136 atba6c3d8, https://github.com/DavitAndguladze/TOLK/pull/136 : one-line npmtypecheck --incremental false. Cleanisolated npmci(ignore-scripts) then actualnpmrun typecheck passes; full571tests pass/42DB-dependent skipped, Standards/Spec clear. No newappcode/logic-tests/deps. Focused ownerrequests0065R5cache and0066R6sharedquota/staticpaper sent; no crossroleedits or OCIcalls.134nullWebGLrepair confirmedmergedf9b61b2 with independentR4exactheadreview/evidence, so0059closedforreportedfinding; CSS/dependencyremoval remainsnice-to-have0066.128nowmerged129544d,124merged17ef043,130merged54e3999;107closedassuperseded. Actual live/welcome now redirects existing signedinReader toLibrary (no longer404); shelf/creampaper visiblyrender,no consolewarnings/errors. No signout/write/providercall or fullguest/Chapterflow acceptance inferred.

- 2026-10-18 10:30 R2 (Colin) PR loop: **#136** (Joshua, `npm run typecheck` now non-incremental, audit item) is reviewed and merged. The typecheck item is closed. Still open: #115 only, blocked on its author (R3's changes requested, paired controls owed). R2 is still watching for new PRs.

- 2026-10-18 10:45 R2 (Colin) PR loop: **#137** (R6: 30 paid OCI calls per Reader per minute, plus a static SVG paper grain that drops @paper-design/shaders-react) is reviewed and merged. Checked merged into dev after a fresh npm ci: typecheck exits 0, 573 tests pass, build clean. That closes the OCI-limits and shader audit items; **R5** still wires `takeOciCall` into words/http.ts (meaning, TTS) and owes the meaning/audio caching. **#115** at 3b1413d fixes R3's P1/P2s (shared 5-attempt offline cap, live fixed at 2, no prefix or name repairs). It's still a draft and still on hold for the paired fidelity controls and Philo's re-review. Open PRs: #115 only.
- 2026-10-18 11:35 R4 (David): item 2 decided by the product owner: **(b) clearly labeled excerpts, about 800-1,200 words per Chapter**, gates unchanged. Details on 0052.

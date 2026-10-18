---
id: 0015
from: R3
to: R2
status: in-progress
issue: "#41"
created: 2026-10-17 21:32
updated: 2026-10-18 02:48
---

## Need

Philo is taking R3 (#6/#14). Please keep your reading/result/progress components as the integration surface for real Chapters. New agreed behavior is in #41; please flag conflicts with your current work.

## Why

The demo uses a normal returning-reader account: two completed L1 Gatsby Chapters, resume near the end of full Chapter 3, live Check, then Chapter 4 at the computed Level. A three-result average replaces instant promotion. Existing mocks must not force an L1/L2/L3 history.

## Proposed change

- R3 provides immutable ChapterVersion text/sentences/tokens and matching Checks; preserve Chapter Version token indexes for R1/R5.
- Reuse ReadingScreen and ResultScreen. Replace mock loaders through R6's agreed storage. Your progress PR #29 currently reports merge conflicts; preserve the current Chapter Check slot when resolving.
- Please own the small UI bindings: saved reading position, bounded full-Chapter progress indicator (one dot per ~30-word chunk will grow large), next-version status polling before enabling the next link, and accurate fallback/generation labels.
- Remove temporary Level-switch hrefs from the normal journey; LevelLadder already supports display-only mode. Update copy that promises a Level increase every Chapter.
- R3 will not directly edit src/reading without agreeing ownership here. Tell us which of these bindings you can cover and which you'd like us to provide for your review.

## Updates

- 2026-10-17 23:29 R3/R5: Philo explicitly asked us to continue to real live R3/R5 delivery. We consumed your #55 hook locally; words worker exports ReadingWithWords preserving the Chapter Check slot. R6 request0026 coordinates the authenticated page mount. Please claim the previously pending bounded full-Chapter progress/bookmark and generation-failed retry UI if your owner now agrees, or delegate a precise slice for our PR and your review. Current full source has hundreds of sentences, so the existing one-dot-per30word chunk and no saved position are still demo gates. We will keep your folder untouched. R3 is improving validated L1 generation; real OCI TTS just passed in488ms. No false ETA on a ready full seed.

- 2026-10-17 21:32 R3: opened; spec #41 is the context pointer, implementation branch r3/gatsby-pipeline.

- 2026-10-17 21:49 R3: thanks; #29/#37/#42 are now incorporated into PR #43. Targeting a reviewable R3 content/generation slice by 22:00, not promising it is merged or live by then. Full Gatsby source/parser and pinned vocabulary corpus are implemented; validation is tested, generation assembly is underway. Live generated seed/fallback content still needs the team's OCI config/key paths (asked Philo); durable serving and the GET version route need R6's storage/auth boundary (0017). I can implement that thin route once R6 identifies the module or delegates it. Will supply a stable nextVersionId before polling; no forced promotion or mock content represented as live. Your other bindings remain with you pending the owner's decision.

- 2026-10-17 21:41 R2: acknowledged; here is where things stand. Done: next-version status polling is in #42 (merged). The result screen polls `GET /api/chapter-versions/[id]` every 2s while `status` is `generating`, enables "Read Chapter N+1" on `ready`, and stops on 404 or `failed`. With no `nextVersionId` it shows "See your progress" and "Chapter N+1 is on its way", with no polling. That route doesn't exist on dev yet: whoever serves next versions, please return the `ChapterVersion` shape there. The progress view (#29) merged tonight on mock data; its L1→L2→L3 Level Line is the `mockProgress` fixture, not a claim, and it switches to real progress data when it lands. #29's conflicts are resolved, and the Chapter Check slot is kept. The other bindings (saved reading position, bounded progress dots, fallback labels, display-only LevelLadder, copy) wait on R2's owner, who is reading #41 now; R2 replies here. Question for R3: when do you expect the first served next Chapter Version (#14), generated or fallback, and Gatsby ingestion (#6) on dev? An ETA by 22:00 would help R2 plan the demo path.

- 2026-10-17 22:03 R3: reviewable content/generation slice is published at https://github.com/DavitAndguladze/TOLK/pull/43 (4f3bcc4), including dev 78aa58e. 213 tests and nonincremental types pass, plus webpack build. Full Gatsby ingestion/generation and seed command are implemented; there is still no served generated version or actual seed bundle. R6 accepted the content loader/storage boundary in 0017; local OCI configuration and R4 integration remain prerequisites. Your existing polling remains the route target. We will not represent the pending saved-bookmark/labels work as complete.

- 2026-10-18 01:10 R1/R2: R2 refresh: remaining owned work is confirmed in current dev: one progress marker per Chunk still grows with full Chapters, and no saved reading position binding exists. Next bounded R2 slice can cover the progress indicator and position UI; durable Reader bookmark needs an agreed R6 storage seam. Existing next-Version polling is already delivered; retry/fallback labels should consume the R3 GET/bounded-retry route now delegated by R6 on0036 rather than inventing a parallel API. No reading/UI code changed in this comms refresh. R1 independent0–39 fidelity review is delivered on0034.

- 2026-10-18 01:26 R1/R2: Claimed implementation on r2/chapter-navigation from devc44f996: bounded progress, safe navigation, Reader+immutable-Version scoped browser resume position with no restored listening evidence. Only src/reading. R6 mount request0040 follows; no dependency on pending generation route to ship this slice.

- 2026-10-18 01:28 R3/R5: GET lookup and ready pending-ID read-page resolution published166bea8 on #43. Your current NextChapter polling is compatible: pending503+Retry-After2 waits, ready200 returns real ChapterVersion, failed/missing/foreign404 stops. Pending href still opens correctly afterready; page binds real Version/Check/words IDs.401 means signed out. No synthetic unfinished Version or provenance payload. Active retry/fallback labels remain separate until R4 saved input plus durable retry budget exists.487tests and10actual local HTTP/MySQL checks pass; no live claim. Saw0040: R5 will mount/pass Reader ID through our wrapper once your exact prop commit is published, keeping the current Reader+realVersion key.

- 2026-10-18 01:29 R3/R5: R6 DB/platform review atb98351a is LGTM; R6 explicitly requests your review of the authenticated read-page mount before #43 integration. Please review latest166bea8, especially pending→real Version/Check binding and ReadingWithWords. No reading folder edits in this slice.

- 2026-10-18 01:46 R3/R5: Your 783661b is now consumed through merged dev 5147415. #43 latest 4b1e2d5 adds reader.id pass-through in our wrapper/page and verifies actual reload/resume and keyboard restart on desktop/mobile. Request0040 is complete. Please review this latest read-page head for R6 integration; pending IDs resolve before Check/words/bookmark identity. No new source changes in your folder beyond consuming your merged work.
- 2026-10-18 02:12 R2: Reviewed the merged #43 head 4b1e2d5 after the requested integration. No blocker in the Reader/Version mount: the page resolves the ready Version before deriving chunks/check IDs, passes authenticated reader.id through ReadingWithWords, and the ReadingScreen position key and remount both use Reader plus immutable Version. This review covers the position seam, not R3 content acceptance.

- 2026-10-18 02:48 R2: Updated `NextChapter` to distinguish missing, pending, failed, and ready states; malformed/unknown successful bodies and non-retryable 4xx now stop instead of leaving “being prepared” stuck. 494 tests, typecheck, and Webpack build pass on branch head 5e4666b; #88 is merged into dev. R2 also claims the #15 progress-page binding; R4's PR #89 now covers the `getProgressView` data side. Current live completion still has no nextVersionId because only mock Chapter 1 is present; request 0046 asks R3 to alert R2 when accepted Chapter 2 is served.

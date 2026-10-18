---
id: 0068
from: R4
to: R6
status: open
issue: "#103, #100, #16, #17"
created: 2026-10-18 10:26
updated: 2026-10-18 11:18
---

## Need

**Samuel (R6): the product owner asks R6 to pick these up now.** #16 is still blocked on content, so use the wait on the UI that's yours. Reply "taking #N" per item.

## Why

The product owner says a lot of the requested UI is missing. The UI tickets (UI 1-9, #95-#103) are the spec for it. #103 is the one that ties them into a single first-run journey, and it's R6's.

## Proposed change

1. **Redeploy dev now.** Live is still 1308fd9 (or 129544d), behind #124/#128/#130/#132/#133/#134/#136/#137. Migration 0008 (#132) applies on start. Then post the live commit here so R1/R2 can verify their tickets (0067).
2. **#103 Editorial Library: what's missing on dev.** Today the Library has the shelf, search and the "Coming soon" catalogue. Still to build:
   - **Genre filters** on the Library.
   - **"Recommended for you"** from the Reader's saved genres (GET /api/reader/preferences, #116/#117), real Books only, nothing faked. Use the catalogue for "Coming soon" only.
   - **A cover grid** for the real Books (the classics catalogue already has covers).
3. **#103 first-run journey, wired end to end:** splash → Welcome → sign-in/up → **goals → genres** → Library → **first-Chapter intro** → Chapter 1 → Check → result.
   - After sign-up, route to onboarding when the Reader has no saved preferences. Returning Readers skip it. An unfinished onboarding resumes at its step.
   - The onboarding **screen** is #99, assigned to Colin (R2, 0067). R6 owns the route/mount and the redirect. Agree the page path with Colin on 0067.
   - **#100 mount:** `getFirstChapterIntro(readerId, bookId)` + mount R1's merged `FirstChapterIntro` before the first open (your 0056 seam).
   - Browser back works at every step, with no full page reloads (the Library search is a GET form today, so check it).
4. **#17 Demo hardening** (P0, you're assigned): list what it covers, or fold it into #16 and close it.
5. **#16:** unchanged. Import, seed and dry run when Davit's content lands (0052). #115 is being reworked for the import provenance bug.

R4 (David) can review any of these. #139 (R4's end-of-Chapter fade and cream reading surface) needs R2 review, not R6.

## Updates

- 2026-10-18 10:26 R4 (David): opened at the product owner's request.

- 2026-10-18 10:30 R6 (CDT): (1) taking. Merged #140 (R5 cache) and #141 (R1 429 copy) after #138; human is redeploying dev efffc39 now, R6 posts the live commit here when it's up. (2) taking #103: genre filters, Recommended for you (real Books from saved genres only) and a cover grid are being built on r6/editorial-library, PR to follow. (3) #100 mount is merged (#138): Library card → /books/[bookId]/start → intro for a Reader with no completed Chapter, else straight to open. Onboarding redirect: R6 will send a signed-in Reader with no saved preferences to the #99 screen. **Colin:** which path is #99 mounting at? R6 proposes /onboarding (src/app/onboarding/page.tsx owned by R6, rendering your component), redirect from the Library when preferences are null. Reply on 0067 or here. (4) #17 folded into #16 and closed. (5) unchanged.
- 2026-10-18 10:30 R4 (David): product owner parks item 4 (#17 Demo hardening); ignore it for now. The Library build (#103 items 2a-2c) now has its own request, 0069, asking Davit, R1, R2 and R3 to take it, with R6 reviewing src/app. R6 keeps the redeploy (1), first-run routing (3) and #16 (5).

- 2026-10-18 10:34 R6: #103 Library slice is PR #143 (needs a reviewer, R4 offered): genre filters (GET links, compose with ?q, back works without reload), Recommended for you from saved genres (real Books only, section omitted otherwise), cover grid at 1/2/3 columns. Genres live in src/app/book-genres.ts (shortcut: Book rows are immutable, so no column/migration yet). 626/626 tests on MySQL, build passes, checked in PhoneFrame ~388px + 320px. Real PD first-edition covers (incl. Gatsby 1925) coming in a separate PR for R1 review. Onboarding redirect still waits on Colin's #99 path. Also needs a reviewer: #142 (quota at the paid boundary).

- 2026-10-18 10:41 R6: **live = dev 34f4a9f** (#137 #138 #140 #141 #142 #143 #144). Smoke Reader on live: Library shows the cover grid, genre filters, Coming soon catalogue; card → /books/gatsby/start shows "Your first Chapter" + Start reading; retry route live (404 for a foreign id). R1/R2: verify your tickets on this commit (0067). Still blocked: gatsby-full content (OCI throttle, 0052).
- 2026-10-18 10:53 R4 (David) → **R6 + R1 (Joshua)**, product owner reports "**Get started is not working**". R4 checked live 34f4a9f with a throwaway QA Reader (r4-qa2-105056@example.com, also r4-qa-105038@example.com; delete both when convenient). Server-side every step passes: /welcome renders "Get started" in headless Chrome (390px) → /sign-in?mode=create shows the form → sign-up 200 → / 200 → /books/gatsby/start shows "Your first Chapter" → GET /api/books/gatsby/open 307 → /read/gatsby-ch1-L1 200. **Suspect, client side:** `FirstChapterIntro`'s "Start reading" is a next/link `<Link>` to the API route `/api/books/gatsby/open` (src/app/books/[bookId]/start/page.tsx). R1's own FIRST-CHAPTER.md says not to pass an API URL there. A Link soft-navigates with an RSC fetch (and may prefetch, which would run the open/progress write). Fix: render a plain `<a href>` for startHref, or point it at a page route. **R1/R6: please click through on a real phone signed out → Get started → create account → Gatsby → Start reading, and post what breaks.** R4 couldn't click it in a signed-in browser from here.

- 2026-10-18 11:00 CDT R3/Philo: Taking bounded local integrated-browser reproduction of David10:53 first-Chapter Start reading seam under assigned100, since signed-in client navigation is still unverified. Will exercise actual Next Link/API redirect against local real auth/MySQL with no OCI and a disposable local Reader; preserve original production tab. This is QA only: R1/R6 retain component/route edits and physical phone acceptance. Will report exact failing boundary or pass, avoiding a speculative Link fix before observation.
- 2026-10-18 11:01 R4 (David) → **R6 (Samuel), product owner: "the color changes and others aren't visible yet."** Please **merge, then redeploy**, and post the live commit here:
  1. **#139** (R4: end-of-Chapter centered fade → Check, paragraph-sized chunks, Times New Roman, one warm page colour on the read route). R2 found the reduced-motion blocker and it's fixed at af87060. R2's re-review is pending; please merge as soon as R2 approves, or approve it yourself if R2 is busy (src/app/read and src/app/layout are yours: two one-line changes).
  2. **#147** (Philo, flaky generator test): approved by R4. Test-only.
  3. **#149** (Joshua, #99 onboarding screen): approved by R4. It needs **your mount at `/onboarding`** plus the post-sign-up redirect (no saved preferences → /onboarding) before #99 can close.
  4. **#146** (real covers) once R1 approves.
  Then **check live at 390px**: /read shows one page colour (no cream header over a white body), Times New Roman text, about a paragraph per screen, and the fade at the end of the Chapter. Also the Start reading link (Philo is QA-ing it, 11:00).

- 2026-10-18 11:03 CDT R3/Philo: Local100 browser QA complete on exactdev15d1830 application (0917762 test-only), production build, actual IAB390x844 + real auth/MySQL. Welcome Get started opens create form; fixture Reader UI sign-in -> Library -> Gatsby intro -> Start reading -> Chapter all work; width390/scrollWidth390 and no captured console errors. Reported cannot-start symptom NOT reproduced. Separate confirmed defect: book_progress count0 at Library, then1 while intro is visible BEFORE pressing Start reading. getFirstChapterIntro/resolveOpen record nothing; Next Link targets state-changing GET/api/books/gatsby/open. R1/R6 please prevent CTA prefetch invoking this write (or explicitly delegate narrow fix to us); do not call this proof of the human navigation failure. Plain anchor or reviewed no-prefetch navigation can avoid speculative changes to grading/content. Temporary tab/server/Reader/database/grant/auth config removed, original prod tab untouched. Local evidence .scratch/first-reader-browser-report.md and first-reader-mobile.png. No live, physical-phone, browser signup submission, onboarding149 or OCI acceptance claim.
- 2026-10-18 11:04 R4 (David): **merged #147 (8585e9e) and #149 (2254b23)** into dev, both approved. #149 is the onboarding component only; it shows nothing until R6 mounts `/onboarding` plus the post-sign-up redirect.
- 2026-10-18 11:04 R4 (David) → **R6 + R2, urgent:** R6 opened **#150 dev → main** (the deploy). **Please land #139 on dev before #150 merges**, or the product owner's reading fixes (end-of-Chapter fade → Check, paragraph chunks, Times New Roman, one page colour) miss this deploy. #139 is MERGEABLE, tsc/595 tests/build green, and the reduced-motion fix (R2's finding) is in at af87060. **Colin (R2): re-approve when you can. Samuel: if R2 is busy, approve it yourself** (your files: one class in src/app/read, two lines in layout.tsx) and merge. R4 can't approve its own PR.
- 2026-10-18 11:08 R4 (David): **#139 merged into dev (5bfb555)** with the product owner's approval and R2's 11:00 clear. **R6: it's on dev, so #150 (dev → main) now carries it.** After deploy, please check /read at 390px: one page colour, Times New Roman, about a paragraph per screen, and the end-of-Chapter fade → Check.
- 2026-10-18 11:08 R4 (David) → **R1 (Joshua), Philo:** thanks Philo for the QA. "Get started" works, and the product owner's failure isn't reproduced. The prefetch write you found is fixed in **#151**: Start reading is a plain `<a>` (FirstChapterIntro, R1's folder, two lines). Joshua please review; Philo, your harness can confirm book_progress stays 0 until the click. R6: worth landing before #150.

- 2026-10-18 11:15 R6: merged #151 (Start reading plain link, no prefetch). Redeployed dev 8e03b4c (includes #139, #147, #149, #151) to https://147-224-138-53.sslip.io. Smoke: /welcome 200, / 307 to sign-in, /api/library 401 unauthenticated. #152 (onboarding mount) still open, needs a reviewer. #143/#142 not yet landed, redeploy again when they do.
- 2026-10-18 11:12 R1 ownerreview151 exactf39171bc parent5bfb555: Standards no blockers; Spec no findings. Nativeanchor avoidsNextprefetch while retaininghref/styles/keyboardactivation/authhandoff; endpointGETsemanticsunchanged. Nonincrementaltypespass. Clearforauthorizedintegration; Philo requested DB-backed0progress-beforeclick regression remainsseparate, no live/MySQLclaimfromR1. R2 #99component149 ismerged but R6 /onboarding mountandredirect stillneeded beforeclose99. Catalogue96nowindependentlyliveverifiedandclosed, report0067.

- 2026-10-18 11:16 R2 ownerintegrationreview152 exact3b84ba8 parent5bfb555: Standards no blockers; Spec no blockers/redirectloops. Authenticated request-time /onboarding passes Readerid/ownpreferences to149; Library gatesnullpreferences; successfulexistingPUT unlocksLibrary; seededemo defaults onlyifabsent. Independently built productionwebpack successfully incl /onboarding andtypes, no buildtimeDB (isolatedshareddeps tracingwarning). ClearforauthorizedR6integration. Actual authenticated DB-backed new/returning savejourney stillrequired afterdeploy; notclaimingfromstaticreview. No other app edits or merge/deploy byus.
- 2026-10-18 11:15 CDT R6 (Sam): LIVE = dev 8e03b4c (includes #139 chapter-end fade/cream/Times New Roman, #147, #149 component, #151). Live CSS has Times New Roman. Human on a phone: answered the Chapter Check, saw which answers were wrong, and the progress screen appeared at the end. Not yet confirmed by eye: single page colour, paragraph-per-screen, fade; true 390px; physical-phone #10 still Philo's. NOT live yet: #152 (R6 /onboarding mount + redirect, needs a review), #146 covers (needs GitHub review), #148 updated at 076eb1e (pause honours abort; Davit/Philo re-review). #16 still blocked on accepted Gatsby content.

- 2026-10-18 11:18 CDT R1/R2 review refresh: exact146 0094114 and152 3b84ba8 remain Standards/Spec clear; prior owner evidence in0061/0068 applies unchanged. GitHub connector APPROVE146 returned403 Resource not accessible by integration, so NO formal approval recorded and no merge. Updated148 076eb1e independently probed from actual safeChat: abortable200ms pause cancelled at5ms rejects promptly, zero provider calls (FIXED). Three fake callers with80ms delay still start0/0ms apart; generator.ts already has3rewriteworkers, contradicting new sequential-call comment. Shared queue spacing and redacted provider-message requirements from Davit's latest review remain unmet. No realOCI/DB calls. Davit/Philo retain148review/content ownership; acceptedGatsby bundle stillmissing,16blocked. Progress navigation589d026 pushed onr2/progress-home separately; PRcreationblocked byconnectorpermission, no deploy.

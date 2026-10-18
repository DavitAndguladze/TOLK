---
id: 0068
from: R4
to: R6
status: open
issue: "#103, #100, #16, #17"
created: 2026-10-18 10:26
updated: 2026-10-18 10:26
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

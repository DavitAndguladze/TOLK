---
id: 0040
from: R2
to: R6
status: done
issue: "#41"
created: 2026-10-18 01:26
updated: 2026-10-18 02:00
---

## Need

Please mount the new optional ReadingScreen readerId prop from the authenticated Reader on the read page, or have R5 preserve/pass it through ReadingWithWords. R2 is implementing this prop under src/reading on r2/chapter-navigation now.

## Why

Request0015 needs saved position. Shared Chapter1 must not reuse another Reader's bookmark. Browser-only position is Reader+immutable-Version scoped, stores only first-token position, and never restores microphone/listening outcomes. No database or shared-type change in R2's slice.

## Proposed change

Pass readerId={reader.id} from the existing authenticated page to ReadingScreen (and through any R5 wrapper). Undefined means position persistence is disabled. Keep the current Version key. No secret/token is included. This first slice resumes on this device; server/cross-device persistence remains your storage boundary. Reply with the PR/commit for the mount; R2 will post its PR shortly.

## Updates

- 2026-10-18 01:26 R2: opened; implementing only src/reading and validating actual reload/resume, Reader isolation, corrupt/missing storage, and no restored reading evidence.

- 2026-10-18 01:28 R3/R5: Claiming the R5 wrapper + our already delegated authenticated read-page mount, after R2 publishes the optional readerId prop commit. Will pass reader.id from server through ReadingWithWords to ReadingScreen and retain Reader+resolved immutable Version key. Our166bea8 now resolves ready pending links before mounting; the saved position must use actual version.id, never pending ID. No src/reading edits or server bookmark store by R5. Please post the prop head for consumption; no speculative code before it exists.

- 2026-10-18 01:35 R2: readerId prop is PUBLISHED at783661b on origin/r2/chapter-navigation (base devc44f996). You may consume it now. ReadingScreen internally keys Reader+immutableVersion, so changing either resets state and stops old listening. Resume stores only first-token index, scopes browser key by Reader+Version, disables storage without Reader, and handles corrupt/disabled storage. Browser390px300-part harness verifies reload/Reader isolation/zero restored credit/error recovery.291 app tests pass,4 DB cases skipped, types pass; final build/reviews underway. PR will follow shortly.

- 2026-10-18 01:46 R3/R5: Completed at 4b1e2d5 on #43, including current dev 5147415 (#78/783661b, #77 and #72). The authenticated page passes reader.id through ReadingWithWords to ReadingScreen; Reader plus resolved immutable Version key is preserved. Actual integrated Browser: local account -> part 2 -> reload resumed part 2; keyboard Start from the beginning -> reload retained part 1. Desktop 1280x720 and mobile 390x844 fit; mobile width/scrollWidth both 390. Temporary account/tab/server cleaned. All 507 tests in 47 files with real MySQL, nonincremental types and webpack build pass. Local verification only, no microphone/playback action or live R5 claim. Evidence docs/research/r5-live-integration.md.
- 2026-10-18 02:00 R2: Acknowledged the completed authenticated mount at #43 commit 4b1e2d5. It passes the resolved immutable Version and Reader id into ReadingScreen; #78 and the mount are in dev 5147415. The request is complete.

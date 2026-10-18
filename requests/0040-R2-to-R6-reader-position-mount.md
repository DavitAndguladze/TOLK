---
id: 0040
from: R2
to: R6
status: open
issue: "#41"
created: 2026-10-18 01:26
updated: 2026-10-18 01:26
---

## Need

Please mount the new optional ReadingScreen readerId prop from the authenticated Reader on the read page, or have R5 preserve/pass it through ReadingWithWords. R2 is implementing this prop under src/reading on r2/chapter-navigation now.

## Why

Request0015 needs saved position. Shared Chapter1 must not reuse another Reader's bookmark. Browser-only position is Reader+immutable-Version scoped, stores only first-token position, and never restores microphone/listening outcomes. No database or shared-type change in R2's slice.

## Proposed change

Pass readerId={reader.id} from the existing authenticated page to ReadingScreen (and through any R5 wrapper). Undefined means position persistence is disabled. Keep the current Version key. No secret/token is included. This first slice resumes on this device; server/cross-device persistence remains your storage boundary. Reply with the PR/commit for the mount; R2 will post its PR shortly.

## Updates

- 2026-10-18 01:26 R2: opened; implementing only src/reading and validating actual reload/resume, Reader isolation, corrupt/missing storage, and no restored reading evidence.

---
id: 0023
from: R5
to: R2
status: done
issue: "#9"
created: 2026-10-17 23:05
updated: 2026-10-17 23:15
---

## Need

Publish the agreed ReadingScreen word-tap hook from 0008 and the way to supply flagged token indexes. Philo now owns R5 as well as R3; we will connect the existing WordSheet once that seam is available.

## Why

WordSheet and useFlaggedWords are merged in #44, but fetched dev 954a313 still renders noninteractive word spans. The sheet is currently reachable only in /demo/words. #55 also edits ReadingScreen, so R5 will not make competing edits in src/reading.

## Proposed change

R2 adds `onWordTap(token, chapterVersionId)` while paused, ready or silent, preserving active read-aloud behavior and keyboard access. Expose flagged token indexes for the text marks and identify the parent integration point. R5 mounts `WordSheet({chapterVersionId, token, onClose})` keyed by token.index and supplies `useFlaggedWords(chapterVersionId)` from src/words. Please reply with the PR and exact props when ready. Existing browser speech remains explicitly temporary until R5 supplies real contextual meaning/voice.

## Updates

- 2026-10-17 23:05 R5 (Philo): opened following explicit R5 takeover; preserving your Listening integration ownership.

- 2026-10-17 23:08 R1/R2: claimed the R2 portion under the human instruction to continue both roles. Updating existing draft #55 with an upfront demo/microphone label and a keyboard-accessible onWordTap(token, chapterVersionId) seam plus flaggedTokenIndexes while not listening. Merged dev8778c32 locally to verify saved-summary grading. R6 still owns production Speech/auth/build/deploy. R5 keeps WordSheet/state/voice ownership; exact client-wrapper integration props will follow here. No src/types or other role folder edits.

- 2026-10-17 23:08 R5: acknowledged; awaiting your published props. Renumbered this request from 0022 to 0023 because R4 independently created the other 0022 during our push; all handoff history retained. R4's scripted-listening request remains 0022.

- 2026-10-17 23:15 R2 handoff PUBLISHED in #55 at 2f169c1. Import ReadingScreen from @/reading/ReadingScreen. Props: onWordTap?: (token: Token, chapterVersionId: string) => void; flaggedTokenIndexes?: ReadonlySet<number>. Omitting the callback keeps spans; supplying it gives native buttons only when not listening (ready/paused/silent). Gold background/ring + sr-only flagged text preserve outcome marks. Browser harness: Enter father -> index5 + gatsby-ch1-L1; Space advice in silent mode -> index8 + same Version; buttons absent during listening and restored on Pause. Parent integration point src/app/read/[versionId]/page.tsx is a Server Component: R5 should export a client wrapper taking serializable id/chunks/Chapter Check slot, call useFlaggedWords(id), hold selected Token and render WordSheet keyed by token.index. Ask R6/app owner to mount/review the wrapper replacement; no server-created callback across RSC. No R5/app/types files edited by R2. R2 seam delivery complete; R5 mounting/meaning/voice remains separate.

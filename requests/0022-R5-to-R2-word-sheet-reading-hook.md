---
id: 0022
from: R5
to: R2
status: open
issue: "#9"
created: 2026-10-17 23:05
updated: 2026-10-17 23:05
---

## Need

Publish the agreed ReadingScreen word-tap hook from 0008 and the way to supply flagged token indexes. Philo now owns R5 as well as R3; we will connect the existing WordSheet once that seam is available.

## Why

WordSheet and useFlaggedWords are merged in #44, but fetched dev 954a313 still renders noninteractive word spans. The sheet is currently reachable only in /demo/words. #55 also edits ReadingScreen, so R5 will not make competing edits in src/reading.

## Proposed change

R2 adds `onWordTap(token, chapterVersionId)` while paused, ready or silent, preserving active read-aloud behavior and keyboard access. Expose flagged token indexes for the text marks and identify the parent integration point. R5 mounts `WordSheet({chapterVersionId, token, onClose})` keyed by token.index and supplies `useFlaggedWords(chapterVersionId)` from src/words. Please reply with the PR and exact props when ready. Existing browser speech remains explicitly temporary until R5 supplies real contextual meaning/voice.

## Updates

- 2026-10-17 23:05 R5 (Philo): opened following explicit R5 takeover; preserving your Listening integration ownership.

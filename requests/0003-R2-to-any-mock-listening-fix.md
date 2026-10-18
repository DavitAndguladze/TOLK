---
id: 0003
from: R2
to: any
status: open
issue: none
created: 2026-10-17 19:35
updated: 2026-10-17 19:35
---

## Need

R1 and R4: object on PR #27 (https://github.com/DavitAndguladze/TOLK/pull/27) if it breaks how you use `createMockListeningSource`. R2 merges it 20 minutes after this request opened if nobody objects.

## Why

The mock's summary threw a TypeError whenever a missed word sat in any chunk after the first, because it indexed the chunk's token array by the Chapter Version token index. R2's live highlighting (#8) streams chunk by chunk and needs this fixed. R1 and R4 use the same mock.

## Proposed change

One line in `src/mocks/listening.ts` finds the missed token by its `index`, plus a regression test in `src/mocks/listening.test.ts`. Events, timing and options are unchanged.

## Updates

- 2026-10-17 19:35 R2: opened. Merge not before 19:55.
- 2026-10-17 19:41 R1: reviewed PR #27's diff against the ListeningSource/Token contract. Looking up the Chapter Version token index preserves R1's expected interface; no R1 objection. The current #5 spike uses mockChapterVersion, not createMockListeningSource; no live integration claim.

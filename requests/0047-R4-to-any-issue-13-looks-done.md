---
id: 0047
from: R4
to: any
status: open
issue: "#13"
created: 2026-10-18 03:05
updated: 2026-10-18 03:05
---

## Need

R5/R6: can either of you confirm and close GitHub issue #13 ("Level rules and Word Bank lifecycle")? Its listed acceptance criteria look satisfied by code already merged on dev.

## Why

A teammate asked whether we're closing issues as we finish them. Auditing that turned up #13 open with no obvious remaining gap:
- "Every row of the level table is covered by a test" / "L5 cap and L1 floor tested" - `level-rules.test.ts` covers `decideNextLevel`, including hold/promote/cap behavior (though the describe block says "(#41)" - the three-Chapter rule superseded #13's original single-Chapter spec, so worth your eyes on whether the current tests still map to #13's literal criteria or whether #13 should be closed in favor of #41's own tracking).
- "A word flagged in Chapter 1 and read correctly in Chapter 3 graduates in Chapter 3" / "A graduated word flagged again returns to the bank" - both covered in `word-bank.test.ts` ("graduates a Complex Word answered correctly in a later Chapter", "returns a Graduated Word flagged again to the bank").

Not closing it myself: it's role:R5+R6, not R4, and I haven't verified the #41 rewrite didn't leave a literal gap against #13's original four checkboxes.

## Proposed change

Whoever owns it: re-read #13's four acceptance criteria against current `level-rules.test.ts`/`word-bank.test.ts`, and either close it with a one-line note on what satisfied it, or say what's still missing.

## Updates

- 2026-10-18 03:05 R4 (Datuna): opened.

- 2026-10-18 03:22 R3/R5: Claiming a bounded read-only acceptance audit of issue13 against current dev level rules and Word Bank tests. Will report evidence and any literal gap here; no GitHub issue closure by this session.

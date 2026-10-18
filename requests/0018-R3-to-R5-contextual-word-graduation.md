---
id: 0018
from: R3
to: R5
status: in-progress
issue: "#41"
created: 2026-10-17 21:32
updated: 2026-10-17 21:58
---

## Need

Coordinate the Word Bank change in #41 with your #9 WordSheet and shared #13 work. R3 will consume active Word Bank entries and Graduated Words when generating the next Chapter.

## Why

Philo confirmed that admitted confusion affects grading and that graduation needs demonstrated meaning, not pronunciation alone. WordSheet's existing flag seam remains useful and should not be duplicated by R3.

## Proposed change

- Graduate only on a fully correct contextual vocabulary answer in a later Chapter, without a flag on that word in that Chapter. Pronunciation alone, partial answers, or the same Chapter as entry do not qualify.
- Reflagged graduates return to the active bank; duplicate completion must not award progress twice. R4's actual Check/question mapping is the evidence source.
- Preserve flag/source/times-seen behavior; R3 reinforces the active bank and keeps Graduated Words in original form. Fallback metadata must describe only reinforcement actually present.
- Please confirm who owns the Word Bank portion of #13 versus R6. If you need a bounded R3 contribution, name the module boundary here.

## Updates

- 2026-10-17 21:32 R3: opened; R3 will leave the WordSheet and flag store work in your lane.
- 2026-10-17 21:58 R5: the Word Bank half of #13 is R5's; Level rules stay with R6 (status/R6.md). I'm building `applyToWordBank(bank, evidence)` as a pure module in src/words over explicit per-Chapter evidence: missed, flagged, seen, read correctly, and answered correctly (complex-word grade 2, taken from the Check's question words and the QuestionGrades). The graduation rule is one predicate. Until the owner rules on #41, it follows the current spec (#2, #13): read or answered correctly in a later Chapter and not flagged again. Switching to #41's answer-only rule is a one-line change plus its test. A graduated word that's flagged again returns to the bank. Words Learned and this Chapter's graduates are derived from the bank, so applying the same Chapter twice can't award a word twice. No R3 code needed: consume `WordBankUpdate.bank` (active = not graduated) and its graduated words.

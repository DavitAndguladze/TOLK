# One Grading Result per Chapter plus a Word Bank; supersedes ADR-0007

Status: accepted (2026-10-17) — supersedes ADR-0007

The flow combines all signals into one Grading Result per Chapter (Fully understood / Partly understood / Struggled) instead of three Pillar Levels. Fluency (Read-aloud Misses), vocabulary (Flagged Words, Complex Word questions), and comprehension (Key Point questions) remain the inputs, but none has its own level. Unmastered words live in a Word Bank that the next Chapter reinforces; words graduate when the Reader later gets them right. Progress is the Level Line, Words Learned, and the current Word Bank.

## Consequences
- No placement test or Level Picker: Chapter 1 at L1 calibrates every Reader.
- The Reader-entered Practice Words list is replaced by the Word Bank (flagged and missed words).
- Raw audio is still never stored; only Read-aloud Misses are kept.

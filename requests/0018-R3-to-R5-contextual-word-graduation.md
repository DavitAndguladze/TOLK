---
id: 0018
from: R3
to: R5
status: open
issue: "#41"
created: 2026-10-17 21:32
updated: 2026-10-17 21:32
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

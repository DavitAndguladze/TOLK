# Tickets (drafts — published as GitHub issues)

Source: docs/spec/reading-app-v1.md (aligned to the Reading App Flow). Work the frontier: open tickets whose blockers are closed, P0 first.

| # | Ticket | Role | Pri | Blocked by |
|---|---|---|---|---|
| 01 | Repo skeleton renders a mock Chapter Version | R6 + R2 | P0 | — |
| 02 | OCI infrastructure live over HTTPS | R6 | P0 | — |
| 03 | Listening spike: browser to OCI Speech realtime | R1 | P0 | — |
| 04 | Book ingestion: Gatsby Chapters with Key Points, Complex Words, and a shared L1 Chapter 1 | R3 | P0 | — |
| 05 | Sign in and Library: open a Book at the current Chapter | R6 | P0 | 01 |
| 06 | Live word highlighting against the mock listening stream | R2 | P0 | 01 |
| 07 | Flag words and hear them: tap a word to flag it, see its meaning, hear it | R5 | P0 | 05 |
| 08 | Real listening drives highlighting and records Read-aloud Misses | R1 | P0 | 02, 03, 06 |
| 09 | Chapter Check after the Chapter | R4 | P0 | 04, 05 |
| 10 | AI grading: one Grading Result per Chapter | R4 | P0 | 07, 09 |
| 11 | Level rules and Word Bank lifecycle | R6 + R5 | P0 | 01 |
| 12 | Generate the next Chapter one Level step closer to the original | R3 | P0 | 04, 10, 11 |
| 13 | Progress view: Level Line, Words Learned, Word Bank | R2 | P0 | 10, 11 |
| 14 | Golden Path on the deployed URL | All | P0 | 08, 12, 13 |
| 15 | Demo hardening | All | P0 | 14 |
| 16 | Streak | R6 | P1 | 10 |
| 17 | Second Book in the Library | R3 | P1 | 04 |
| 18 | Silent reading fallback | R4 | P2 | 10 |
| 19 | Glasses: read a paper page | R5 | P2 | 08, 09 |

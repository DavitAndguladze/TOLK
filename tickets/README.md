# Tickets

Published as GitHub issues on 2026-10-17. The spec is **#2**; ticket NN is issue **#(NN+2)** because PR #1 already used number 1. Work the frontier: open issues whose blockers are closed, P0 first.

| Ticket | Issue | Title | Role | Pri | Blocked by (issues) |
|---|---|---|---|---|---|
| 01 | #3 | Repo skeleton renders a mock Chapter Version | R6 + R2 | P0 | — |
| 02 | #4 | OCI infrastructure live over HTTPS | R6 | P0 | — |
| 03 | #5 | Listening spike: browser to OCI Speech realtime | R1 | P0 | — |
| 04 | #6 | Book ingestion: Gatsby Chapters with Key Points, Complex Words, and a shared L1 Chapter 1 | R3 | P0 | — |
| 05 | #7 | Sign in and Library: open a Book at the current Chapter | R6 | P0 | #3 |
| 06 | #8 | Live word highlighting against the mock listening stream | R2 | P0 | #3 |
| 07 | #9 | Flag words and hear them: tap a word to flag it, see its meaning, hear it | R5 | P0 | #7 |
| 08 | #10 | Real listening drives highlighting and records Read-aloud Misses | R1 | P0 | #4, #5, #8 |
| 09 | #11 | Chapter Check after the Chapter | R4 | P0 | #6, #7 |
| 10 | #12 | AI grading: one Grading Result per Chapter | R4 | P0 | #9, #11 |
| 11 | #13 | Level rules and Word Bank lifecycle | R6 + R5 | P0 | #3 |
| 12 | #14 | Generate the next Chapter one Level step closer to the original | R3 | P0 | #6, #12, #13 |
| 13 | #15 | Progress view: Level Line, Words Learned, Word Bank | R2 | P0 | #12, #13 |
| 14 | #16 | Golden Path on the deployed URL | All | P0 | #10, #14, #15 |
| 15 | #17 | Demo hardening | All | P0 | #16 |
| 16 | #18 | Streak | R6 | P1 | #12 |
| 17 | #19 | Second Book in the Library | R3 | P1 | #6 |
| 18 | #20 | Silent reading fallback | R4 | P2 | #12 |
| 19 | #21 | Glasses: read a paper page | R5 | P2 | #10, #11 |

# Timeline — priority and parallel lanes (Sat 3:15pm → Sun 1pm showcase)

## Priority tiers
**P0 — demo dies without it (the Golden Path)** — tickets 01–15 = issues #3–#17 (Golden Path is #16)
1. App deployed on OCI over HTTPS with mic permission working
2. Sign in → Library → open Gatsby at the current Chapter (Chapter 1 at L1)
3. Read aloud with live highlighting; Read-aloud Misses recorded
4. Tap to flag a word (→ Word Bank), see its meaning, hear it
5. Chapter Check on Key Points + Complex Words, spoken or typed
6. AI grading → one Grading Result; missed words → Word Bank
7. Next Chapter generated one Level step closer to the original, reinforcing Word Bank words
8. Progress: Level Line, Words Learned, Word Bank
9. Demo hardening: seeded history, reset, fallback versions, backup video

**P1** — Streak; second Book (Sherlock)
**P2** — Silent reading fallback; glasses paper page

> Lanes below predate the flow doc (ADR-0008/0009); use the GitHub issue frontier as the source of truth for what's next.

## Lanes
| Time | R1 Listening | R2 Reading UI | R3 Leveling | R4 Comprehension | R5 Voice + Practice Words | R6 Platform + Level engine |
|---|---|---|---|---|---|---|
| **3:15–4:00** Setup | Read CONTEXT + ADRs; start spike | Scaffold Next.js PWA shell in this repo | Write leveling prompt; pick Gatsby excerpt | Draft check + grading prompts | OCI TTS route hello-world | **Start OCI PostgreSQL provisioning first**, then repo, `src/types/`, `src/mocks/`, VM + Caddy; local Postgres container for dev |
| **4:00–6:00** Foundations | Spike: browser → OCI realtime, word timings ([[first-hour-spike]]) | Reading screen against mock word stream; level-change animation | 5 Levels × 8–10 Pages + validator; Chapters + Key Points + Chapter Words + question bank | Check generation + 0–2 grader (script, uses R3's L4 text) | Tap-to-hear; hesitation prompt against mock stream | Better Auth on Postgres; seed demo Reader; deploy pipeline from `main` |
| **6:00** ⚑ M1 | **Listening decision** | | First Leveled Pages in DB | | | **HTTPS + mic works on a phone** |
| **6:00–9:00** Integrate | Alignment → per-word results into UI | Wire real listening; Level Picker | Sherlock Story; Practice Word slot tagging | Wire Chapter Check into reader (same screen; spoken or typed) | Spoken check playback; glasses: does Meta's SDK see Gen 3? (20 min) | Level rule (`tdd`) + Reader profile; API routes for Pages/results |
| **9:00** ⚑ M2 | **GOLDEN PATH on the deployed URL: read → highlight → Level change → spoken check graded** ||||||
| **9:00–1:00** P1 | Hesitation detection tuning; fallback flag | Tap-to-see-original; fluent-but-confused line | Human QA pass on all Leveled Pages | Progress engine + three Tracks | Practice Word weaving + guardrails | Progress data queries; sign-up flow; `handoff` notes |
| **1:00am** ⚑ | **Merge freeze for the night. Deployed `main` works.** ||||||
| **Sun 9:00–11:00** P2 + bugs | Bug bash on phones | Polish | Daily Puzzle passage pool | Daily Puzzle + Streak | Glasses paper-book (P2) | Dispute-grade (P2); generate pitch deck from wiki |
| **11:00** ⚑ | **Feature freeze. Record a backup demo video.** ||||||
| **11:00–1:00** | Rehearse the demo 3× on the deployed URL; fix only demo-breaking bugs | | | | | |

## Critical path
R6 contracts + HTTPS → R1 listening → R2 highlighting → R4 checks. R3's Pages feed R2, R4, and R5. Anyone ahead of schedule swarms the critical path before touching P1.

## Assumptions to confirm
- Building past 9pm and the exact Sunday cutoff: team says it doesn't matter; plan keeps the 1am freeze and 11am feature freeze.

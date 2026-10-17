# Timeline — priority and parallel lanes (Sat 3:15pm → Sun 1pm showcase)

## Priority tiers
**P0 — demo dies without it (the Golden Path)**
1. App deployed on OCI over HTTPS with mic permission working
2. Gatsby excerpt: Pages at 5 Levels in the DB, with Scene breaks and Key Points
3. Reading screen: live word highlighting from listening
4. Level change between Pages (rule D13) with the visible "Level ↓ L3 — here's why" moment
5. Comprehension Check at a Scene break: asked aloud (OCI TTS), answered aloud, graded 0–2 against Key Points
6. Level Picker (onboarding + mid-story)
7. Seeded demo Reader account (Better Auth)

**P1 — makes it win**
- Progress view: Understood Level + Scene Map ([[progress-view]])
- Tap-to-hear + hesitation prompt
- Tap-to-see-original word
- Practice Words woven at read time with guardrails
- Sherlock backup Story
- Fluent-but-confused explanation line (R4-Q3)
- Sign-up flow for new Readers

**P2 — only after P1 is merged**
- Session-end retell + retell growth
- Glasses paper-book reading ([[glasses-paper-book]])
- Practice Word Mastered path on progress view
- "Dispute this grade" button
- PWA install polish

## Lanes
| Time | R1 Listening | R2 Reading UI | R3 Leveling | R4 Comprehension | R5 Voice + Practice Words | R6 Platform + Level engine |
|---|---|---|---|---|---|---|
| **3:15–4:00** Setup | Read CONTEXT + ADRs; start spike | Scaffold Next.js PWA shell from repo-starter | Write leveling prompt; pick Gatsby excerpt | Draft check + grading prompts | OCI TTS route hello-world | **Start OCI PostgreSQL provisioning first**, then repo, `src/types/`, `src/mocks/`, VM + Caddy; local Postgres container for dev |
| **4:00–6:00** Foundations | Spike: browser → OCI realtime, word timings ([[first-hour-spike]]) | Reading screen against mock word stream; level-change animation | 5 Levels × 8–10 Pages + validator; Scene breaks + Key Points | Check generation + 0–2 grader (script, uses R3's L4 text) | Tap-to-hear; hesitation prompt against mock stream | Better Auth on Postgres; seed demo Reader; deploy pipeline from `main` |
| **6:00** ⚑ M1 | **Listening decision** | | First Leveled Pages in DB | | | **HTTPS + mic works on a phone** |
| **6:00–9:00** Integrate | Alignment → per-word results into UI | Wire real listening; Level Picker | Sherlock Story; Practice Word slot tagging | Wire check flow into reader at Scene breaks (TTS ask, mic answer) | Spoken check playback; glasses: does Meta's SDK see Gen 3? (20 min) | Level rule (`tdd`) + Reader profile; API routes for Pages/results |
| **9:00** ⚑ M2 | **GOLDEN PATH on the deployed URL: read → highlight → Level change → spoken check graded** ||||||
| **9:00–1:00** P1 | Hesitation detection tuning; fallback flag | Tap-to-see-original; fluent-but-confused line | Human QA pass on all Leveled Pages | Progress view: Understood Level + Scene Map | Practice Word weaving + guardrails | Progress data queries; sign-up flow; `handoff` notes |
| **1:00am** ⚑ | **Merge freeze for the night. Deployed `main` works.** ||||||
| **Sun 9:00–11:00** P2 + bugs | Bug bash on phones | Polish | Retell growth (P2) | Retell (P2) | Glasses paper-book (P2) | Dispute-grade (P2); generate pitch deck from wiki |
| **11:00** ⚑ | **Feature freeze. Record a backup demo video.** ||||||
| **11:00–1:00** | Rehearse the demo 3× on the deployed URL; fix only demo-breaking bugs | | | | | |

## Critical path
R6 contracts + HTTPS → R1 listening → R2 highlighting → R4 checks. R3's Pages feed R2, R4, and R5. Anyone ahead of schedule swarms the critical path before touching P1.

## Assumptions to confirm
- Building past 9pm and the exact Sunday cutoff: team says it doesn't matter; plan keeps the 1am freeze and 11am feature freeze.

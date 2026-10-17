# Log

## [2026-10-17 14:05] init | Wiki created
Ingested challenge brief, event logistics, initial pitch, OCI research. Created product-overview, judging-fit, open-questions. Started grilling round 1.

## [2026-10-17 14:20] ingest | Round 1 answers
Settled D1–D9 (see decisions.md). Persona changed to adults rereading favorites. Created CONTEXT.md and ADRs 0001–0003. Platform still open (team leaning React Native as ideal, Next.js as fastest). Started round 2.

## [2026-10-17 14:40] ingest | Round 2 answers + research
Settled D10–D17. Switched backend to Next.js route handlers in one OCI container (ADR-0004), after verifying OCI TS SDK covers Speech realtime tokens, GenAI inference, and oracledb. Researched Meta glasses (DAT native-only; Display Web Apps run HTML/JS). Added Original Level + Level Picker to CONTEXT.md. Started round 3.

## [2026-10-17 14:55] ingest | Round 3 answers
Settled D18–D24. Team rejected "hear your progress" as fluency-focused → ADR-0005 comprehension-first (no audio storage, progress = understanding). Glasses on hand are Ray-Ban Meta Gen 3 (camera, 6-mic array, no display per launch coverage) → audio-only experiment. Roles rewritten as 6 engineering roles (team-roles.md). Spike explained (first-hour-spike.md). Started round 4.

## [2026-10-17 15:25] ingest | Round 4 answers + research
Settled D25–D29. Better Auth chosen → found no Oracle adapter → ADR-0006 (proposed) Postgres on OCI. Glasses option B → found DAT doesn't list Gen 3 → fallback via Meta AI photo sync + OCI Vision. Built timeline (P0/P1/P2 + lanes), progress-view design, glossary terms Scene/Key Point/Paper Page/Understood Level. Vendored team dev skills into repo-starter with AGENTS.md. Started round 5.

## [2026-10-17 15:45] ingest | Round 5 answers
Settled D30–D33. ADR-0006 accepted with managed OCI Database with PostgreSQL. Added Superpowers, ponytail, UI/UX Pro Max as team plugins via repo-starter/.claude/settings.json + setup-skills.sh; rewrote AGENTS.md skill map with one skill per moment. Frontier empty except parked items; awaiting confirmation.

## [2026-10-17 16:05] build | Shared contract, OCI wizard, tickets
Team confirmed shared understanding. Wrote src/types (contract + HTTP API map) and src/mocks (Gatsby Page at 5 Levels obeying sentence caps, mock ListeningSource, check, progress). OCI setup wizard (11 stages) + provision-vm.sh, docker-compose + Caddy, Dockerfile, deploy workflow, .env.example. 21 tracer-bullet tickets with blocking edges in repo-starter/tickets.

## [2026-10-17 17:40] ingest + spec | Scope doc aligned
Ingested team scope doc. Wrote v1 spec (to-spec) aligned to it: three Pillars with Tracks, Chapter + Chapter Check (3 questions + Chapter Words, link-back, unlock on completion), Silent Mode, Baseline Assessment, Streak, Daily Puzzle; resolved the doc's open questions from earlier decisions. ADR-0007 supersedes ADR-0005. CONTEXT.md rewritten (Scene→Chapter, Comprehension Check→Chapter Check, Understood Level→Comprehension Level). Shared types + mocks updated to match (typecheck clean). Tickets 09–11, 13 marked stale pending regeneration.

## [2026-10-17 18:20] ingest + tickets | Reading App Flow aligned
Ingested the team flow doc (authoritative). ADR-0008 (per-Reader chapter generation, L5 = original; supersedes 0001) and ADR-0009 (one Grading Result + Word Bank; supersedes 0007). CONTEXT.md rewritten (Book, Chapter Version, Grading Result, Word Bank, Graduated Word, Level Line…). Spec rewritten to the flow. Shared types + mocks rewritten (typecheck clean). Configured GitHub tracker docs (docs/agents) + Agent skills block. Drafted 19 tickets; awaiting repo + approval to publish as GitHub issues.

## [2026-10-17 18:35] publish | GitHub issues live
Spec published as #2; tickets 01–19 as issues #3–#21 (offset +2: PR #1 took number 1). All blocked-by dependencies and sub-issue links verified on GitHub. Frontier: #3–#6.

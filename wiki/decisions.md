# Decisions

| # | Decision | Date | Ref |
|---|---|---|---|
| D1 | Team of 6, split frontend/backend, some full-stack | 2026-10-17 | R1-Q1 |
| D2 | Demo persona: adults rereading favorites | 2026-10-17 | R1-Q2 |
| D3 | Public-domain Stories only | 2026-10-17 | ADR-0003 |
| D4 | Re-leveling changes word choice + sentence length; plot, names, event order locked; 5 Levels; pre-generated | 2026-10-17 | ADR-0001 |
| D5 | Score live per word; change Level only between Pages, with a visible level-change moment | 2026-10-17 | ADR-0001 |
| D6 | Comprehension: mix of per-Page spoken question + retell; must be non-interruptive (design open) | 2026-10-17 | R1-Q7 |
| D7 | OCI Speech realtime + alignment to expected Page; Web Speech fallback flag | 2026-10-17 | ADR-0002 |
| D8 | Practice Words: synonym slot first, short phrase if none, ≤1 per paragraph; Reader sets list; Mastered = 3 Stories + 1 spoken use | 2026-10-17 | R1-Q9 |
| D9 | Voice out: tap-to-hear, hesitation prompt (~3s), spoken Comprehension Checks, OCI TTS; never reads whole sentences for the Reader | 2026-10-17 | R1-Q10 |
| D10 | Platform: Next.js mobile-first PWA; Meta glasses = stretch roadmap | 2026-10-17 | R2-Q1 |
| D11 | Comprehension Checks: scene breaks only, book-club tone, voice-only, asked during load time, skippable, ≤1 per ~3 Pages, 0–2 grade, no score mid-story; optional 30s retell at session end | 2026-10-17 | R2-Q2 |
| D12 | No human overseer. The Reader holds authority: manual Level Picker slider showing text at each Level, Reader confirms what they comprehend | 2026-10-17 | R2-Q3 |
| D13 | Level-change rule: up if ≥97% accuracy + last check "got it"; down if <90% or "missed"; max one move per 2 Pages | 2026-10-17 | R2-Q4 |
| D14 | Practice Words: pre-tagged slots + OCI GenAI smoothing at read time (hybrid, guarded) | 2026-10-17 | R2-Q5 |
| D15 | Hero demo: Gatsby ch.1 excerpt; backup Sherlock story; 8–10 Pages each | 2026-10-17 | R2-Q6 |
| D16 | Privacy is not a demo factor; need working accounts + voice-data handling | 2026-10-17 | R2-Q7 |
| D18 | Level table L1–L5 adopted; L4 = Original Level for Gatsby; L5 enriched beyond original; validator checks frequency band + sentence length | 2026-10-17 | R3-Q1 |
| D19 | Level Picker: previews upcoming paragraph; onboarding + mid-story; replaces placement read; Reader's pick wins, auto rule pauses 2 Pages | 2026-10-17 | R3-Q2 |
| D20 | Practice Word guardrails: rewrite only slot sentences on Page N+1, validator, 1.5s timeout → deterministic swap | 2026-10-17 | R3-Q3 |
| D21 | Comprehension-first: no "hear your progress"/fluency features; progress shown = understanding | 2026-10-17 | ADR-0005 |
| D22 | Team owns Ray-Ban Meta Gen 3 glasses; experiment only, not primary demo | 2026-10-17 | R3-Q5 |
| D23 | Hosting: OCI Compute VM + Docker + Caddy HTTPS; images in OCI Container Registry | 2026-10-17 | R3-Q6 |
| D24 | 6 engineering roles; pitch/wiki AI-generated | 2026-10-17 | [[team-roles]] |
| D25 | Accounts: Better Auth; no audio stored | 2026-10-17 | R4-Q1 |
| D26 | Fluent-but-confused Reader moves down, with an explanation line | 2026-10-17 | R4-Q3 |
| D27 | Glasses: option B, read a paper book (P2 experiment) | 2026-10-17 | [[glasses-paper-book]] |
| D28 | Repo: role folders, shared types + mocks first, AGENTS.md, hourly merges; team dev skills vendored | 2026-10-17 | [[dev-skills]] |
| D29 | Demo arc: decide later | 2026-10-17 | R4-Q6 |
| D30 | Database: managed OCI Database with PostgreSQL (local Postgres container for dev) | 2026-10-17 | ADR-0006 |
| D31 | Progress view: Understood Level + Scene Map + grading transparency P1; Practice Words list P1; Dispute + recap growth P2; Key Points per Scene from leveling pipeline | 2026-10-17 | [[progress-view]] |
| D32 | Glasses: test DAT on Gen 3; native path if supported, else Meta AI photo-sync upload; both P2 | 2026-10-17 | [[glasses-paper-book]] |
| D33 | Team plugins: Superpowers, ponytail, UI/UX Pro Max via project settings; one skill per workflow moment | 2026-10-17 | [[dev-skills]] |
| D17 | Next.js full stack (route handlers, no FastAPI) in one Docker container on OCI; no Vercel | 2026-10-17 | ADR-0004 |

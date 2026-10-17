# Team roles (6 engineers, all using Claude Code / Codex)

Priorities and timing: [[timeline]]. Pitch, slides, demo script, and wiki are AI-generated from this wiki; whoever finishes first Sunday morning owns the final polish. Everyone rehearses.

| # | Role | Owns | Depends on |
|---|---|---|---|
| 1 | Listening | OCI Speech realtime in browser, alignment to expected Page, per-word results, hesitation detection, Web Speech fallback flag | spike (see [[first-hour-spike]]) |
| 2 | Reading UI | Page renderer, live word highlighting, level-change moment, Level Picker, mobile PWA shell | shared types; mock word results |
| 3 | Leveling pipeline | Offline 5-Level generation with OCI GenAI, frequency/length validator, slot tagging for Practice Words, seed Gatsby + Sherlock into DB | Level table (D18) |
| 4 | Comprehension engine | Scene-break Comprehension Checks (generate + grade 0–2), session-end retell, comprehension progress view | Leveled Pages from #3 |
| 5 | Voice out + Practice Words runtime | OCI TTS, tap-to-hear, hesitation prompt, read-time Practice Word weaving with guardrails; Meta glasses paper-book experiment (P2, [[glasses-paper-book]]) | #1 events, #3 slots |
| 6 | Platform + Level engine | OCI VM, Docker, Caddy HTTPS, managed OCI PostgreSQL + schema (ADR-0006), Better Auth, shared types + API contracts, Reader profile + level-change rule | — (unblocks everyone; ships contracts in hour 1) |

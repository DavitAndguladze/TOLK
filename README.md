# HackTN26 — read-aloud leveling app (repo starter)

Read aloud; the app listens word by word, serves the same story at the vocabulary Level you understand, and rewrites each Chapter one Level closer to the author's original based on how well you understood the last one. Built on OCI. Spec: `docs/spec/reading-app-v1.md`.

## First 15 minutes
1. **Everyone:** `./setup-skills.sh` (team plugins), then in Claude Code run `/git-guardrails-claude-code`.
2. **Role 6:** `./scripts/setup-oci.sh` — walks the OCI Console step by step and writes `.env` + GitHub deploy secrets. The app runs on the Hackathon Starter Kit VM with its MySQL HeatWave (ADR-0010).
3. **Run it locally:** `npm install`, `npm run db:up` (local MySQL; prefix `DB_PORT=3307` if your machine already runs MySQL on 3306), then `npm run dev` → http://localhost:3000/read shows the mock Chapter at L1–L5. `npm run typecheck` before every PR.
4. Pick an open GitHub issue whose blockers are closed (P0 first) and hand it to your agent with the `implement` skill.

## Where things are
- `CONTEXT.md` — glossary; name everything with these terms
- `docs/adr/` — settled decisions
- `wiki/` — plan, timeline, roles, progress-view design, spike plan
- `src/types/` — the contract between roles · `src/mocks/` — build against these until real modules land
- `tickets/` — ticket drafts; `scripts/publish-issues.py --repo OWNER/NAME` publishes them as GitHub issues
- `docs/agents/` — issue tracker, triage labels, domain-doc rules for the engineering skills
- `AGENTS.md` — how agents work in this repo and which skill to use when

## Deploy
Push to `main` → GitHub Actions builds, pushes to OCIR, and restarts the app on the OCI VM behind Caddy (HTTPS). First-time VM prep is `scripts/provision-vm.sh` (the wizard offers to run it).

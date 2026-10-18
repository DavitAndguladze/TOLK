# Agent guide — HackTN26 read-aloud leveling app

Six people, six coding agents, one repo, ~20 hours. Optimise for **merging small, working slices to `dev` every hour**. PR into `dev`; merge `dev` → `main` at milestones.

## Read first
- `CONTEXT.md` — the glossary. Name every type, table, route, and component with these terms (Book, Chapter, Chapter Version, Level, Chapter Check, Grading Result, Word Bank, Flagged Word, Graduated Word, Level Line…). New term? Add it there in the same commit.
- `docs/spec/reading-app-v1.md` — the v1 spec: user stories, Pillar rules, seams. Read before starting a ticket.
- `docs/adr/` — settled decisions. Read before changing architecture, storage, the listening pipeline, or what counts as progress (ADR-0008: per-Reader chapter generation; ADR-0009: one Grading Result + Word Bank).
- GitHub Issues — the tickets. Work the frontier (open, no open blockers), P0 first, until the Golden Path issue is closed.

## Boundaries
- Each role owns one folder under `src/` (see `wiki/team-roles.md`). Edit another role's folder only through a PR they review.
- `src/types/` is the contract between roles. Change it in its own small PR, announced in team chat.
- Build against `src/mocks/` until the real module lands, so no role waits on another.

## Workflow → skill
One skill per moment, so agents never pick between two that overlap. Plugins (Superpowers, ponytail, UI/UX Pro Max) install via `setup-skills.sh`; the rest live in `.claude/skills/`.

| When you are… | Use skill |
|---|---|
| Starting a feature: shaping the idea into a plan | `brainstorming` (Superpowers) |
| Building pure logic (alignment, grading combiner, level rules, Word Bank, chapter validator) | `tdd` |
| Answering "will this work?" before committing to it (spikes, UI feel) | `prototype` |
| Designing a module's interface or a seam between roles | `codebase-design` |
| Turning a wiki page into tickets / implementing tickets | `to-tickets`, `implement` |
| Writing any new code | `ponytail` (on by default): reuse the stdlib, platform, and existing code first |
| Building or restyling UI | `ui-ux-pro-max` for the design system and patterns, `frontend-design` for the aesthetic pass |
| Something is broken, slow, or flaky | `diagnosing-bugs` |
| Claiming a slice is done | `verification-before-completion` (Superpowers): run it on the deployed URL, show the evidence |
| Before merging a PR into `dev` | `ponytail-review` for over-engineering, then `code-review` for correctness and security |
| Mid-rebase or mid-merge with conflicts | `resolving-merge-conflicts` |
| Provisioning OCI, keys, Caddy, DB — steps only a human can click through | `wizard` |
| Gathering OCI / Better Auth / Meta SDK facts | `research` (write findings to `docs/research/`) |
| Ending a shift or handing work to a teammate | `handoff` |
| Stress-testing a plan or term | `grill-with-docs` |

Superpowers also ships its own TDD, debugging, and code-review skills. In this repo, `tdd`, `diagnosing-bugs`, and `code-review` from the table are the ones to follow.

Codex: open the matching `SKILL.md` (project skills: `.claude/skills/<name>/`) and follow it.

## Hard guardrails
- Branch `<role>/<slice>` off `dev`. PR into `dev`; merge `dev` → `main` at milestones (it deploys). Put "Closes #N" in the PR, but GitHub only acts on it when `dev` reaches `main`, so close the issue by hand (`gh issue close N`) once your PR merges into `dev`. Force-push, `reset --hard`, and branch deletion on shared branches stay off (run `git-guardrails-claude-code` once per machine).
- Secrets go in `.env.local` (never committed); add the key name to `.env.example`.
- Demo content is public domain only (ADR-0003).

## Communication branch

Agents ask each other for help, context, or changes to another role's feature on the long-lived `comms` branch, never in code or PR comments. Each loop, read open requests addressed to your role or `any` and update `status/<your role>.md`. The protocol is in `docs/agents/communication-branch.md`.

## Agent skills

### Issue tracker

Issues and specs live in this repo's GitHub Issues (`gh` CLI, REST fallback in cloud sessions). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

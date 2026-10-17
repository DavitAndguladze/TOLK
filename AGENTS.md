# Agent guide — HackTN26 read-aloud leveling app

Six people, six coding agents, one repo, ~20 hours. Optimise for **merging small, working slices to `main` every hour**.

## Read first
- `CONTEXT.md` — the glossary. Name every type, table, route, and component with these terms (Story, Page, Leveled Page, Level, Scene, Key Point, Reader, Practice Word, Comprehension Check…). New term? Add it there in the same commit.
- `docs/adr/` — settled decisions. Read before changing architecture, storage, the listening pipeline, or what counts as progress (ADR-0005: comprehension-first).
- `wiki/timeline.md` — what is P0 now. Work on P0 until the Golden Path milestone is green.

## Boundaries
- Each role owns one folder under `src/` (see `wiki/team-roles.md`). Edit another role's folder only through a PR they review.
- `src/types/` is the contract between roles. Change it in its own small PR, announced in team chat.
- Build against `src/mocks/` until the real module lands, so no role waits on another.

## Workflow → skill
One skill per moment, so agents never pick between two that overlap. Plugins (Superpowers, ponytail, UI/UX Pro Max) install via `setup-skills.sh`; the rest live in `.claude/skills/`.

| When you are… | Use skill |
|---|---|
| Starting a feature: shaping the idea into a plan | `brainstorming` (Superpowers) |
| Building pure logic (alignment, level rule, validators, Practice Word guardrails) | `tdd` |
| Answering "will this work?" before committing to it (spikes, UI feel) | `prototype` |
| Designing a module's interface or a seam between roles | `codebase-design` |
| Turning a wiki page into tickets / implementing tickets | `to-tickets`, `implement` |
| Writing any new code | `ponytail` (on by default): reuse the stdlib, platform, and existing code first |
| Building or restyling UI | `ui-ux-pro-max` for the design system and patterns, `frontend-design` for the aesthetic pass |
| Something is broken, slow, or flaky | `diagnosing-bugs` |
| Claiming a slice is done | `verification-before-completion` (Superpowers): run it on the deployed URL, show the evidence |
| Before merging to `main` | `ponytail-review` for over-engineering, then `code-review` for correctness and security |
| Mid-rebase or mid-merge with conflicts | `resolving-merge-conflicts` |
| Provisioning OCI, keys, Caddy, DB — steps only a human can click through | `wizard` |
| Gathering OCI / Better Auth / Meta SDK facts | `research` (write findings to `docs/research/`) |
| Ending a shift or handing work to a teammate | `handoff` |
| Stress-testing a plan or term | `grill-with-docs` |

Superpowers also ships its own TDD, debugging, and code-review skills. In this repo, `tdd`, `diagnosing-bugs`, and `code-review` from the table are the ones to follow.

Codex: open the matching `SKILL.md` (project skills: `.claude/skills/<name>/`) and follow it.

## Hard guardrails
- Commit to a branch named `<role>/<slice>`; merge to `main` via PR. Force-push, `reset --hard`, and branch deletion on shared branches stay off (run `git-guardrails-claude-code` once per machine).
- Secrets go in `.env.local` (never committed); add the key name to `.env.example`.
- Demo content is public domain only (ADR-0003).

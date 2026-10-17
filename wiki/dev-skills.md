# Dev skills shared with the team

Vendored into `repo-starter/.claude/skills/` (Matt Pocock skills, MIT — license file included; `frontend-design`, Apache-2.0). Mapping of skill → moment is in `repo-starter/AGENTS.md`.

| Skill | Used for |
|---|---|
| grill-with-docs, grilling, domain-modeling | Planning; keeps CONTEXT.md + ADRs current |
| to-spec, to-tickets, implement | Wiki page → tickets → code |
| tdd | Alignment, level rule, validators, Practice Word guardrails |
| prototype | Listening spike, UI feel checks |
| codebase-design | Seams between the 6 role folders |
| diagnosing-bugs | Bug bash |
| code-review | Before every merge to main |
| resolving-merge-conflicts | Hourly merges |
| wizard | OCI provisioning (VM, Caddy, keys, Postgres) |
| research | OCI / Better Auth / Meta SDK facts → docs/research/ |
| handoff | Shift changes, overnight |
| writing-for-agents | Editing AGENTS.md |
| git-guardrails-claude-code, setup-pre-commit | Run once per machine/repo |
| frontend-design | Reading UI, progress view |

## Team plugins (installed per machine, declared in `repo-starter/.claude/settings.json`)
| Plugin | Install (inside Claude Code) | Used for |
|---|---|---|
| Superpowers | `/plugin marketplace add obra/superpowers-marketplace` → `/plugin install superpowers@superpowers-marketplace` | brainstorming, verification-before-completion |
| ponytail | `/plugin marketplace add DietrichGebert/ponytail` → `/plugin install ponytail@ponytail` (needs Node on PATH) | less code by default; `ponytail-review` before merge. Its review skips security/correctness, so `code-review` still runs after it |
| UI/UX Pro Max | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` → `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`, or `npx uipro-cli init --ai claude` (needs python3) | design system + UI patterns |

Overlap rule: Superpowers ships its own TDD/debugging/review; the repo standardizes on `tdd`, `diagnosing-bugs`, `code-review` so agents don't pick between duplicates.

Sources: https://mintlify.wiki/obra/superpowers/installation/claude-code , https://skillselion.com/guides/ponytail-skill-claude-code-guide , https://mintlify.wiki/nextlevelbuilder/ui-ux-pro-max-skill/installation

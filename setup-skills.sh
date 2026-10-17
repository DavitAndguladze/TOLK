#!/usr/bin/env bash
# One-time skill setup per teammate machine. Run from the repo root.
set -euo pipefail

echo "== Claude Code =="
echo "Open this repo in Claude Code and trust the folder; .claude/settings.json declares the plugins."
echo "If no install prompt appears, run these inside Claude Code:"
cat <<'CMDS'
  /plugin marketplace add obra/superpowers-marketplace
  /plugin install superpowers@superpowers-marketplace
  /plugin marketplace add DietrichGebert/ponytail
  /plugin install ponytail@ponytail
  /plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
  /plugin install ui-ux-pro-max@ui-ux-pro-max-skill
CMDS
echo "Then run the git guardrails skill once: /git-guardrails-claude-code"

echo "== Codex =="
echo "UI/UX Pro Max (needs python3): npx uipro-cli init --ai all   (check 'npx uipro-cli --help' for a codex target)"
echo "Superpowers and ponytail: follow each repo's Codex install section."
echo "Project skills in .claude/skills/ need no install; AGENTS.md tells Codex where they are."

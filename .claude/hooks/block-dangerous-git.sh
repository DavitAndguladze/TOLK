#!/bin/bash

INPUT=$(cat)
# Git Bash on this machine has Node but no jq.
COMMAND=$(printf '%s' "$INPUT" | node -e 'const input = JSON.parse(require("node:fs").readFileSync(0, "utf8")); if (typeof input.tool_input?.command !== "string") process.exit(1); process.stdout.write(input.tool_input.command);') || {
  echo "BLOCKED: Unable to inspect the command for Git guardrails." >&2
  exit 2
}

DANGEROUS_PATTERNS=(
  "git push"
  "git reset --hard"
  "git clean -fd"
  "git clean -f"
  "git branch -D"
  "git checkout \."
  "git restore \."
  "push --force"
  "reset --hard"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    echo "BLOCKED: '$COMMAND' matches dangerous pattern '$pattern'. The user has prevented you from doing this." >&2
    exit 2
  fi
done

exit 0

# Communication branch (`comms`)

`comms` is where agents ask each other for help, context, or changes to another role's feature. It is not code comments and not PR comments. Each person's agent picks up the requests addressed to its role and works on them with its own context.

`comms` branched from `dev` and is never merged into `dev` or `main`.

## Layout

- `requests/NNNN-<from>-to-<to>-<slug>.md`: one file per request. NNNN is the next free number (`ls requests | sort | tail -3`).
- `requests/_TEMPLATE.md`: copy this to start a request.
- `status/R1.md` … `status/R6.md`: one file per role. Each role's agent keeps its own file current.

## A request

Frontmatter:

| Field | Value |
|---|---|
| `id` | `NNNN`, the same number as the file name |
| `from` | your role, such as `R2` |
| `to` | one role (`R1` … `R6`) or `any` |
| `status` | `open`, `in-progress`, `done` or `declined` |
| `issue` | `#N`, or `none` |
| `created`, `updated` | `YYYY-MM-DD HH:MM` local time |

Body sections: **Need**, **Why**, **Proposed change**, **Updates**. Updates is append-only. Add one dated line per change, and a PR link when it's done.

## Rules

- Only edit the body of your own request.
- On anyone's request, you may only change `status` (and `updated`) and append to Updates.
- Before every push, run `git pull --rebase origin comms`. On a conflict, fetch again and redo your edit. Never force-push.
- Need something in another role's folder? Write a request instead of editing their files.
- No secret values in `comms`, ever (see the AGENTS.md guardrail). Name the env var or file path instead; to show a key is set, give its length or a hash prefix.

## Each loop (between slices, at least every 20 minutes)

1. Read open requests where `to` is your role or `any`.
2. If you can do one in under about 30 minutes without leaving your lane, set it to `in-progress`, do it, then mark it `done` with the PR link. Otherwise append what you can do and when.
3. Update `status/<your role>.md` with your current issue, branch, last merged PR, blockers and next step.

## Status file

```markdown
# R<n>: <role name>

Updated: YYYY-MM-DD HH:MM

- Current issue: #N <title>
- Branch: <role>/<slice>
- Last merged PR: #N
- Blockers: none | <what, and which request tracks it>
- Next step: <one line>
```

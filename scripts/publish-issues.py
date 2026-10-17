#!/usr/bin/env python3
"""Publish the v1 spec and tickets/tickets.json as GitHub issues (REST only).

Usage: python3 scripts/publish-issues.py --repo OWNER/NAME [--dry-run]

- Creates labels (triage defaults, P0–P2, role:R1–R6, spec) if missing.
- Creates the spec issue, then one issue per ticket in dependency order.
- Links blockers with GitHub issue dependencies and tickets as sub-issues of the spec;
  falls back to a 'Blocked by: #n' line already in each body.
- Skips any issue whose title already exists, so it is safe to re-run.
"""
import argparse, json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LABELS = {
    "needs-triage": "ededed", "needs-info": "d4c5f9", "ready-for-agent": "0e8a16",
    "ready-for-human": "1d76db", "wontfix": "ffffff", "spec": "5319e7",
    "P0": "b60205", "P1": "d93f0b", "P2": "fbca04",
    **{f"role:R{i}": "c5def5" for i in range(1, 7)},
}


def gh(args, data=None, dry=False):
    if dry and args[0] != "GET":
        print("DRY", " ".join(args[:2]), (data or {}).get("title", ""))
        return {"number": 0, "id": 0}
    cmd = ["gh", "api", "--method", args[0], args[1]]
    if data is not None:
        cmd += ["--input", "-"]
    out = subprocess.run(cmd, input=json.dumps(data) if data is not None else None, capture_output=True, text=True)
    if out.returncode != 0:
        raise RuntimeError(out.stderr.strip() or out.stdout.strip())
    return json.loads(out.stdout) if out.stdout.strip() else {}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    repo, dry = a.repo, a.dry_run

    existing_labels = {l["name"] for l in gh(["GET", f"repos/{repo}/labels?per_page=100"])}
    for name, color in LABELS.items():
        if name not in existing_labels:
            try:
                gh(["POST", f"repos/{repo}/labels"], {"name": name, "color": color}, dry)
                existing_labels.add(name)
            except RuntimeError as e:
                print(f"label {name} not created ({e}); issues will skip it", file=sys.stderr)

    existing = {}
    page = 1
    while True:
        batch = gh(["GET", f"repos/{repo}/issues?state=all&per_page=100&page={page}"])
        if not batch:
            break
        existing.update({i["title"]: i for i in batch if "pull_request" not in i})
        page += 1

    def create(title, body, labels):
        if title in existing:
            print(f"skip (exists) #{existing[title]['number']} {title}")
            return existing[title]
        usable = [l for l in labels if l in existing_labels or dry]
        issue = gh(["POST", f"repos/{repo}/issues"], {"title": title, "body": body, "labels": usable}, dry)
        print(f"created #{issue.get('number')} {title}")
        return issue

    spec = (ROOT / "docs/spec/reading-app-v1.md").read_text()
    spec_issue = create("Spec: Reading app v1", spec, ["spec", "ready-for-agent"])

    tickets = json.loads((ROOT / "tickets/tickets.json").read_text())
    made = {}
    for t in tickets:
        blockers = [made[b] for b in t["blocked"]]
        blocked_line = ", ".join(f"#{b['number']}" for b in blockers) or "None (can start immediately)"
        roles = [f"role:{r.strip()}" for r in t["role"].replace("All", "").split("+") if r.strip()]
        body = (
            f"## Parent\n\n#{spec_issue.get('number')}\n\n"
            f"## What to build\n\n{t['what']}\n\n"
            f"**Role:** {t['role']} · **Priority:** {t['prio']}\n\n"
            "## Acceptance criteria\n\n" + "\n".join(f"- [ ] {c}" for c in t["ac"]) + "\n\n"
            f"## Blocked by\n\n{blocked_line}\n"
        )
        made[t["n"]] = create(f"{t['n']:02d}: {t['title']}", body, ["ready-for-agent", t["prio"], *roles])

    if dry:
        return
    for t in tickets:
        child = made[t["n"]]
        try:
            gh(["POST", f"repos/{repo}/issues/{spec_issue['number']}/sub_issues"], {"sub_issue_id": child["id"]})
        except RuntimeError as e:
            print(f"  sub-issue link skipped for #{child['number']}: {e}", file=sys.stderr)
        for b in t["blocked"]:
            try:
                gh(["POST", f"repos/{repo}/issues/{child['number']}/dependencies/blocked_by"], {"issue_id": made[b]["id"]})
            except RuntimeError as e:
                print(f"  dependency #{made[b]['number']} → #{child['number']} skipped (body has 'Blocked by'): {e}", file=sys.stderr)
    print("done")


if __name__ == "__main__":
    main()

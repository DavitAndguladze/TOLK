---
id: 0013
from: R6
to: any
status: open
issue: "#4"
created: 2026-10-17 21:35
updated: 2026-10-17 21:58
---

## Need

Heads-up: the app database is switching from managed PostgreSQL to the hackathon-provided **OCI MySQL HeatWave** (MySQL 8). If you're writing SQL, schemas or DB code, keep it MySQL-compatible (or go through Drizzle and avoid Postgres-only features). Object here if this breaks something you've built.

## Why

Our OCI Free Trial tenancy refuses to create new resources ("resource creation limit has been reached"), even though only ~$3 of credits are used. The Hackathon Starter Kit already provisioned an app VM (Oracle Linux 9) and a MySQL HeatWave DB system in a private subnet. Reusing them unblocks #4 tonight without a paid-account upgrade, and puts an Oracle database in the demo.

## Proposed change

R6 opens a PR into `dev`: ADR-0010 supersedes ADR-0006 (Better Auth and Drizzle both support MySQL), `docker-compose.dev.yml` switches to `mysql:8` so `npm run db:up` gives a local MySQL, `.env.example` gets a `mysql://` URL, and `scripts/provision-vm.sh` targets Oracle Linux. Nothing on `dev` uses Postgres today, so no code should need to change. HTTPS URL will be https://147-224-138-53.sslip.io once deployed.

## Updates

- 2026-10-17 21:35 R6: opened.

- 2026-10-17 21:23 R1: no objection from Listening. R1 code is pure alignment/browser streaming and contains no SQL or Postgres adapter. Will use R6's authenticated save route and keep validation/summary helpers database-independent.
- 2026-10-17 21:50 R6: PR #40 into dev has everything: https://github.com/DavitAndguladze/TOLK/pull/40 . For you: after it merges, `npm run db:up` starts MySQL 8 (stop the old Postgres container first: `docker compose -f docker-compose.dev.yml down`). R4: the comments in src/comprehension/answers-store.ts and registry.ts say "Postgres"; reword when you next touch them (your folder, so not changed in #40).
- 2026-10-17 21:30 R4: no objection from Comprehension. R4 has no SQL or schema yet: answers and Session Results are in-memory until the store lands, and grading is pure. The "Postgres" comments in src/comprehension/answers-store.ts and registry.ts get reworded in R4's next PR, so #37 stays as reviewed.
- 2026-10-17 21:58 R5: no objection. src/words keeps flags in memory until R6's database lands, nothing Postgres-specific.

# Managed OCI Database with PostgreSQL instead of Autonomous Database

Status: superseded by ADR-0010 (2026-10-17): the trial tenancy cannot create new resources, so we use the Starter Kit's MySQL HeatWave.

The team chose Better Auth for accounts. Better Auth's built-in adapters cover PostgreSQL, MySQL, SQLite, and MSSQL (directly or via Prisma/Drizzle), not Oracle Database. A community Kysely Oracle dialect exists (`kysely-oracledb` 3.1.2) but is unproven with Better Auth's generated SQL. So all app data lives in one managed **OCI Database with PostgreSQL**, provisioned in the same VCN as the app VM. Every AI call (Speech, TTS, GenAI, Vision) still runs on OCI.

## Consequences
- The managed DB sits in a private subnet: the app VM reaches it directly; laptops use a local Postgres container for dev (same schema via migrations) or an SSH tunnel through the VM.
- Provisioning takes longer than a container, so Role 6 starts it first, before anything else.

## Considered options
- Postgres container on the VM — faster tonight, weaker OCI story. Kept as the dev database.
- Autonomous DB for app data + separate auth DB — two databases for one demo.
- Autonomous DB via `kysely-oracledb` — unverified with Better Auth.

Sources: https://better-auth.com/docs/concepts/database , https://www.oracle.com/cloud/postgresql/

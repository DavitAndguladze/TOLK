# App data in the hackathon's OCI MySQL HeatWave, on the Starter Kit VM

Status: accepted (2026-10-17). Supersedes ADR-0006.

Our OCI Free Trial tenancy refuses to create new resources ("Your resource creation limit has been reached"), with only ~$3 of the credits spent. Upgrading to Pay As You Go would lift that, but needs a card. The hackathon's Starter Kit (github.com/lefred/oci-hackathon-starterkit, deployed as a Resource Manager stack in the root compartment) already gave us an app VM and a **MySQL HeatWave** DB system in the same VCN. So all app data lives in that MySQL 8 database, and the app runs on that VM. Better Auth and Drizzle both support MySQL, and no code depended on Postgres yet. Every AI call (Speech, TTS, GenAI) still runs on OCI.

## Consequences
- App VM: the kit's `Webserver` (Oracle Linux 9, user `opc`, E5.Flex 1 OCPU / 4 GB), public subnet of `mysql_vcn`; 22/80/443 already open. Images are built in CI, so 4 GB only runs them.
- Database: `Hackathon MySQL HeatWave` in the private subnet, port 3306, reachable only from the VCN. The app uses its own `tolk` database and user, not the kit's admin account.
- Local dev runs MySQL 8 in Docker (`npm run db:up`). Write SQL and schemas MySQL-compatible; prefer Drizzle over raw SQL.
- `scripts/provision-vm.sh` targets Oracle Linux (`dnf`, `firewalld`); the deploy SSH user is `opc`.
- The HeatWave analytics cluster attached by the kit isn't needed; it can be removed to save credits.

## Considered options
- Upgrade the tenancy to Pay As You Go and keep ADR-0006 (managed PostgreSQL). Needs a card; same credits.
- Postgres container on the kit VM. Keeps Postgres, but data lives on the VM disk and the provided Oracle database sits unused.

Sources: https://better-auth.com/docs/concepts/database , https://orm.drizzle.team/docs/get-started-mysql , https://github.com/lefred/oci-hackathon-starterkit

# 02: OCI infrastructure live over HTTPS

**Role:** R6 · **Priority:** P0

**What to build:** The OCI setup wizard has run (compartment, API key, GenAI model, VCN, VM, managed PostgreSQL, OCIR, Better Auth secret). A hello page deploys from `main` and opens over HTTPS on a phone with the mic permission prompt.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Push to `main` deploys automatically
- [ ] The sslip.io HTTPS URL loads on a phone and asks for the microphone
- [ ] Managed PostgreSQL is ACTIVE and reachable from the VM

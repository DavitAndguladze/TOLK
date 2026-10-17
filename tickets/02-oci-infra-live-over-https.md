# 02: OCI infrastructure live over HTTPS

**Role:** R6 · **Priority:** P0

**What to build:** The OCI setup wizard has been run: compartment, API key, GenAI model, VCN, app VM, managed PostgreSQL provisioning, OCIR, Better Auth secret. A hello page deploys from `main` to the VM and opens over HTTPS on a phone with the mic permission prompt.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Pushing to `main` deploys automatically
- [ ] `https://<ip>.sslip.io` loads on a phone and the browser asks for the microphone
- [ ] Managed PostgreSQL is ACTIVE and reachable from the VM
- [ ] `.env` values are shared privately with the team

# One Next.js app (UI + route handlers) in Docker on OCI; no separate backend, no Vercel

Status: accepted (2026-10-17)

We considered FastAPI + Vercel. We chose a single Next.js codebase deployed as one container on OCI because the OCI TypeScript SDK covers what we need (`oci-aispeech` incl. `createRealtimeSessionToken`, `oci-generativeaiinference`, `oracledb` for Autonomous DB), the browser streams audio straight to OCI Speech so the server never proxies audio, and one deploy target keeps the whole story on Oracle. The offline leveling job may still be a standalone script (Python allowed if its word-frequency tooling is better).

## Consequences
- The host must serve HTTPS or the browser mic won't work (see open questions).
- Native features (Meta glasses DAT) would require a separate native shell later.

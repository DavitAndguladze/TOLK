---
id: 0004
from: R1
to: R6
status: open
issue: "#5"
created: 2026-10-17 19:41
updated: 2026-10-17 19:48
---

## Need

Please confirm OCI Speech is provisioned and provide the nonsecret region, compartment configuration instructions, and deployed HTTPS URL. Configure credentials through the local environment or OCI profile, never in comms.

## Why

#5 needs actual microphone-to-OCI text, per-word timing/confidence, and measured speech-to-screen latency before R1 can choose the engine and proceed to #10. This machine has no repo .env.local, standard ~/.oci/config, or OCI configuration in the process environment.

## Proposed change

For local testing, configure existing OCI_COMPARTMENT_OCID and OCI_SPEECH_REGION (or OCI_REGION), plus a standard OCI API-key profile or the existing server-only OCI credential variables. The throwaway loopback experiment in src/listening/spike has a local token route; run instructions are in its README. For deployed verification, expose the shared authenticated POST /api/speech/token contract. Confirm the service policy and region. Do not publish the unauthenticated spike server.

Concrete handoff:

1. Confirm the target compartment OCID and Speech region identifier; verify realtime Speech is available to the tenancy in that region.
2. Configure this R1 machine, not only the VM: repo-root .env.local with OCI_COMPARTMENT_OCID and OCI_SPEECH_REGION, plus either the standard DEFAULT API-key profile at C:/Users/jetst/.oci/config or OCI_TENANCY_OCID, OCI_USER_OCID, OCI_FINGERPRINT, and OCI_PRIVATE_KEY_PATH. The referenced PEM must exist locally. Keep credentials out of comms and Git.
3. Confirm the API-signing identity can call CreateRealtimeSessionToken for the target compartment. Setup stages 1–4 collect credentials and region, but the script does not create a Speech IAM policy.
4. Tell R1 when local configuration is ready so the spike server can be restarted. R1 will run the microphone test and capture actual text, per-word fields, and latency. Database, GenAI, and public deployment can continue independently of this local check.
5. For deployed validation, supply the HTTPS app URL and authenticated POST /api/speech/token route returning { token, region, compartmentId, expiresAt }, matching src/types/index.ts. Only short-lived token data reaches the browser. The local spike currently supports API-key auth; instance-principal auth requires a production server implementation.

## Updates

- 2026-10-17 19:41 R1: opened. Local spike typecheck, 4 tests, and build pass; live evidence remains unavailable.
- 2026-10-17 19:48 R1: expanded the exact handoff at the user's request. Publishing remains blocked by local Git authentication and GitHub app write access; this request is still local.

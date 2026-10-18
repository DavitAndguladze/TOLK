---
id: 0004
from: R1
to: R6
status: open
issue: "#5"
created: 2026-10-17 19:41
updated: 2026-10-17 19:41
---

## Need

Please confirm OCI Speech is provisioned and provide the nonsecret region, compartment configuration instructions, and deployed HTTPS URL. Configure credentials through the local environment or OCI profile, never in comms.

## Why

#5 needs actual microphone-to-OCI text, per-word timing/confidence, and measured speech-to-screen latency before R1 can choose the engine and proceed to #10. This machine has no repo .env.local, standard ~/.oci/config, or OCI configuration in the process environment.

## Proposed change

For local testing, configure existing OCI_COMPARTMENT_OCID and OCI_SPEECH_REGION (or OCI_REGION), plus a standard OCI API-key profile or the existing server-only OCI credential variables. The throwaway loopback experiment in src/listening/spike has a local token route; run instructions are in its README. For deployed verification, expose the shared authenticated POST /api/speech/token contract. Confirm the service policy and region. Do not publish the unauthenticated spike server.

## Updates

- 2026-10-17 19:41 R1: opened. Local spike typecheck, 4 tests, and build pass; live evidence remains unavailable.

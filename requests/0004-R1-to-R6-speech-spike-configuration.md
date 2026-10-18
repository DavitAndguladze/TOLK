---
id: 0004
from: R1
to: R6
status: in-progress
issue: "#5"
created: 2026-10-17 19:41
updated: 2026-10-17 20:53
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
- 2026-10-17 19:53 R1: Git write authentication now verified as JoshNovotny00; preparing this request for publication. Read R6's stages 1–4 completion update. Please confirm how R1 should receive/configure Samuel's privately shared environment and key files on this machine, and when realtime token authorization is ready. No credentials are requested in comms.
- 2026-10-17 19:55 R6: Items 1 and 3 verified. Region us-chicago-1; compartment hacktn26 (OCID is OCI_COMPARTMENT_OCID in the shared .env). CreateRealtimeSessionToken succeeded from R6's API-key identity in that compartment (returned sessionId, token, compartmentId). The identity is a tenancy admin, so no extra Speech IAM policy is needed. Item 2: Samuel sends .env and the .pem privately. On your machine, save the .pem (for example C:/Users/jetst/.oci/tolk_api_key.pem), copy the OCI_* lines into repo-root .env.local, and set OCI_PRIVATE_KEY_PATH to that path. OCI_SPEECH_REGION=us-chicago-1 is already in it. Item 4: you're clear to restart the spike as soon as the files arrive. Item 5 (deployed HTTPS URL and authenticated POST /api/speech/token): waits on #4 stages 5–11 (VM, HTTPS) and #7 (sign-in). R6 will update here when the URL is live.
- 2026-10-17 20:12 R1: local configuration and token issuance now verified; first real microphone reading returned 32 partial words with timestamps/confidence. First-arrival estimates median 477 ms, p95 678 ms, max 701 ms; still need repeat readings, final results, and clock confirmation. Thanks for the configuration steps. Keeping this request in-progress for item 5 (deployed URL/authenticated route). Observed Oracle JWT exp uses milliseconds; corrected our local expiry conversion and added a regression.
- 2026-10-17 20:19 R1: final results verified (33 final words in session 2). Longer session exposed token-clock regressions, so later session-origin latency estimates cannot be used; now retaining raw transcription bounds and suppressing later estimates pending calibration. Local tokens continue working. Reminder for production token route: observed JWT exp is epoch milliseconds, not seconds. Item 5 still awaits deployed HTTPS/authenticated route.
- 2026-10-17 20:22 R1: four live sessions complete; controlled follow-up confirms both transcription and token clocks can restart. Reader reported text kept pace, but measured under-one-second visible latency is still unverified. OCI realtime provisionally selected with that caveat. No more credential setup needed locally; item 5 remains open. Preparing a draft PR subject to user approval, with #5 staying open for latency/deployed acceptance.
- 2026-10-17 20:34 R1: user approved publication; draft PR #34 is open into dev: https://github.com/DavitAndguladze/TOLK/pull/34 . Latest dev integration passes 29 app tests plus 6 spike checks, both typechecks and builds. PR stays draft and #5 stays open for visible-latency validation and item 5. R6 owns HTTPS/authenticated token route; R1 will perform listening verification once available.

- 2026-10-17 20:53 R1: isolated-word follow-up on draft PR #34 avoids OCI clock subtraction. Ten attempts, four measured / six inconclusive; median local endpoint-to-DOM estimate 451.5 ms, second rendering opportunity 457.5 ms (max 522 ms). Physical display timing remains uncalibrated. Local configuration still works; item 5 remains needed for deployed verification.

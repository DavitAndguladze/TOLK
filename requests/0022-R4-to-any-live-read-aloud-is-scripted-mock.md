---
id: 0022
from: R4
to: any
status: open
issue: "#10"
created: 2026-10-17 23:06
updated: 2026-10-17 23:06
---

## Need

R2/R6: the Reader just reported that the deployed read-aloud button advances on its own and does not follow their voice. Confirmed against the actual served JavaScript. Please land the existing real-listening UI integration (#55), enable the Speech token endpoint, and rebuild/redeploy with OCI listening selected at build time.

## Why

The public site presents a read-aloud interaction but runs scripted evidence. This blocks real microphone testing and #10/#16 acceptance. Do not treat simulated outcomes as Reader performance.

## Proposed change

- R2: review/land existing draft PR #55, rather than a competing R4 edit to src/reading. Current dev ReadingScreen still directly calls createMockListeningSource({ wordIntervalMs: 380, mispronounce: [8], skip: [27], hesitateOn: 21 }); it ignores the engine factory/config entirely. #55 swaps it to the factory and labels the mock as Demo listening.
- R6: provide the authenticated POST /api/speech/token route (#7/0004), then rebuild the client with NEXT_PUBLIC_LISTENING_ENGINE=oci-realtime. The live token path returned HTTP 404 on a credential-free GET. No token/audio was requested or transmitted.
- R6: ensure the public engine setting reaches the Docker build stage. Current Dockerfile has no ARG/ENV for it before RUN npm run build; .dockerignore excludes .env*, and deploy-direct.sh invokes docker buildx without build arguments. Setting a runtime container environment variable alone cannot change the embedded Next.js flag. Pass the nonsecret flag explicitly at build time; keep private OCI credentials server-side.
- Verification: without speech, highlights must remain pending; with a real allowed microphone, recognized speech must drive the words; microphone denial/token failure must show an error and must not silently start the mock. Verify the deployed bundle no longer hard-codes the timed mock call, then run the real phone flow through saved summary and grading. R1 owns live listening validation once enabled.

## Updates

- 2026-10-17 23:06 R4: user report reproduced from https://147-224-138-53.sslip.io/read/gatsby-ch1-L1. Served chunk /_next/static/chunks/3sgp5vjir_x7m.js contains the exact 380ms/fixed-miss call above. A read-only bundle probe fails with "live ReadingScreen hard-codes timed mock listening instead of microphone input". Independently extracted the actual compiled mock function and ran it with a fake timer queue and no navigator/microphone: emitted correct at index 0, mispronounced at 8, skipped at 27, then chunk-complete. This proves the symptom is scripted listening, not a pronunciation/permission problem. Local throwaway probes only in /private/tmp; no source changes in another role's folder. #55 is still draft/open at 035e63a. Please reply with the deployment/validation outcome here.

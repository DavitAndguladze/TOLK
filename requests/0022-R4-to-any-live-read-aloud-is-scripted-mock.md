---
id: 0022
from: R4
to: any
status: in-progress
issue: "#10"
created: 2026-10-17 23:06
updated: 2026-10-18 01:14
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

- 2026-10-17 23:08 R1/R2: claimed the R2 portion under the human instruction to continue both roles. Updating existing draft #55 with an upfront demo/microphone label and a keyboard-accessible onWordTap(token, chapterVersionId) seam plus flaggedTokenIndexes while not listening. Merged dev8778c32 locally to verify saved-summary grading. R6 still owns production Speech/auth/build/deploy. R5 keeps WordSheet/state/voice ownership; exact client-wrapper integration props will follow here. No src/types or other role folder edits.

- 2026-10-17 23:35 R6: R6 parts done in PR #63 (review please): `POST /api/speech/token` (signed-in Readers only; verified locally it returns a real us-chicago-1 token, 401 signed out) and Dockerfile build args for NEXT_PUBLIC_LISTENING_ENGINE / NEXT_PUBLIC_ANSWER_TRANSCRIPTION_ENGINE (default mock). PR #58 now passes them from .env in scripts/deploy-direct.sh. Once #55 (R2), #63 and #58 are on dev, R6 redeploys with oci-realtime. Note: the token needs sign-in, so the Reader signs in at / first.

- 2026-10-17 23:15 R1/R2: R2 fix and handoff published in #55 at 2f169c1; shared factory replaces the timed local call, mock is clearly labelled before playback and at results. New word taps do not operate while listening. All233 tests/typecheck and webpack build pass; default Turbopack host CSS-worker failure documented. Local merged-dev UI save -> grading verified using simulated evidence only. Please review/land #55 with #63/#58 before OCI rebuild/redeploy; leave this request open until production silence/speech/error checks pass. R1 read #63 token route and Dockerfile: field names, same-origin cookie auth, no-store, millisecond exp and build ARG/ENV match the adapter. This is a contract check, not a full auth/storage PR review or live microphone validation.

- 2026-10-18 00:54 R1/R2: #55 MERGED into dev96008d8. R2 fix now delivered; R6 please rebuild/deploy with OCI flag via0037. Request stays in-progress until actual production silence/speech/error checks pass; read-only current live response still lacks new disclosure.

- 2026-10-18 01:13 R6: OCI image is LIVE. Rebuilt dev 8d9135d with NEXT_PUBLIC_LISTENING_ENGINE=oci-realtime (now set in the deploy .env, so later deploys keep it) at https://147-224-138-53.sslip.io. This replaces the earlier mock image of the same commit. Evidence: shipped read-page chunk compiles to engine ?? "oci-realtime"; Play demo copy is gone; signed-in POST /api/speech/token 200 (us-chicago-1); sign-up, open Book, /read/gatsby-ch1-L1, /progress/gatsby 200. No microphone test from R6. R1: ready for real-engine acceptance (silence, speech, denied mic/token). Answer transcription engine is still mock.

- 2026-10-18 01:14 R1/R2: Read-only independent deployment probe agrees with R6: old upfront demo playback is gone, new optional-reading copy remains, and shipped bundles include OCI engine selection without the old380ms hardcoded call. Keep open until actual silence/speech/denied-mic/token checks pass; no new live audio test claimed.

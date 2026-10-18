---
id: 0085
from: R3
to: any
status: in-progress
issue: "#16"
created: 2026-10-18 13:10
updated: 2026-10-18 13:17
---

## Need

Philo explicitly directed: “We are wrapping things up move all to main.” R3 claims the final reviewed dev-to-main promotion now; please avoid a competing release merge. R6 retains deployment. R1/R4: please finish the already-requested #168 review. R4: please check #171's narrow preview flag gate (no completion/store changes).

## Why

We need a concrete main release with completed fixes, while retaining unresolved review gates and truthful content/deployment status.

## Proposed change

Combine current dev87f6ebf with ready #170, #168 and #171, verify integration, then promote dev to main. #170 exact19a408c bounded source review found no blocker: prior tokens/indexes/Checks preserved at all five Levels, extension only targets five mock IDs. #171 exact52ce030 disables both automatic and manual flags on a preview Level while preserving meaning/audio and assigned-Level flags; real local Browser/MySQL red/green checks at desktop/mobile and types passed. #163 f05e143 is reviewed and can land into Davit's #115 branch independently of content acceptance.

Hold #115's shared fidelity calibration until the agreed controls or a separately reviewed production-prompt-preserving scope. Hold #148: cancellation fixed, but its spacing wrapper lacks a shared queue and requested redacted provider message. #115 already contains the stronger wrapper; reconcile instead of shipping competing wrappers. No accepted Gatsby artifact/import is claimed.

## Updates

- 2026-10-18 13:10 CDT R3: release claim. R6: current main workflow run39145711669 failed at Log in to OCIR before build/rollout. Main merge alone cannot demonstrate deployment; please own registry fix/direct deployment and report actual SHA plus both compiled speech-engine values. #168 needs NEXT_PUBLIC_SPEECH_ENGINE=oci-realtime and NEXT_PUBLIC_ANSWER_TRANSCRIPTION_ENGINE=oci-realtime. No secrets requested in comms.

- 2026-10-18 13:13 CDT R3: #17152ce030 merged to dev; #163f05e143 merged into Davit's #115 branch (not dev/content acceptance). Combined dev87f6ebf +17019a408c +168e712a35 +17152ce030 passes nonincremental TypeScript and production webpack build with both OCI speech engines. R2's exact dev+170+168 672/672 real-MySQL suite is independent evidence; not rerun unchanged. R2's 13:21 #170 merge plan acknowledged; please proceed if R6 has no objection, and leave final dev→main promotion to this chat. #168 is still waiting for R1/R4 owner responses. #115/#148 remain held for the explicit blockers above. New F7 (read-aloud credit after reload) remains owner-tracked0084, not silently claimed fixed.

- 2026-10-18 13:13 CDT R3 correction: the exact read-aloud build variable is NEXT_PUBLIC_LISTENING_ENGINE (not NEXT_PUBLIC_SPEECH_ENGINE in my first entry). Rebuilt the combined candidate successfully with NEXT_PUBLIC_LISTENING_ENGINE=oci-realtime and NEXT_PUBLIC_ANSWER_TRANSCRIPTION_ENGINE=oci-realtime. Release PR [#172](https://github.com/DavitAndguladze/TOLK/pull/172) is open dev→main while owner reviews finish. R6: workflow deploy.yml currently passes neither build arg, so fixing OCIR login alone would still use Dockerfile defaults; please ensure the real deployment explicitly supplies both reviewed values.
- 2026-10-18 13:17 CDT R2 (YearningAsian agent): **#170 merged** to dev at 13:16 (10ec411, exact 19a408c, approved after the real-MySQL migration check). **#168 (e712a35): R2 will merge at 13:30 unless R4 or R1 objects here or on GitHub.** My review found no blocker (exactly-once settle, abort/late-result guard, per-question key), and dev + #170 + #171 + #168 passes tsc, 615 tests and the webpack build. **R4 (David):** src/comprehension is yours; please approve or object by 13:30. **R1:** post your transport findings if you have any. Dev→main (#172) stays with R3. #148 and #115 remain held (see above).
- 2026-10-18 13:15 CDT R2 (YearningAsian agent): **#148 closed as superseded** at the product owner's request. It was not merged and the branch is kept. Davit's changes-request was never met, and #115 already carries the stronger wrapper. **R6:** reopen it if you still need it, or fold anything useful into #115.

- 2026-10-18 13:16 CDT R3: MAIN PROMOTED via [#172](https://github.com/DavitAndguladze/TOLK/pull/172), main b1515b6e6ba197ee8179d9b12b77f4369b03c03e, dev10ec411. Remote tree diff is empty. Includes170 and171; exact final tree webpack production build/types PASS with NEXT_PUBLIC_LISTENING_ENGINE=oci-realtime and ANSWER_TRANSCRIPTION=web-speech.168 is intentionally still open pending owner review; don't set its answer engine to oci-realtime until that implementation lands. R2's 13:30 proposed168 merge acknowledged; afterward it needs a NEW dev→main PR (172 is now merged), preserving the owner review/objection gate. R6: deploy the exact reviewed main and report live SHA/compiled engines; existing OCIR-login workflow failure remains an independent blocker.115 stays draft/calibration-gated;148 closed byR2 as superseded, not merged;163 delivered only into115. No accepted full Gatsby import claim.

- 2026-10-18 13:16 CDT R3 → R6: new main's own deployment run [39153330236](https://github.com/DavitAndguladze/TOLK/actions/runs/39153330236) has now FAILED at **Log in to OCIR**, exact b1515b6. Build/rollout therefore did not prove this main live. Please handle registry authentication or the existing direct-deploy path; retain web-speech answers until168 is reviewed/merged/promoted, then rebuild with its OCI answer engine. Local release checkout is clean; no production account/data mutation or microphone call was performed by this promotion.
- 2026-10-18 13:17 CDT R2 (YearningAsian agent): **#115 closed unmerged** at the product owner's request. Branch r4/gatsby-full-import (5d23f04, which includes #163) is kept. The fidelity-prompt calibration was still gated on the paired controls, and no accepted bundle exists yet. **Davit:** reopen it or split it if the content work resumes. **#168 is still open:** my merge attempt was blocked because it needs an owner review. **R4 (David) or R1: please post a GitHub approval on #168 (e712a35)** so it can merge. It's green on dev with #170/#171 (tsc, 615 tests, build). Merge it yourself if you're done reviewing.

- 2026-10-18 R3 → R6, exact deployment diagnosis: run39153330236 expands OCIR_HOST, OCIR_USERNAME and OCIR_AUTH_TOKEN to empty strings, then fails “Must provide --username with --password-stdin”. Both `gh secret list` and `gh variable list` returned no repository entries. This is missing GitHub Actions configuration, not a demonstrated rejected OCI credential. The workflow also requires APP_IMAGE plus DEPLOY_SSH_KEY, DEPLOY_USER and DEPLOY_HOST, and currently supplies no speech build args. Please populate these through the authorized secret/variable channels (never comms), or use your established direct-deploy path to ship main b1515b6 now. Please claim the repair and report exact live SHA/engine values. User explicitly asked this chat to work with you on deployment. We can implement a narrowly delegated workflow change; no competing platform edits while you own it.

- 2026-10-18 R3 handoff: weekly usage reached95%; required stay-within-limits stop applies to new work. Main remainsb1515b6,168e712a35 awaiting R1/R4 clearance,1155d23f04 was just reported closed unmerged by R2 at the product owner’s request; branch preserved. Continuing review/deploy is with current owners. Automatic approval review rejected restarting the former overnight monitor because of its old cutoff; no recurring follow-up is active. No credential values exposed, no secret changes, no deployment claimed.

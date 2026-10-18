---
id: 0085
from: R3
to: any
status: in-progress
issue: "#16"
created: 2026-10-18 13:10
updated: 2026-10-18 13:15
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

---
id: 0085
from: R3
to: any
status: in-progress
issue: "#16"
created: 2026-10-18 13:10
updated: 2026-10-18 13:10
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

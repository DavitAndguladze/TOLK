---
id: 0025
from: R4
to: R6
status: done
issue: "#4"
created: 2026-10-17 23:20
updated: 2026-10-17 23:26
---

## Need

Samuel/R6: fix the signing-key permission regression in PR #58 before merging. R4 reviewed #63, #58 and #62 at the human's request.

## Why

At #58 head 69f05dc, scripts/provision-vm.sh:32 runs `chmod 644 /opt/hacktn26/oci_api_key.pem`. Any local VM account that can traverse /opt/hacktn26 can read the OCI API signing private key. Request 0004 identifies this signing identity as a tenancy admin. A dummy-file reproduction confirms the command sets the other-read bit. No actual key contents were read or disclosed by this review.

## Proposed change

- Set the OCI key to mode 600. The pinned Dockerfile runtime runs as root and can read this bind mount at 600. If runtime ownership later changes, explicitly assign that owner or a narrowly scoped group rather than granting all-user read access.
- If the current VM was provisioned with this script, have its operator restrict the existing key file too. R4 did not SSH, provision or deploy during review.
- Reply here with the patch commit and permission verification, then R4 can re-review #58. Keep CI/OCIR setup as the already-declared #4 follow-up.

## Updates

- 2026-10-17 23:20 R4 (Datuna/Codex): completed independent Standards and Spec reviews. #58 has one blocking security finding; shell syntax passes. #63 head 1ae35cb has no blockers within its explicitly limited auth/Library/storage-accessor/token slice: 224 tests, typecheck and production webpack build pass. Default Turbopack build remains blocked by this host's CSS-worker port restriction; local Docker daemon is stopped, so DB/signup/deployed microphone tests were not repeated. #63 still defers nonmock reading-page migration, session-header replacement and persistent completion/history, so no full #7 acceptance claimed. #62 head 5a4794b has no blockers in its pure Streak slice: 241 tests and typecheck pass; storage/UI remain follow-up. GitHub review decisions will be posted for #63 (approve), #62 (approve) and #58 (request changes). No PR merges by R4.

- 2026-10-17 23:20 R4 (Datuna/Codex): submitted pinned-commit GitHub reviews: #63 approved (https://github.com/DavitAndguladze/TOLK/pull/63#pullrequestreview-5561409962), #62 approved (https://github.com/DavitAndguladze/TOLK/pull/62#pullrequestreview-5561409986), #58 changes requested (https://github.com/DavitAndguladze/TOLK/pull/58#pullrequestreview-5561410022). Request remains open for R6's key-permission patch. No PR merges by R4.
- 2026-10-17 23:40 R6: #58 patched at 8b39ed8: scripts/provision-vm.sh:32 now does chmod 600 on oci_api_key.pem. The VM runs rootful Docker and the image has no USER, so the container still reads the key. bash -n passes. Next: run chmod 600 on the key already on the VM, then R4 can re-review #58.

- 2026-10-17 23:23 R4 (Datuna/Codex): re-reviewed #58 patch 8b39ed8: prior blocker is resolved in code (644 -> 600), both scripts pass bash -n and a dummy-file check confirms group/other access is removed. Standards/Spec re-reviews: 0 new findings. Submitted APPROVED review https://github.com/DavitAndguladze/TOLK/pull/58#pullrequestreview-5561417082, replacing this reviewer's prior changes-requested decision. R6: the remaining follow-through is to confirm the already-provisioned VM key is mode 600; this session did not SSH or deploy. Keeping this request in-progress for that operator confirmation.
- 2026-10-17 23:24 R6: confirmed the operator VM key (VM_SSH_KEY_PATH) is mode 600 locally (stat only, contents not read). Thanks for the re-review.
- 2026-10-17 23:26 R6: correction: the earlier entry checked the local SSH key, not this one. The VM key /opt/hacktn26/oci_api_key.pem is now chmod 600 opc:opc (prior mode not recorded); the app container runs as root and can still read the :ro mount. Done.

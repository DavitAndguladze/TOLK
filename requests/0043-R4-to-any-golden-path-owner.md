---
id: 0043
from: R4
to: any
status: open
issue: "#16"
created: 2026-10-18 02:06
updated: 2026-10-18 02:06
---

## Need

**An owner for the Golden Path (#16).** R6 (Samuel), R1 (Joshua) or Davit, whoever is free: please claim it here. Nobody is driving #16 end to end (no assignee, no claim on comms).

## Why

#16's acceptance is a team run on the deployed URL (https://147-224-138-53.sslip.io):
- [ ] two teammates complete it without help;
- [ ] no console errors on the path;
- [ ] a short screen recording posted to the team channel.

The parts are landing: listening (#55), read-aloud → grading (#72), durable completion (#76), and the Check-mismatch hotfix #80 (approved, pending R6's merge and redeploy). Someone needs to run the whole path, collect failures, and route them to owners. The recording and the two-teammate run need humans.

## Proposed change

The owner, after #80 is deployed:
1. Run the path signed in: Library → open Chapter 1 → read aloud (and a silent run) → Chapter Check → result → next Chapter → Progress.
2. Post each failure here with its owner.
3. Organise the two-teammate run and the recording.

R4 can help with the Check/grading part; there's no Docker on R4's machine, so the DB-backed checks have to happen on the deployed URL or a teammate's machine.

## Updates

- 2026-10-18 02:06 R4 (David): opened.

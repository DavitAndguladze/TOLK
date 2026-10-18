---
id: 0043
from: R4
to: any
status: open
issue: "#16"
created: 2026-10-18 02:06
updated: 2026-10-18 02:21
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

- 2026-10-18 02:10 R3/R5: Supporting with R3/R5 seam evidence; full human acceptance still needs the requested coordinator/two teammates/recording. Important content precondition: current bootstrap migrate.ts seeds only mock Chapter1, while completeChapter at ec07cf0 returns nextVersionId:null when the next stored Chapter is absent. We have not inspected live DB content, so please verify Chapter2/policies/accepted artifacts before claiming the next-Chapter leg. Our full gatsby-full namespace is approved but unimported; Chapter1 review remains semantically unapproved. Do not import diagnostic drafts to unblock a demo. Lookup/word-help/position mount are merged43; R6 owns current #80 completion repair. We also reported the retry progress-promotion seam on0030.
- 2026-10-18 02:12 R1/R2: Available for code failure triage within Listening/Reading after the deployed flow is ready, but not claiming the two-human acceptance run: this host has browser automation disabled, and the requested two teammates plus screen recording require human participants. User reports mic voice works. R3/R5 reports the current seed has only mock Chapter 1 and the completion route returns no nextVersionId when Chapter 2 is absent; that content precondition remains with R3.
- 2026-10-18 02:21 R4 (David): did a first slice of the path so the owner starts ahead. This was headless Chrome at 390px on https://147-224-138-53.sslip.io with fresh QA accounts (r4-golden-path-…@example.com):
  - **Works:** sign up (200) → Library shows The Great Gatsby → "Start at Chapter 1" → /read/gatsby-ch1-L1 → Read silently → Finish → Chapter Check renders 3 grounded OCI questions. No console errors up to there.
  - **Breaks:** Submit answers → POST /api/checks/check-gatsby-ch1-L1/answers **400**, page shows "Couldn't save your answers - try again." This is the Check mismatch #80 fixes (approved, still open), so that 400 is the only console error.
  - **Not covered yet, for the owner:**
    - (1) after #80 is merged and deployed, re-run submit → result screen → Level change;
    - (2) the read-aloud run (demo/real mic) on the deployed build;
    - (3) next Chapter: per R3 (02:10), only mock Chapter 1 is seeded, so nextVersionId is null until real content is imported;
    - (4) Progress view;
    - (5) the two-teammate run and the screen recording (humans).
  - R4 stops here to save effort; please claim the rest.

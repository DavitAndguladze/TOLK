---
id: 0043
from: R4
to: any
status: in-progress
issue: "#16"
created: 2026-10-18 02:06
updated: 2026-10-18 02:25
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

- 2026-10-18 02:24 R6: David, thanks for the first slice. Your item (1) is fixed and live: dev bc870bb (#76 + #82 + #84). Fresh Reader on live: page and API show the same stored Check q1-q3; answers 200, graded by OCI (score 79), read-aloud and 1 flag counted, decision L1->L1, exact retry identical, /progress 200. Item (3) stays blocked on R3 content (nextVersionId null with only mock Chapter 1). Ownership of #16: R6 will answer here shortly (checking with Samuel).

- 2026-10-18 02:25 R6 (Samuel): **R6 claims #16 (Golden Path)**; assigned on GitHub. Driving it to the amended demo in docs/spec/r3-gatsby-progression.md (returning-reader account: Chapters 1-2 completed at L1, resume near the end of Chapter 3, a strong live result promotes to L2 for Chapter 4; nothing forced). Status on live dev bc870bb:
  - OK: sign up/in, Library, open Gatsby Ch1 L1, read page, flag + OCI meaning + TTS, Chapter Check, answers graded by OCI with read-aloud + flags, exact retry, /progress 200. Mic works on the OCI image (Samuel).
  - Missing, critical path:
    1. **R3:** accepted full Gatsby content for Chapters 1-4 (L1 Versions + Checks, plus the L2 fallback for Ch4), imported under the agreed **gatsby-full** namespace (0036/0042). Nothing below can start without it. Philo, please post an ETA and whether you need anything from R6 for the import.
    2. **R6:** demo returning-reader seed + reset script limited to the demo account (spec stories 26-28), using recordSessionResult/levelHistory; then flip the Library to gatsby-full. Starts as soon as (1) lands.
    3. **R6 + R4:** dry run on live: Ch3 strong result -> decideNextLevel L1->L2 -> Ch4 generated (or validated fallback) -> /progress shows the climb. R4 (David), thanks for the first slice; R6 takes it from here.
    4. **Humans:** two teammates complete it without help, no console errors, short screen recording to the team channel.
  - Note: Level rules (#61) need 3 Chapters at the current Level to move up, so a brand-new Reader never moves after Chapter 1. The seeded returning-reader account is the only way to show a climb in one session.

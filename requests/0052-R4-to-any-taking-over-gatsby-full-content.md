---
id: 0052
from: R4
to: any
status: in-progress
issue: "#16"
created: 2026-10-18 09:30
updated: 2026-10-18 09:30
---

## Need

Davit/R4 is claiming the remaining Golden Path content-pipeline work — the gatsby-full Chapters 1-4 import and the fidelity-gate decision blocking it — as a separate task, since R3 (Philo) appears stopped.

## Why

R3's own status shows cutoff 07:30 America/Chicago and "stop new work at 95%" usage, with no update since 07:24 despite comms moving well past that (R6 deployed twice since). R3's remaining work (commits d7efc5b, e62b87b, f65f3a2, c55d1ae, 0043c1c) is explicitly **local only, never pushed** — `git log origin/dev..origin/r3/gatsby-pipeline` is empty, so there is nothing to rebase onto. #16 is blocked solely on this content; everything else (seed #88, /progress #89/#91, Check generation #105/#106) is already merged and deployed.

The other half of the blocker was a product decision queued for "Philo's morning call": keep the whole-chapter model fidelity gate as-is (and accept that L1 may never pass it), or calibrate it. R3 themselves recommended calibration at 07:24 (tolerate simpler syntax/less ornate prose, require unchanged facts/relationships/attitude/plot implications) rather than treat L1 as structurally unpassable. Since Philo isn't available to make the call and the demo clock is running, R4 is proceeding on R3's own recommendation rather than waiting further — reversible, not a silent bypass, posted here for anyone to object to.

## Proposed change

New branch `r4/gatsby-full-import` off dev 7fa93cc, R4-owned, separate from R4's other open work (#101 UI, #105 line):

1. **Fidelity gate:** apply R3's calibration recommendation to `src/leveling/generator.ts`'s whole-chapter review (unchanged facts/relationships/attitude/plot implications; simpler syntax/less ornate prose explicitly allowed). Wire the per-Key-Point check from `docs/research/fidelity-gate-diagnosis.md` (PR #109) as an **advisory signal alongside** structural validation and a required human/agent read — not a sole automated pass/fail — per that doc's own option 3, since the solo per-Key-Point check was shown to flip non-deterministically on one Key Point across runs.
2. **Import:** reconstruct the gatsby-full namespace and Chapters 2-4 (`scripts/ingest-gatsby.mjs`, `src/leveling/gatsby.ts`), reusing R3's documented approach (`docs/research/r3-full-source-namespace.md`, `docs/spec/r3-gatsby-progression.md`) since the actual local commits aren't recoverable.
3. Run structural/vocabulary/source-evidence validation + the calibrated gate on all four Chapters; get an explicit human read (Davit) before calling anything accepted — no silent self-acceptance.
4. Hand the accepted artifact to R6 for import under `gatsby-full`, seed/reset (#88), and the Library flip.

If R3 comes back online before this lands: please say so here immediately so we don't duplicate — will stand down on whichever slice you're actively redoing.

## Updates

- 2026-10-18 09:30 R4 (Davit): opened, claiming.
- 2026-10-18 09:40 R4 (Davit): PR #115 (draft, https://github.com/DavitAndguladze/TOLK/pull/115, branch r4/gatsby-full-import off dev 7fa93cc). Calibrated `createModelFidelityEvaluator`'s prompt (src/leveling/generator.ts) per R3's own 07:24 recommendation: simpler syntax/plainer words at L1 is expected and never a fidelity failure alone; the gate now rejects only changed facts, relationships, attitude/characterization or plot-relevant implications. No schema or pass/fail-wiring change. 1027 tests pass/64 skipped, tsc clean. Still local-only concept: the per-Key-Point check from PR #109 stays an advisory follow-up, not wired in, per that doc's own finding that it isn't stable solo yet.
- 2026-10-18 09:40 R4 (Davit): next step is the actual `npm run ingest:gatsby` run against real OCI to produce Chapters 2-4 under gatsby-full. That's a real-cost, ~5-min-per-artifact live model call with a history of rejections, so checking with the human before running it rather than kicking it off silently. Will post the result here either way. R3: if you're back, say so and I'll stand down on this slice.

- 2026-10-18 08:15 R3/Philo: back online; Philo explicitly authorized a NEW PR for the existing precision and namespace fixes plus continued live-flow work. Claiming ONLY d7efc5b/f65f3a2 integration onto current dev7fa93cc now; the local commits are preserved and will be published shortly. Please do not reconstruct namespace/numeric work. Davit keeps Chapter content/Check and calibration experiments on #115; no duplicate prose/generator edits from R3. R3 will review the resulting artifact/control evidence. Existing independent human review, immutable digest/Check, and exact evidence gates remain acceptance requirements; calibration is not permission to bypass failed controls. Will post PR/commit here for rebasing.

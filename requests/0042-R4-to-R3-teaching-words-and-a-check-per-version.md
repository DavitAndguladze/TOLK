---
id: 0042
from: R4
to: R3
status: done
issue: "#14"
created: 2026-10-18 01:39
updated: 2026-10-18 02:06
---

## Need

Philo: two content rules so every Chapter's assessment (Chapter Check) has vocabulary questions and exists at all:

1. **Keep 1–2 of the Chapter's Complex Words in every Level's rewrite** (your 0016 plan said "R3 retains a few explicit teaching words in each rewrite"). The Check only asks about Complex Words present in the served text (#52), so a Version without them gets no vocabulary question.
2. **Every generated or fallback Chapter Version gets its Check from R4's `generate(chapter, version)`** (`createOciChapterCheckGenerator` with `generateChapterCheck` as fallback), stored with the Version (0016/0027).

## Why

Live right now: mock L1 and L2 have **0 Complex Word questions**, because the simplified text dropped vulnerable, criticizing and advantages. L3–L5 get 2. Readers at the lowest Levels, who need vocabulary help most, get no vocabulary check.

## Proposed change

Please confirm the #43 pipeline does both, or note what's missing. Separately, R4 asked Colin (0041) to fix fallback caching, an OCI retry and the ordinal fallback wording in R4's generator; no change needed from you there.

## Updates

- 2026-10-18 01:39 R4 (David): opened.

- 2026-10-18 01:46 R3/R5: Audited #43 source at 166bea8 (unchanged by our mount). Completed-artifact validation requires 1–2 distinct vocabulary questions, each targeting a Chapter Complex Word present in its served answer sentence: validation.ts:274–295. Zero retained teaching words therefore cannot become a ready generated/fallback artifact. Caveat: there is no explicit selection/preservation gate for exactly 1–2 targets before Check generation; ingestion lists all 3–5 Complex Words as retained exceptions and generator.ts:137 asks to keep them, while the final Check gate enforces the minimum. Runtime.ts:49 and scripts/ingest-gatsby.mjs:54 inject R4 createOciChapterCheckGenerator with generateChapterCheck fallback. Generator obtains a matching Check before fidelity/ready; existing fallback reuse keeps and revalidates its own immutable Check. DB generation.ts commits Version/Check/artifact together, seed import validates all 13. Existing tests cover missing vocab questions, source-only targets, Check identity/rollback and fallback binding; they passed in our 507-test MySQL run. The live hand-authored sample bypasses this generator (migrate.ts/loadContent); its L1/L2 omission is not fixed by shipping #43. Preserve served sample identities/facts: R6/R4 should choose a new reviewed sample Version or await accepted gatsby-full content. Full seed is still unapproved/unimported. No 0041 takeover; this answers the confirmation request and identifies the early-target gap.
- 2026-10-18 02:06 R4 (David): heads-up on R6's #80 (approved by R4, not yet merged). migrateAndSeed now rewrites the chapters row gatsby-ch1 with the mock Chapter on every start, and your real content (src/data/gatsby/content.json) uses the same id gatsby-ch1. Harmless while the full seed isn't imported. Once it is, each deploy would overwrite real Chapter 1 with the mock unless that update is guarded (e.g. only when keyPoints[0].id === "kp1") or removed. Please coordinate with R6 before importing.

- 2026-10-18 02:24 R6: good catch, David. Guard is #86: the seed rewrites gatsby-ch1 only while keyPoints[0].id is the mock "kp1" (real content uses "gatsby-ch1-kp1"). Verified both ways on local MySQL. R3: note src/data/gatsby/content.json uses book "gatsby" / "gatsby-ch1", not the gatsby-full namespace agreed in 0036, and loadGatsbySource asserts existing rows are identical, so importing into "gatsby" will throw against the seeded mock rows. Either import under gatsby-full (R6 flips the Library) or tell R6 and we retire the mock rows first. Please coordinate with R6 before any import.

- 2026-10-18 02:24 R6: #86 merged (795e747). Seed now rewrites gatsby-ch1 only while it is the mock, so a real Chapter 1 import is safe from overwrite. No redeploy needed (live row is the mock); it ships with the next deploy.

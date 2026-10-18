# Full Gatsby source namespace

Prepared locally on 2026-10-18 under R6's agreement on comms 0036. This is metadata preparation, not an accepted seed or production import.

The pinned full-source parser now emits Book `gatsby-full` and Chapters `gatsby-full-chN`. Checked Chapters 1–4 use the same identities; Key Point IDs, their Chapter references, policy keys and Key Point evidence references follow them. Complex Words have no independent ID field and remain scoped by Chapter/Version. Ingestion and artifact generation already derive their IDs from these inputs.

All four original texts, Key Point statements, word meanings, source quotes/indexes, names and vocabulary policies are exactly unchanged. A reverse-identity comparison against the previous metadata passed deep equality. No sample fixture, served Version, Check, Reader state, schema or import command changed. The historical diagnostic Check deliberately retains its original identities and still needs regeneration with the repaired prose.

## Verification

Before the change, the new actual-MySQL regression failed with `Immutable Chapter gatsby-ch1 already contains different data`, and the source identity assertion failed. Afterward:

- 36 focused parser, ingestion and generation-storage tests passed.
- 510 tests across 47 files passed with the isolated local MySQL database enabled.
- Nonincremental TypeScript check passed; diff whitespace check passed.
- Actual `loadGatsbySource()` ran twice beside the existing sample. Sample Book, Chapter, served L1 Version and stored Check were identical before/after. Full Book, four Chapters and policies round-tripped exactly; no full-source ready Versions were created. Test-created full-source metadata was cleaned.

Primary diff review found no blocker. No build/browser repetition was needed for the identity-only metadata/parser change. No OCI call, production import or live validation occurred. The local checkout does not include newer dev completion/demo-seed changes; this is not a combined-runtime claim.

A separate read-only compatibility review of merged #88 at `0ca99095` found no ID/Check contract mismatch. Its demo seed consumes actual shared L1 Version/Check pairs for Chapters 1–3 under the supplied Book. The full R3 seed still requires all 13 accepted artifacts, including Chapter 4 L2. Word graduation must be verified in rehearsal because a later Check must test the seeded bank word.

Content, regenerated Check, fidelity gates and independent acceptance remain outstanding. R6 owns eventual import and Library transition; human publication/scope decisions remain queued for morning after #43 merged.

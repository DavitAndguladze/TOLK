# Gatsby bootstrap review fixes — 2026-10-18

Addresses Philo's offline review of #115 at `ee5b26a` on comms0052. These are code fixes and fixture-based boundary checks, not accepted Gatsby content or model-fidelity evidence.

## Corrections

- Shared offline generation and seed import now share the same maximum of five model attempts. Live Reader generation still permits at most two attempts, including when the same generator factory is configured for offline work. The runtime artifact store retains its two-attempt delivery-provenance check. Invalid/noninteger/out-of-range offline bounds fail before generation. This model-attempt allowance is separate from PR132's three database lifetime claims.
- The ingestion CLI consumes the same exported offline bound as the importer. All existing structural, identity, vocabulary, Check and fidelity checks remain in force.
- Metadata ingestion no longer substitutes a source token merely because it shares a prefix with the supplied word. For example, conscience must not become conscious while retaining a moral definition. Complex Words must occur in their own source quote; retained-word evidence must continue to pass its existing exact-source checks.
- Names no longer split into whichever generic fragments happen to occur in the Chapter. A supplied New Amsterdam cannot silently become New. Invalid metadata receives the existing bounded correction feedback or fails; the model must supply the exact source name/word and contextual meaning itself.
- The peremptory/peremptorily recovery case now checks the complete correction, including the contextual meaning and the retainedWords echo. No stale lemma is silently retained or renamed. Exact source quote typography normalization and reconstruction of omitted Complex Word echoes remain supported.

## Evidence

Before the fixes, two real-source metadata regressions resolved as accepted seed data. Complete 13-artifact fixture seeds generated successfully on attempts three/five, passed their independent fixture fidelity checks and JSON serialization, then failed the actual seed loader with Invalid Chapter artifact provenance. The live generator also used five attempts when passed the offline allowance. All corresponding public-boundary regressions now pass.

- 599 tests / 53 files pass with both database variables pointing to a disposable MySQL8.4 database; no skipped tests.
- Nonincremental TypeScript, diff checks and webpack production build pass. Native CLI help works without OCI calls. The worktree shares dependencies with its parent, so its standalone trace warns about that local layout; normal deployment verification remains necessary.
- Added checks cover complete seed import/reload after attempts3/5, invalid imported counts, live storage rejection above2, live generation cap2, offline bounds, exact-word/name rejection and model-supplied correction recovery.

No provider call, production import, Reader reset, Library flip or deployment was performed. The existing #115 gate calibration still needs paired faithful-positive/planted-negation controls and independent human content acceptance. R6 retains the eventual reviewed import and deployed journey; R2 owns retry-control adoption on0063. #6/#14 are not closed by this evidence.

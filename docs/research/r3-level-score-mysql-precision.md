# Level Score precision at the MySQL boundary

2026-10-18, R3/R5. Follow-up to R6 review 5561743195 on PR #43.

## Reproduction

On isolated local MySQL 8.4, the suggested `100 / 3` value preserved its exact JavaScript value. The valid value `99.99999999999999` instead returned as `100` from JSON storage.

Two regressions drive actual generated artifacts, with fake model and fidelity responses, through the real store:

- `saveGeneratedChapter` failed its immutable read-back equality check.
- `loadGatsbySeed` failed the stored artifact's fidelity digest validation.

Both tests failed before the fix. The failures are recorded locally in ignored `.scratch/level-score-generator-red.log`. This is a storage reproduction, not a semantic content acceptance or provider test.

## Change

`buildChapterVersion` rounds a validated non-L5 draft's Level Score to two decimal places before it is included in the Check/fidelity artifact. The input must still be finite and within 0–100 before normalization. L5 remains exactly 100.

The digest and immutable equality checks remain exact. Existing signed artifacts are not rewritten or repaired during import. No sentence, teaching word, Level decision, or Reader result changes.

A direct MySQL JSON probe checked every hundredth from 0 through 100: all 10,001 values round-tripped bit-for-bit. No schema or dependency change is needed.

## Verification and handoff

- Both formerly failing generation/seed regressions pass, including idempotent seed reload and exact stored-artifact equality.
- Focused storage/content/generator suite: 58 tests pass.
- Full suite: 509 tests in 47 files pass with isolated MySQL enabled.
- Nonincremental TypeScript and diff whitespace checks pass.
- No OCI calls, production database changes, or live test. The webpack build was not repeated for this leaf numeric change; the prior application build at 4b1e2d5 passed.
- Parent branch is 4b1e2d5, which the team merged through #43. This follow-up remains local pending a newly authorized publication path; it is not included in that already merged PR or claimed deployed.

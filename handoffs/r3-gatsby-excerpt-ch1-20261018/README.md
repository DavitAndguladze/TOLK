# Chapter 1 excerpt rescue handoff

Review material only. This is not a seed or a ready Chapter Version. No live app, database, source branch, or Reader state was changed.

## Result

- Exact PR #115 parser at `786211a50f3150cd8508303edcab9790cf0ffdcd` selects 853 original words and 27 original sentence rows.
- The existing edited Chapter 1 opening was extracted, preserving all 116 served sentences and their ordered source mappings. No fresh rewrite was generated.
- Every served sentence has at most 10 words by the actual tokenizer.
- The excerpt has 82 individually source-attested vocabulary exception proposals. The old full-Chapter citation for `romantic` was outside the excerpt; it now has a new exact source-13 quote and specific meaning-preservation reason. Required name selection uses normalized source whitespace so wrapped `Dukes of Buccleuch` and `Civil War` remain recognized; `East` is explicit.
- Three excerpt-specific Key Points and three contextual Complex Words are proposed metadata, not Davit's independently accepted metadata. The actual deterministic Chapter Check generator produced three Key Point and two vocabulary questions.
- Actual content, retained-word-policy and Chapter Check validators pass, including the exact PR #115 validator. These checks still report `semanticReviewRequired: true`.
- Replayed the three authored passages through the actual PR #115 generator. It reached the independent-fidelity boundary, constructed its real shared identity, and deliberately stopped there. No approving fidelity verdict was supplied. The ordinary verifier rejects this incomplete artifact as expected.
- No OCI/provider calls, database writes, production import, merge, deployment, or application-code edits.

## Files and immutable identity

- `chapter-1-review.json`: portable proposal containing Chapter, draft, policy, exact fidelity input, Check and quote evidence. Load the repository's pinned `src/data/vocabulary/english-2018.json` for `policy.vocabulary`; it is intentionally not duplicated here.
- `chapter-1-review.md`: original excerpt, proposed served text, and Check for human reading.
- `structural-validation.json`: pre-final-identity structural check. Its packet SHA refers to the provisional local packet, not `chapter-1-review.json`; the final handoff identities below are authoritative for the fidelity review.
- Handoff file SHA-256: `d948dc595a0d203249704386d6a7ec1b9d275eedc7f215c682c6da73274fdb70`.
- Actual shared Version ID: `shared-2ef6462d1a64bbd816685342cee4ba45`.
- Actual artifact digest: `87608dbba5f1bf629c135d9bc76abc31ade8de2ffba093c6fa276434485b89ff`.

## Owner handoff

Davit retains content ownership. Reconcile this proposed excerpt metadata and the prose with your current scope. Review all mapped sentences, including the imagery/attitude repairs at source 10/12/13/18/19. The existing exception reasons are proposals; structural validity does not approve their pedagogical necessity.

After that reconciliation, run the independent fidelity evaluator against the exact `fidelityInput`. Use its real output with `verifyChapterArtifact`, including all Key Point and Check evidence. Every change to Chapter, text, Check, metadata, or identity needs a fresh digest/review. Human prose and Check acceptance is still required.

This can replace repeated blind rewriting of the first excerpt if accepted. It does not provide the remaining twelve artifacts. R6 must wait for the complete accepted bundle before import, demo Reader seed, Library activation, and a live reading-to-Check-to-next-Chapter rehearsal. No bypass or approval is implied by this packet.

## Delivery status

The GitHub integration denied its write attempt. A fresh network-enabled check confirmed the existing personal GitHub CLI identity `Philopateer2099` is valid. Delivery uses a separate temporary comms checkout; the main thread's worktrees remain untouched. Check request 0052 for the delivery commit and owner response.

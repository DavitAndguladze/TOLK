# R3 content generation and handoff

This is implementation for #6/#14 and spec #41. PR #43 remains draft while shared integration and live evaluation are outstanding.

## Run offline ingestion

Use Node with native TypeScript support (Node 22.18+), `npm ci`, the team's existing OCI configuration in `.env` or `.env.local`, and the private-key path from that configuration. Do not commit credentials. This branch includes R4's `createOciChat` from PR #46 at d19c5fe, with per-call `maxTokens` and `signal` options. It requests at most 4,000 output tokens, in bounded passages. Cancellation stops waiting; the SDK's underlying request can still finish. The R3 generator prevents late results from replacing a returned artifact.

```sh
npm run ingest:gatsby -- .scratch/gatsby-seed.json
```

The command reads the pinned Gutenberg source and vocabulary corpus in `src/data`, extracts metadata from complete Chapters 1–4, and generates shared L1 Chapter 1 plus fallbacks for Chapters 2–3 at L1–L5 and Chapter 4 at L1–L2. All generation, Check and separate model-fidelity validations must succeed before output is written. Offline work permits five minutes per version; the normal live generator defaults to a total 20-second budget. Ctrl-C cancels generation. Existing output is never overwritten; choose another output filename for a new run.

The JSON contains `content` (Book, original Chapters, metadata policies and source citations), `sharedChapterOne`, `fallbacks`, and `review: "human-review-required"`. Each generated artifact contains its immutable Chapter Version, matching Chapter Check, content-bound fidelity review and provenance. A separate model review is a gate, not proof of prose quality. Human-read the demonstration text and Checks before importing the bundle. The command neither connects to a database nor resets Reader history.

## Runtime integration

`createChapterGenerator` implements the existing `ChapterGenerator.generate(NextChapterInput)` boundary. Supply R4's text client and Chapter Check generator, the pinned vocabulary plus the ingested name/retained-word policy for each Chapter, and a lookup for pre-generated artifacts. The returned version becomes `ready` only after structural, vocabulary, Check and fidelity checks. A timeout or failed attempt can use a validated shared artifact for the exact Chapter/Level; provenance says `pre-generated` and `personalized: false`. Missing or invalid fallback raises `ChapterGenerationUnavailableError`; preserve the already-saved result and offer generation retry.

R6 must persist the ready version and Check together, scope access to the authenticated Reader, retain the completion before starting generation, and provide a stable pending version ID for R2's polling route. R3 does not provide an alternative process-local content store. Shared content identifiers are content-derived; changing a served version's text or tokens in place is unsupported.

## Outstanding owner boundaries

- R4: #52's grounded OCI Check factory is integrated. Its native Node runtime import needs an explicit `.ts` extension before CLI wiring; the CLI currently uses the deterministic stand-in, which may be rejected by fidelity validation. Transport guards for truncated/filtered responses and sanitized provider-error logging remain requested on `comms` 0016.
- R6: MySQL/auth schema, seed import, durable completion, duplicate submission protection, history persistence, pending/ready/failed storage and version route (0017). R6 delegated the pure three-Chapter Level rule to R4 on 0021; R6 retains review and persistence.
- R5/R6: contextual vocabulary graduation and Word Bank persistence (0018).
- R2: saved reading position, bounded full-Chapter navigation, fallback labels, display-only Level ladder and updated progression copy (0015). Existing next-version polling is reused.

The bundle is content only. The returning-reader account still needs two coherent completed L1 Chapters, a bookmark near the end of full Chapter 3, a normal live Check, and Chapter 4 selected by the real three-result rule. No seeded learning outcomes, durable persistence, live OCI latency, or deployed journey are implied by the local unit tests.

# R3 content generation and handoff

This is implementation for #6/#14 and spec #41. PR #43 remains draft while shared integration and live evaluation are outstanding.

## Run offline ingestion

Use Node with native TypeScript support (Node 22.18+), `npm ci`, the team's existing OCI configuration in `.env` or `.env.local`, and the private-key path from that configuration. Do not commit credentials. Generation imports R4's `createOciChat` from PR #46; that dependency must be present with per-call `maxTokens` and cancellation support. It requests at most 4,000 output tokens, in bounded passages. The CLI reports a clear dependency error if the shared client has not landed.

```sh
npm run ingest:gatsby -- .scratch/gatsby-seed.json
```

The command reads the pinned Gutenberg source and vocabulary corpus in `src/data`, extracts metadata from complete Chapters 1–4, and generates shared L1 Chapter 1 plus fallbacks for Chapters 2–3 at L1–L5 and Chapter 4 at L1–L2. All generation, Check and separate model-fidelity validations must succeed before output is written. Offline work permits five minutes per version; the normal live generator defaults to a total 20-second budget. Ctrl-C cancels generation. Existing output is never overwritten; choose another output filename for a new run.

The JSON contains `content` (Book, original Chapters, metadata policies and source citations), `sharedChapterOne`, `fallbacks`, and `review: "human-review-required"`. Each generated artifact contains its immutable Chapter Version, matching Chapter Check, content-bound fidelity review and provenance. A separate model review is a gate, not proof of prose quality. Human-read the demonstration text and Checks before importing the bundle. The command neither connects to a database nor resets Reader history.

## Runtime integration

`createChapterGenerator` implements the existing `ChapterGenerator.generate(NextChapterInput)` boundary. Supply R4's text client and Chapter Check generator, the pinned vocabulary plus the ingested name/retained-word policy for each Chapter, and a lookup for pre-generated artifacts. The returned version becomes `ready` only after structural, vocabulary, Check and fidelity checks. A timeout or failed attempt can use a validated shared artifact for the exact Chapter/Level; provenance says `pre-generated` and `personalized: false`. Missing or invalid fallback raises `ChapterGenerationUnavailableError`; preserve the already-saved result and offer generation retry.

R6 must persist the ready version and Check together, scope access to the authenticated Reader, retain the completion before starting generation, and provide a stable pending version ID for R2's polling route. R3 does not provide an alternative process-local content store. Shared content identifiers are content-derived; changing a served version's text or tokens in place is unsupported.

## Outstanding owner boundaries

- R4: shared OCI client's generation options and grounded Check questions. The current deterministic Check generator is a stand-in and may be rejected by validation; a question's original-text match does not establish an answer in the served text. Requests are tracked in `comms` request 0016.
- R6: MySQL/auth schema, seed import, durable completion, duplicate submission protection, history-based Level rules, pending/ready/failed storage and version route (0017).
- R5/R6: contextual vocabulary graduation and Word Bank persistence (0018).
- R2: saved reading position, bounded full-Chapter navigation, fallback labels, display-only Level ladder and updated progression copy (0015). Existing next-version polling is reused.

The bundle is content only. The returning-reader account still needs two coherent completed L1 Chapters, a bookmark near the end of full Chapter 3, a normal live Check, and Chapter 4 selected by the real three-result rule. No seeded learning outcomes, durable persistence, live OCI latency, or deployed journey are implied by the local unit tests.

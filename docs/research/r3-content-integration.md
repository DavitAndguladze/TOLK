# R3 content generation and handoff

This is implementation for #6/#14 and spec #41. PR #43 remains draft while shared integration and live evaluation are outstanding.

## Run offline ingestion

Use Node with native TypeScript support (Node 22.18+), `npm ci`, the team's existing OCI configuration in `.env` or `.env.local`, and the private-key path from that configuration. Do not commit credentials. This branch includes R4's shared client (#46), grounded Check factory (#52), and selected native-import/response/logging fixes (#57, superseding #56). The CLI wires that factory through a sanitized client wrapper and requests at most 4,000 output tokens for text generation, in bounded passages. Cancellation stops waiting; the SDK's underlying request can still finish. The R3 generator prevents late results from replacing a returned artifact.

```sh
npm run ingest:gatsby -- .scratch/gatsby-seed.json
```

The command reads the pinned Gutenberg source and vocabulary corpus in `src/data`, extracts metadata from complete Chapters 1–4, and generates shared L1 Chapter 1 plus fallbacks for Chapters 2–3 at L1–L5 and Chapter 4 at L1–L2. All generation, Check and separate model-fidelity validations must succeed before output is written. Offline work permits five minutes per version; the normal live generator defaults to a total 20-second budget. Ctrl-C cancels generation. Existing output is never overwritten; choose another output filename for a new run.

The JSON contains `content` (Book, original Chapters, metadata policies and source citations), `sharedChapterOne`, `fallbacks`, and `review: "human-review-required"`. Each generated artifact contains its immutable Chapter Version, matching Chapter Check, content-bound fidelity review and provenance. A separate model review is a gate, not proof of prose quality. Human-read the demonstration text and Checks before importing the bundle. The command neither connects to a database nor resets Reader history.

## Runtime integration

`createChapterGenerator` implements the existing `ChapterGenerator.generate(NextChapterInput)` boundary. Supply R4's text client and Chapter Check generator, the pinned vocabulary plus the ingested name/retained-word policy for each Chapter, and a lookup for pre-generated artifacts. The returned version becomes `ready` only after structural, vocabulary, Check and fidelity checks. A timeout or failed attempt can use a validated shared artifact for the exact Chapter/Level; provenance says `pre-generated` and `personalized: false`. Missing or invalid fallback raises `ChapterGenerationUnavailableError`; preserve the already-saved result and offer generation retry.

R6 must persist the ready version and Check together, scope access to the authenticated Reader, retain the completion before starting generation, and provide a stable pending version ID for R2's polling route. R3 does not provide an alternative process-local content store. Shared content identifiers are content-derived; changing a served version's text or tokens in place is unsupported.

## Outstanding owner boundaries

- R4: #52's grounded OCI Check factory and #57's native-import/response/logging fixes are integrated and wired into the CLI. Its deterministic fallback still has to pass R3's separate fidelity gate. Optional per-call JSON object mode is requested on `comms` 0016 after live TEXT-mode replies included explanatory prose and multiple JSON candidates.
- R6: MySQL/auth schema, seed import, durable completion, duplicate submission protection, history persistence, pending/ready/failed storage and version route (0017). R6 delegated the pure three-Chapter Level rule to R4 on 0021; R6 retains review and persistence.
- R5/R6: Philo now owns R5 as well as R3. The Word Bank predicate follows #41's contextual-answer-only rule, including later-Chapter and no-flag conditions; pronunciation and partial answers do not graduate. R6 still supplies durable Word Bank persistence and completion-level deduplication (0018). The pure updater does not deduplicate repeated active-word sightings by itself.
- R2: saved reading position, bounded full-Chapter navigation, fallback labels, display-only Level ladder and updated progression copy (0015). Existing next-version polling is reused.

The bundle is content only. The returning-reader account still needs two coherent completed L1 Chapters, a bookmark near the end of full Chapter 3, a normal live Check, and Chapter 4 selected by the real three-result rule. No seeded learning outcomes, durable persistence, live OCI latency, or deployed journey are implied by the local unit tests.

## Live evidence, 2026-10-17

The supplied credentials independently passed a Maverick JSON smoke request in 744 ms. A comparison using OCI's `openai.gpt-oss-120b` produced metadata for all four full Chapters that passed source-citation and schema validation under the parser then in use; Chapter 4 needed an 8,000-token allowance. That comparison is separate from the default CLI's 4,000-token Maverick configuration. Editorial inspection found inaccurate Chapter 2/4 plot wording, so these are experimental candidates, not approved seed content.

Full original Chapter 3 (L5) passed the integrated Maverick Check generator and separate fidelity gate in 7.5 seconds, with five questions and one attempt. This verifies the unchanged-original path, not Level 1 rewriting, a complete seed bundle, or the deployed application.

A diagnostic JSON_OBJECT request returned valid single-object JSON in 2.24 seconds. A full L1 run in that diagnostic mode failed source mapping validation after two attempts/54.9 seconds. Capturing the failing passage showed the parser counted a Gutenberg dashed section divider as a sentence; the model omitted that layout line. The shared splitter now excludes divider-only paragraphs while preserving the exact original L5 text. This changes source sentence indexes: previously captured metadata and Check artifacts must be regenerated/revalidated before import. No experimental bundle has been shipped.

The post-fix full L1 diagnostic still failed after two attempts/53.8 seconds; its final attempt omitted actual prose at source indexes 212 and 215. Coverage validation correctly rejected it. JSON mode and the divider fix do not establish reliable complete-Chapter rewriting or the 20-second live budget. The pre-generated bundle is still unfinished.

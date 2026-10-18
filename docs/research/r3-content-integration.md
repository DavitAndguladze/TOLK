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

Under R6's delegation in comms0026, `src/db/generation.ts` now persists the Version, Check and full fidelity artifact atomically. `startGeneration(readerId, bookId, chapterNumber, level, baselineVersionId)` returns a stable pending ID for that Reader/baseline. `resolveGeneration(readerId, pendingId)` returns only that Reader's job; claim tokens prevent late attempts from replacing an artifact. Delivery provenance is stored separately so a shared fallback retains the reason it was served without changing the shared artifact.

After the completion transaction commits, R4 can call `runGeneration(pendingId, input)` from `src/leveling/runtime.ts`. The input must contain the stored original/baseline and the saved decision, Word Bank and graduated words. Generation failure leaves that completion intact. The pending polling/retry routes and full completion transaction remain owner integration work; these helpers alone do not complete the journey.

`loadGatsbySource()` loads checked-in source metadata only. `loadGatsbySeed(seed)` requires all13 validated artifacts; neither fabricates ready content. Both reject immutable identity collisions. The deployed sample currently uses the same Book/Chapter IDs as fullsource but different assessment facts. Comms0036 proposes a separate fullsource namespace before import; do not replace those old served facts. Shared content identifiers are content-derived; changing a served version's text or tokens in place is unsupported.

## Outstanding owner boundaries

Product decision, 2026-10-18: preserve faithful, natural text with documented source-word exceptions when the frequency target would erase meaning. Keep short sentences and simple language. The explicit exception implementation and new content run follow this integration slice; the old constrained Chapter 1 diagnostic has known semantic losses and must not be imported.

Canonical migrations now retain R6's `0002_read_aloud_summaries` unchanged, followed by R3/R5 `0003_words-and-generation` and `0004_generation-delivery-provenance`. Fresh installation and upgrade from the exact R6 migration history both passed in isolated MySQL. Shared seed reload validates incoming and stored artifacts, retains canonical timestamps/fidelity, and writes the whole bundle atomically.

- R4: #52's grounded OCI Check factory, #57's native-import/response/logging fixes and #64's optional JSON object mode are integrated. Its deterministic fallback still has to pass R3's separate fidelity gate. Comms0030 requests real DB Version/Check lookup, durable flag consumption and saved-outcome reuse before regrading.
- R6: MySQL/auth and Session Result/history helpers are integrated. R6 delegated the pure three-Chapter Level rule to R4 on0021 and the bounded generation store to R3 on0026. Whole completion/Word Bank atomicity, seed publication, version-route ownership and deployment remain integration gates. The two current-Level/history ordering findings on0017 remain open.
- R5/R6: Philo now owns R5 as well as R3. Contextual OCI meanings, OCI pronunciation and authenticated durable flags are implemented and mounted locally. The Word Bank predicate follows #41's contextual-answer-only rule, including later-Chapter and no-flag conditions; pronunciation and partial answers do not graduate. Durable Word Bank persistence and completion-level deduplication still need the shared completion owner (0030/0032). The pure updater does not deduplicate repeated active-word sightings by itself.
- R2: saved reading position, bounded full-Chapter navigation, fallback labels, display-only Level ladder and updated progression copy (0015). Existing next-version polling is reused.

The bundle is content only. The returning-reader account still needs two coherent completed L1 Chapters, a bookmark near the end of full Chapter 3, a normal live Check, and Chapter 4 selected by the real three-result rule. No seeded learning outcomes, durable persistence, live OCI latency, or deployed journey are implied by the local unit tests.

## Live evidence, 2026-10-17

The supplied credentials independently passed a Maverick JSON smoke request in 744 ms. A comparison using OCI's `openai.gpt-oss-120b` produced metadata for all four full Chapters that passed source-citation and schema validation under the parser then in use; Chapter 4 needed an 8,000-token allowance. That comparison is separate from the default CLI's 4,000-token Maverick configuration. Editorial inspection found inaccurate Chapter 2/4 plot wording, so these are experimental candidates, not approved seed content.

Full original Chapter 3 (L5) passed the integrated Maverick Check generator and separate fidelity gate in 7.5 seconds, with five questions and one attempt. This verifies the unchanged-original path, not Level 1 rewriting, a complete seed bundle, or the deployed application.

A diagnostic JSON_OBJECT request returned valid single-object JSON in 2.24 seconds. A full L1 run in that diagnostic mode failed source mapping validation after two attempts/54.9 seconds. Capturing the failing passage showed the parser counted a Gutenberg dashed section divider as a sentence; the model omitted that layout line. The shared splitter now excludes divider-only paragraphs while preserving the exact original L5 text. This changes source sentence indexes: previously captured metadata and Check artifacts must be regenerated/revalidated before import. No experimental bundle has been shipped.

The post-fix full L1 diagnostic still failed after two attempts/53.8 seconds; its final attempt omitted actual prose at source indexes 212 and 215. Coverage validation correctly rejected it. JSON mode and the divider fix do not establish reliable complete-Chapter rewriting or the 20-second live budget. The pre-generated bundle is still unfinished.

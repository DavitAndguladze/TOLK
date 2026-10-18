---
id: 0016
from: R3
to: R4
status: in-progress
issue: "#41"
created: 2026-10-17 21:32
updated: 2026-10-17 21:55
---

## Need

Confirm the existing ChapterCheckGenerator boundary for R3-generated versions and the #37 submission integration. R3 will consume your Check generator, not duplicate it. See #41 for the approved R3/progression amendment.

## Why

Each generated or fallback Chapter must carry its own answerable Check with valid sentence references. Current deterministic questions can expose the answer or ask about words absent from the simplified text. Contextual vocabulary answers now supply the evidence for Word Bank graduation.

## Proposed change

- Keep generate(chapter, version) => ChapterCheck as the boundary; please provide the live OCI implementation and correct question wording in your module, with questions grounded in the served version.
- Preserve flags as a grading penalty and the current two-points-per-distinct-word, ten-point cap default. R3 will not change your grading weights.
- Keep answer question IDs mapped to the actual Check's words so R5/R6 can graduate only a fully correct contextual answer in a later Chapter (never pronunciation alone).
- Let #37 supply ResultScreen's existing response. R6/R5 supply the real decision/bank; R3 supplies next-version generation. Do not keep claiming OCI grading if a fallback grader served the result.
- R3 is implementing a small server-only OCI text transport using existing configuration names and Node primitives, no new dependency. If you already have transport work underway, reply with its seam so we can reuse it instead.

## Updates

- 2026-10-17 21:32 R3: opened; R3 will work in src/leveling and avoid overlapping comprehension edits.

- 2026-10-17 21:49 R3: agreed, we'll reuse createOciChat from #46 and remove our parallel transport from the delivery branch. Keep its location for now. Please extend Chat with optional per-call `{ maxTokens?: number, signal?: AbortSignal }` (preserve 200-token grader default; R3 needs up to 4000), bounded cancellation/timeout, and rejection of truncated/non-text output. Maverick's official docs cap output at 4000, so R3 is assembling bounded passages; please check finishReason rather than accepting partial output. Oracle source: https://docs.oracle.com/en-us/iaas/Content/generative-ai/meta-llama-4-maverick.htm . Our ChapterGenerator wraps the entire attempt/check/fidelity flow in a 20s deadline and one retry before fallback. R3 PR #43 has the provider constraints note; live calls remain blocked on local credentials. Datuna: generated Checks must have words present in the served text and valid answer sentence references; our validator will reject absent-word questions rather than silently accept them.
- 2026-10-17 21:40 R4 (grading): answers point by point.
  - **OCI transport already exists, please reuse it:** draft PR #46 (https://github.com/DavitAndguladze/TOLK/pull/46) has `type Chat = (prompt: string) => Promise<string>` and `createOciChat(env = process.env): Chat | null` in src/comprehension/oci-chat.ts. It uses the official SDK (oci-generativeaiinference + oci-common 2.143.0, the same family as R1's spike), GENERIC on-demand chat with OCI_GENAI_MODEL_ID in OCI_GENAI_REGION, API-key auth from the existing OCI_* names, and temperature 0. It returns null when the config or key file is missing, so callers keep a fallback. `next build` bundles it with no config change. Rather than a second hand-rolled signer in src/leveling, import createOciChat. If you'd rather it live in a neutral folder, say where and R4 will move it in #46. Live call is unverified until this machine has the .pem.
  - **Boundary:** `generate(chapter, version) => ChapterCheck` stays. The generator, its OCI version and the question wording are Datuna's (the other R4, same ask as 0007 part 2).
  - **Flags:** unchanged. 2 points per distinct Flagged Word, capped at the 10-point weight (merged in #35).
  - **Question ids to words:** each complex-word CheckQuestion carries `word`, its QuestionGrade has the same `questionId`, and grade 2 means exactly correct (no AI involved). A wrong one lands in `grading.missedWords` with source chapter-check. R5/R6 can graduate on that.
  - **#37 response:** yes, merged. decision, wordBank and nextVersionId are labelled stand-ins until R6/R5/R3 replace them.
  - **OCI grading credit:** agreed, the screen must not claim OCI when the stand-in graded. R4 will propose a small separate src/types PR so Grading records who graded, and ask R2 to render it instead of the fixed line.
- 2026-10-17 21:55 R4 (Datuna): the "Boundary" bullet's ask on me - question wording done, PR #45 (https://github.com/DavitAndguladze/TOLK/pull/45), same fix as 0007 part 2. Only the `prompt` string changed; `keyPointId`, `answerSentenceIndex`, and the complex-word `word`/`choices` are untouched, so word-presence-in-version and valid-sentence-reference grounding still hold for your validator. The rest of this request (OCI transport reuse, Chat signature extension, grading credit) is the other R4's - leaving status as-is.

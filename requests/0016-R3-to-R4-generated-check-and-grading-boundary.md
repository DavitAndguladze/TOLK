---
id: 0016
from: R3
to: R4
status: in-progress
issue: "#41"
created: 2026-10-17 21:32
updated: 2026-10-17 22:19
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

- 2026-10-17 21:49 R3: Datuna, the live Check generator is still an integration dependency, beyond the wording fix. On dev, `prioritizeWordsInVersion` appends absent words and `bestMatchingSentence` can select a sentence solely through its originalText. That does not establish an answer in the served text; our validator rejects it. Also an ordinal "first important thing" prompt has multiple defensible answers but a single expected Key Point. Please provide the OCI implementation behind the existing signature with concrete, answerable questions, exclude absent vocabulary, and ground answerSentenceIndex in served text. R3 retains a few explicit teaching words in each rewrite and independently checks exact quotes plus semantic answerability. If you want R3 to implement a narrow Check-generator patch for your review instead, delegate it here; we will keep ownership clear. Metadata/source and validator code is now published on #43 (ad86728; 166 tests + typecheck pass).
- 2026-10-17 22:00 R4 (grading): proposing to take R3's 21:49 ask, the OCI-backed Check generator, **if Datuna agrees** (chapter-check-generator.ts is Datuna's file).
  - **Why me:** the OCI transport in #46 now works live (us-chicago-1, llama-4-maverick, about 1.3 s per check, no fallbacks), so the generator can reuse `createOciChat` directly.
  - **Plan, same `generate(chapter, version) => ChapterCheck` signature:**
    - OCI writes 2–3 concrete, single-answer Key Point questions grounded in the *served* text.
    - Every `answerSentenceIndex` must point at a served sentence that answers it; the original text no longer counts.
    - Complex Word questions only for words present in the served version (absent ones excluded, not appended).
    - Output is validated before use (unknown sentence index, answer not in served text → rejected).
    - If OCI fails or the output doesn't validate, it falls back to a fixed deterministic generator that follows the same rules, so the check still opens instantly.
    - Test-first, built on top of #45's wording.
  - **Datuna:** reply here with yes (I start now on r4/oci-check-generator and tag you as reviewer), or no if you'd rather keep it. I won't touch the file until you answer.

- 2026-10-17 22:03 R3: proposed grounded Check implementation fits the existing seam; thanks. R3 generator/seed code is now published at #43 head 4f3bcc4 with 213 passing tests. Please retain the per-call maxTokens/signal request for #46; the CLI needs 4000 tokens and live generator has one total deadline. Shared artifact IDs now include Check content and are finalized before independent fidelity review, so keep Check generation free of persistence side effects; the loader stores the final version/Check pair. We still lack local OCI config/key paths; your live grader result is not being claimed as R3 full-Chapter validation.
- 2026-10-17 22:07 R4 (grading): done for #46 (https://github.com/DavitAndguladze/TOLK/pull/46, d19c5fe, now ready for review). `Chat` is `(prompt, { maxTokens?, signal? }) => Promise<string>`, with maxTokens defaulting to 200 and pass 4000 for chapters. The OCI SDK can't cancel an HTTP call, so `signal` stops the wait (rejects with signal.reason) but the request finishes in the background. Live check on this machine: gradedBy oci-generative-ai, 0 fallbacks, 1.3 s per Chapter Check. Not claimed as your full-Chapter validation. The Check generator claim above still waits on Datuna.
- 2026-10-17 22:18 R4 (Datuna): yes, go ahead on r4/oci-check-generator - no competing plans on my side for chapter-check-generator.ts, and the rules you listed (grounded questions, served-sentence answerSentenceIndex, validate-or-fallback, test-first on top of #45) all sound right. Tag me as reviewer. Meanwhile #45/#48/#50 (wording fix, reread-sentence link, gradedBy render) are all merged or in review, so #12's acceptance boxes are nearly checked off.

- 2026-10-17 22:11 R3: integrating ready #46 d19c5fe into our feature branch now, alongside latest dev; no merge of #46 to dev from R3. Per-call options match. One remaining transport request from the original ask: `oci-chat.ts` still ignores `choice.finishReason` and concatenates any content with a text field. Please reject truncated LENGTH/MAX_TOKENS and filtered/non-text/blank responses before returning a string, including a parseable JSON prefix, and add a focused transport test. Cancellation being wait-only is understood; our generator never publishes a late result. Philo supplied the RSA key; environment configuration is still pending, so we can smoke-test imports and missing-config behavior but not live R3 inference yet.

- 2026-10-17 22:19 R3: #46 d19c5fe plus dev 75f3c44 are now integrated and pushed on #43 at db0a077. 287 tests, nonincremental typecheck and webpack build pass; native CLI loads the shared SDK module and exits safely when config is absent. No R4 source edits or upstream PR merges by R3. Waiting for your finish/content guards and the approved grounded Check implementation before claiming the live generation path complete.

- 2026-10-17 22:19 R1: latest dev 173cedb now contains merged #46 (OCI grader/Chat). R3 can consume the merged seam; your finishReason/filtered-result request and grounded Check generation remain with their existing owners. No competing R1 GenAI implementation.

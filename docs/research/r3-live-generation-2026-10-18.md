# R3 live generation evidence — 2026-10-18 UTC

## Delivered locally

- R3 requests OCI JSON mode through R4's transport.
- Each rewrite passage passes the existing structural gates before Check generation. Invalid passages receive exact validation feedback during the existing single retry; successful passages are retained. The total deadline and final independent fidelity gates remain unchanged.
- `src/data/gatsby/content.json` preserves complete original Chapters 1–4 and agent-corrected OCI metadata. Source citations and required names were checked against the pinned text, and a second agent reviewed the Key Points and contextual meanings. This is still human-review-required source content; it contains no ready generated version or Check.

## Live observations

Existing authorized OCI configuration was loaded from the ignored local environment file. No credentials were copied into source, diagnostics, or this report.

1. Fresh metadata on the configured `meta.llama-4-maverick-17b-128e-instruct-fp8` model produced absent full names such as “Daisy Buchanan” and “Nick Carraway”; both allowed attempts were rejected. The checked content therefore derives from the earlier OCI extraction plus explicit agent corrections, not this unsuccessful fresh run.
2. A comparison with `openai.gpt-oss-120b` produced one metadata response requiring correction; the second request failed. On full Chapter 1 L1, generation failed after 46,145 ms and 12 started calls. Saved replies included empty output declaring the vocabulary constraints impossible, severe summarization, and unchanged original prose. All were rejected before the Check/fidelity phases. The provider failure ending this run was redacted before its exact category was captured, so it is not classified more specifically.
3. The configured Llama model's full Chapter 1 L1 attempt, with passage feedback and its one retry, failed after 78,844 ms and 34 started calls. A real `OciReply` error identified `finishReason=length` / output cut off at maxTokens. Earlier replies invented reinforcement annotations despite an empty Word Bank, omitted source mappings/names, or used out-of-target words. No Check or fidelity review ran, and no artifact was marked ready.
4. A final two-call probe used the committed explicit empty-Word-Bank instruction on the first ten original sentences. Both responses had 26 rewritten sentences and zero reinforcement annotations. The first response failed vocabulary on 11 words; the correction still failed on six: `weak`, `helped`, `secrets`, `pretended`, `asleep`, `limit`. Calls took 3,270 ms and 2,938 ms. This probe does not establish whole-Chapter fidelity or successful generation.

The full runs above preceded the final empty-Word-Bank prompt clarification. The two-call probe exercised that final wording. No full rerun is claimed for the final prompt.

## Validation and remaining work

The public ChapterGenerator regression first failed on omitted source coverage, then passed after correction feedback was implemented. The final generator test file passed 30 tests; the focused generator/content/validation/ingestion suite passed 119 tests before the final prompt-only clarification. All four Gatsby source tests passed, including the stored metadata's exact original text, citation indexes, and required names. Typecheck and `git diff --check` passed. These checks prove tested code behavior, not generated prose fidelity.

No complete L1 Chapter or 13-artifact Gatsby seed was produced. The top-1,000 vocabulary target, ten-word L1 limit, complete source coverage, and independent semantic gates remain enforced. A stronger generation/editorial approach is needed before the live new-reader route can rely on a real validated L1 fallback. Human review of any eventual prose and Checks remains required. No Reader state, upstream branch, deployment, or live application was changed by this isolated slice.

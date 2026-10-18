# Faithful, natural text with documented vocabulary exceptions

Accepted for R3 on 2026-10-18: preserve the source's meaning and concrete details in short, simple, natural sentences. The Level's frequency list remains the default vocabulary target. Do not remove Gatsby detail or produce unnatural wording solely to meet an absolute top-1,000 rule.

The existing exceptions for required names, Graduated Words, and correctly reinforced active Word Bank words remain. Chapter Check Complex Words remain in `retainedWords` so questions can assess their source meaning.

An additional retained word must be individually listed in `retainedWords` and documented in `retainedWordEvidence`:

```json
{
  "word": "advice",
  "originalSentenceIndex": 0,
  "quote": "my father gave me some advice",
  "reason": "Preserves that the father's words were guidance for Nick."
}
```

Use the exact source word form and a short exact quote from the indexed original sentence. Explain the specific detail, distinction, relationship, or meaning a simpler replacement would lose. Prefer simpler wording when equally faithful. A source word's mere presence or unfamiliarity is not a reason to retain it. Do not automatically exempt all original vocabulary. No invented words, wildcard lists, inferred inflections, or blanket unknown-word waiver.

One citation attests each word for the Chapter. That form may be used only in output mapped to an original sentence containing the word. Bounded rewrite passages receive the relevant documented words; their local validation derives matching local source citations without changing the stored global evidence. New exceptions do not become Chapter Check targets or Word Bank entries.

Ingestion checks each citation and reason. Generation and stored-artifact validation reject undocumented retained words, invalid citations, and unlisted out-of-target words. Legacy policies containing only Chapter Complex Words remain valid without the optional evidence field. Policy evidence travels with content; the immutable Chapter Version/Check format, identity, and fidelity digest are unchanged.

Sentence limits, complete ordered source coverage, names, Graduated Words, reinforcement, Key Point evidence, and Chapter Check gates still apply. A separate fidelity review must approve the exact text and Check before generator readiness; a source citation alone does not prove faithfulness or justify the exception. Human prose/Check review remains required before import. The earlier editorial candidate with 66 documented losses is diagnostic, not an approved Chapter.

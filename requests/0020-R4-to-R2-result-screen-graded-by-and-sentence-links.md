---
id: 0020
from: R4
to: R2
status: open
issue: "#12"
created: 2026-10-17 21:44
updated: 2026-10-17 21:44
---

## Need

Two changes in `src/reading/ResultScreen.tsx` to close #12's last acceptance boxes:

1. Replace the fixed "Answers graded by OCI Generative AI." with `grading.basis.gradedBy` (PR #47): "oci-generative-ai" → "Answers graded by OCI Generative AI.", "stand-in" → something honest like "Answers graded by word match (OCI Generative AI was unavailable)."
2. "Missed questions link to their sentence": each "Worth another look" item has `rereadSentenceIndex` (a `Sentence.index` in this Chapter Version, null when the answer got it). Make it a link or button that takes the Reader to that sentence.

## Why

#12 acceptance: "Result screen shows the basis (accuracy, check score, flags) and the OCI service that graded it" and "Missed questions link to their sentence". The data is already in the answers response (#37); the screen is yours.

## Proposed change

1. One line, once #47 is on `dev`.
2. Your call on the UX: scroll to and highlight the sentence in the Chapter text above, or show the sentence inline under the feedback. The response carries the index only. The page already has the Chapter Version, so the sentence text is `version.sentences.find((s) => s.index === i)`.

## Updates

- 2026-10-17 21:44 R4: opened.

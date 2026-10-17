# 10: AI grading: one Grading Result per Chapter

**Role:** R4 · **Priority:** P0

**What to build:** Submitting the Chapter Check grades each answer 0–2 with OCI Generative AI, then a pure combiner merges question grades, read-aloud accuracy, and Flagged Words into a score, a Grading Result (Fully understood / Partly understood / Struggled), the Barely Passed flag, and missed words. The Reader sees the result, what it was based on, and feedback that links each miss to the sentence that answers it.

**Blocked by:** 07 Flag words and hear them: tap a word to flag it, see its meaning, hear it, 09 Chapter Check after the Chapter

**Status:** ready-for-agent

- [ ] Combiner is pure and tested at every threshold, with and without a read-aloud summary
- [ ] Session Result saved with Read-aloud Misses, answers, and Grading
- [ ] Result screen shows the basis (accuracy, check score, flags) and the OCI service that graded it
- [ ] Missed questions link to their sentence

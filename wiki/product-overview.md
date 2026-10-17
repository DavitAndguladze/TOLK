# Product overview (working draft)

Sources: [[raw/initial-pitch]], [[raw/challenge-3-ai-that-strengthens-learning]]

## One-liner (draft)
A read-aloud app that listens word by word, measures how you read, and re-levels the vocabulary of the same story so every reader can read it — and stretch toward harder words.

## North star (ADR-0005)
Reading comprehension. Word-by-word scoring is only an input to choose the Level; every progress metric the Reader sees is about understanding.

## Core loop (draft, pending interview)
1. Learner picks a story.
2. Story is shown at the learner's current level.
3. Learner reads aloud; app tracks each word live.
4. App scores the reading and updates the learner's profile.
5. Upcoming text is re-leveled up or down.
6. Learner's chosen practice words get woven into the text.

## Tensions found so far
- Stated goal is **comprehension**, but reading aloud mainly measures **decoding/fluency**. Need an explicit comprehension signal. → [[open-questions]]
- "Same story" vs "inject my keywords": keyword injection may force plot changes.
- "Harry Potter": copyrighted text can't be ingested/rewritten for a demo.
- Real-time rewriting mid-sentence would be jarring; adapt granularity TBD.
- ASR tends to auto-correct misread words → can hide the very errors we're grading.

See [[judging-fit]] for how this maps to the rubric.

# Three visible Pillars; supersedes ADR-0005

Status: superseded by ADR-0009 (2026-10-17); it superseded ADR-0005

The team's scope doc (raw/scope-and-aim-2026-10-17.md) makes the app assess and show three Pillars — Fluency, Vocabulary, Comprehension — each with its own Track, instead of showing only comprehension. Fluency becomes a visible Track again (level, trend, words to practice), but only from Read-aloud Mode; Silent Mode pauses it. Comprehension stays the headline for Oracle's judging ("understanding, not task completion"). Still true from ADR-0005: raw audio is never stored and there is no audio-replay feature; only per-word results are kept.

## Consequences
- Each Pillar Level uses the same 1–5 scale as text Levels, which answers the doc's open question on scales.
- The next Chapter's Level comes from the Vocabulary and Comprehension Pillar Levels; fluency only steps a Level down between Pages when the Reader is struggling with words aloud.
- "Scene" and "Comprehension Check" are renamed Chapter and Chapter Check (three questions + Chapter Words).

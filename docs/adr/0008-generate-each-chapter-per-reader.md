# Generate each Chapter Version per Reader, one Level step at a time; supersedes ADR-0001

Status: accepted (2026-10-17) — supersedes ADR-0001 and the D18 Level table

The team's flow (raw/reading-app-flow-2026-10-17.md) rewrites Chapter N+1 on the fly for each Reader from four inputs: the original text of Chapter N+1, the Chapter Version just read (the baseline), the Grading Result, and the Word Bank. The new version is never more than one Level from the baseline. This replaces pre-generating every Page at 5 Levels, because the Word Bank makes every Reader's text different. The ladder is now L1 (most simplified) to L5 (the author's original). There is no Level above the original.

## Consequences
- Generation starts the moment the Chapter Check is submitted and runs while the Reader sees their result, so the latency is hidden.
- Chapter 1 is served at L1 for every Reader. That L1 version is generated once per Book and shared, since there is no Word Bank yet.
- The demo keeps a pre-generated fallback version of Gatsby Chapters 2–3 at each Level, used if a live generation fails or takes longer than ~20s.
- A validator rejects output that jumps more than one Level, changes names, or drops a Key Point.
- Levels change only between Chapters, never mid-Chapter.

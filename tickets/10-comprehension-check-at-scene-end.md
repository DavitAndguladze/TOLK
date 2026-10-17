# 10: Comprehension Check at a Scene end

**Role:** R4 · **Priority:** P0

**What to build:** At the end of a Scene, the app asks one book-club-style question aloud, the Reader answers aloud, OCI Generative AI grades 0–2 against the Scene's Key Points, and a one-line spoken reaction plays. No score is shown mid-story; skipping is allowed (D11).

**Blocked by:** 04 Leveling pipeline produces Gatsby at 5 Levels, 05 Content in the database, demo Reader signs in, 07 Voice out: OCI TTS, tap-to-hear, hesitation prompt

**Status:** ready-for-agent

- [ ] Question is spoken by TTS; answer is transcribed
- [ ] Grade, feedback, Key Points hit, and transcript are stored as a CheckResult
- [ ] Result feeds the level rule for the next Page
- [ ] Grader tested on a handful of fixed answers (got it / partial / missed)

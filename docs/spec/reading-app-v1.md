# Spec: Reading app v1 (HackTN26)

Status: ready-for-agent · Aligned to the team's Reading App Flow (raw/reading-app-flow-2026-10-17.md), which supersedes the earlier scope-doc alignment · Vocabulary: CONTEXT.md · Decisions: docs/adr/ (ADR-0008, ADR-0009 are the core)

## Problem Statement

Reading takes more effort than watching a video, and nothing pulls most people to a book except an assignment. Readers who struggle get locked out of the classics everyone talks about. When they do try, they hit the author's full vocabulary on page one and quit. Existing AI reading tools mostly read or summarize for the reader instead of building their skill.

## Solution

An adaptive read-aloud app where each Chapter of a Book is rewritten for that Reader, one Level at a time, moving closer to the author's original text.

- The Reader signs in, browses or searches the Library, and picks a Book. It opens at their current Chapter.
- Chapter 1 is served at L1 (most simplified) for everyone. There is no placement test; Chapter 1 does the calibrating.
- The Reader reads the Chapter aloud. Speech is compared word by word against the text to catch mispronounced or skipped words. The Reader can tap any word they don't know to flag it.
- After the Chapter, a short Chapter Check asks about its Key Points (plot) and Complex Words.
- AI grading combines Read-aloud Misses, Chapter Check answers, and Flagged Words into one Grading Result: Fully understood, Partly understood, or Struggled. Missed and flagged words go to the Word Bank.
- While the Reader sees their result, OCI Generative AI writes Chapter N+1 at the next Level, never more than one step from the last. It keeps plot, names, and tone, reinforces Word Bank words with context clues or inline definitions, and leaves Graduated Words in their original form.
- The progress view shows the Level Line climbing toward L5 (the author's original), Words Learned, and the current Word Bank.

Every AI call runs on OCI: Speech (listening, text-to-speech), Generative AI (rewriting, question generation, grading), and Vision for the glasses stretch goal. The AI never reads or answers for the Reader.

## User Stories

### Entry
1. As a new Reader, I want to create an account, so that my Level and Word Bank are saved.
2. As a returning Reader, I want to sign in and pick up where I left off, so that I don't lose progress.
3. As a Reader, I want to browse the Library's Books, so that I can find something I'd like to read.
4. As a Reader, I want to search the Library by title or author, so that I can find a specific Book fast.
5. As a Reader, I want each Book in the Library to show my current Chapter and Level for it, so that I know where I stand.
6. As a Reader, I want choosing a Book to open it at my current Chapter, so that I resume without hunting.
7. As a new Reader, I want to start reading immediately with no placement test, so that the app feels like reading, not testing.
8. As a new Reader, I want Chapter 1 served at L1, so that my first experience is approachable.

### Reading aloud
9. As a Reader, I want to read the Chapter out loud while the app follows along, so that I get credit for reading myself.
10. As a Reader, I want each word to light up as I say it, so that I know the app is listening.
11. As a Reader, I want mispronounced or skipped words marked gently, so that I notice them without feeling judged.
12. As a Reader, I want the Chapter split into short, readable chunks on my phone, so that I don't lose my place.
13. As a Reader, I want to pause and resume reading aloud, so that interruptions don't break the session.
14. As a Reader, I want to tap a word to hear how it's pronounced, so that I can say it correctly.
15. As a Reader, I want my voice never stored, so that reading aloud feels safe.

### Flagging words
16. As a Reader, I want to tap any word I don't know to flag it, so that the app helps me learn it.
17. As a Reader, I want a flagged word to show a short in-context meaning, so that I can keep reading.
18. As a Reader, I want to unflag a word I tapped by mistake, so that my Word Bank stays accurate.

### Chapter Check
19. As a Reader, I want a short Chapter Check right after the Chapter, so that I check my understanding while it's fresh.
20. As a Reader, I want questions about the Chapter's plot, so that I'm checked on what happened.
21. As a Reader, I want questions about the Chapter's hardest words, so that I'm checked on vocabulary in context.
22. As a Reader, I want to answer by speaking or typing, so that I can use whichever fits the moment.
23. As a Reader, I want questions to be about this Chapter Version's text, so that they match what I actually read.

### Grading and result
24. As a Reader, I want one clear result per Chapter (Fully understood, Partly understood, or Struggled), so that I know how I did.
25. As a Reader, I want to see which words I missed, so that I know what's going into my Word Bank.
26. As a Reader, I want feedback on each question I got wrong, with the sentence that answers it, so that I can re-read.
27. As a Reader, I want to see why my next Chapter is at its Level (up, same, or down), so that the adaptation feels fair.
28. As a Reader who barely passed, I want the next Chapter to stay at the same Level, so that I consolidate before climbing.
29. As a Reader who struggled, I want extra support in the next Chapter (inline definitions), so that I can recover.
30. As a judge, I want to see what the grade was based on (misses, answers, flags) and which OCI service graded it, so that the AI is transparent.

### Next-chapter generation
31. As a Reader, I want the next Chapter ready by the time I finish reading my result, so that there's no waiting.
32. As a Reader, I want the next Chapter to be at most one Level away from the last, so that there's never a sudden jump.
33. As a Reader, I want plot, names, and tone kept faithful to the author, so that I'm really reading the Book.
34. As a Reader, I want my Word Bank words reused in the next Chapter with context clues or definitions, so that I see them again in an easier setting.
35. As a Reader, I want words I've graduated to appear in their original form, so that I keep moving toward the author's text.
36. As a Reader, I want reaching L5 to be celebrated as "now reading the original", so that I feel the payoff.
37. As a Reader, I want to stay at L5 once I've reached it, so that I keep reading the real Book.

### Word Bank and progress
38. As a Reader, I want a Word Bank listing every word I haven't mastered yet, so that I know what I'm working on.
39. As a Reader, I want each Word Bank word to show where it came from (missed or flagged) and how often I've seen it, so that I understand my gaps.
40. As a Reader, I want a word to graduate when I read or answer it correctly in a later Chapter, so that progress is earned.
41. As a Reader, I want a running Words Learned total and the words that graduated this Chapter, so that I see my vocabulary grow.
42. As a Reader, I want a Level Line showing my Level for each Chapter climbing toward L5, so that I see myself approaching the original.
43. As a Reader, I want a Streak for days I complete a Chapter Check, so that I'm pulled back daily.

### Demo
44. As a presenter, I want a demo Reader seeded with three Chapters of history (L1 → L2 → L3), so that the Level Line has a story on stage.
45. As a presenter, I want a one-command demo reset, so that rehearsals are repeatable.
46. As a presenter, I want a pre-generated fallback for the next Chapter at each Level, so that a slow or failed generation doesn't break the demo.
47. As a presenter, I want the listening engine switchable by flag (OCI realtime, browser speech, mock), so that the demo survives network trouble.

## Implementation Decisions

**Platform.** One Next.js app (UI plus route handlers), mobile-first PWA, deployed as one container on an OCI Compute VM behind Caddy for HTTPS (ADR-0004). Accounts use Better Auth. Data lives in managed OCI Database with PostgreSQL (ADR-0006). Raw audio is never stored.

**Modules.**
- **Library and Book ingestion (offline).**
  - Splits public-domain Books (ADR-0003) into Chapters with original text (L5).
  - Extracts 3–5 Key Points per Chapter and detects its Complex Words with in-context meanings before anyone reads.
  - Generates the shared L1 version of Chapter 1.
  - Seeds Gatsby first; a second Book is P1.
- **Listening.**
  - One interface: start on a Chapter Version chunk's tokens; emit word, hesitation, and chunk-complete events; stop with a read-aloud summary containing per-word results and Read-aloud Misses.
  - Engines are OCI Speech realtime, browser speech, and mock, chosen by flag.
  - Speech is aligned to the expected text by a pure function (ADR-0002).
- **Chapter Check.**
  - Built per Chapter Version: 2–3 Key Point questions plus 1–2 Complex Word questions, generated when the Chapter Version is generated, so the check opens instantly.
  - Answers are spoken (transcribed) or typed.
- **Grading.** Two parts:
  - **AI part:** OCI Generative AI grades each answer 0–2 with a one-line feedback and the sentence that answers it.
  - **Deterministic part (pure):** combines question grades, read-aloud accuracy, and Flagged Words into a score from 0 to 100, the Grading Result, the Barely Passed flag, and the missed-word list.

    Starting thresholds, tunable:
    - Weights: Chapter Check 70%, read-aloud accuracy 20%, Flagged Words 10%. Without a read-aloud summary, the Chapter Check weighs 90%.
    - Score ≥ 80 is Fully understood; 80–87 is Barely Passed.
    - 50–79 is Partly understood.
    - Below 50 is Struggled.
- **Level rules (pure).** Map the current Level and the Grading Result to the next Level and the Reinforcement style.

  | Grading Result | Next Level | Reinforcement |
  |---|---|---|
  | Fully understood | Up one (cap L5) | Plain reuse |
  | Barely Passed | Same | Plain reuse |
  | Partly understood | Same | Context clues |
  | Struggled, score ≥ 35 | Same | Inline definitions |
  | Struggled, score < 35 | Down one (floor L1) | Inline definitions |

  The output includes a Reader-facing reason line.
- **Word Bank (pure).** Applies a Session Result to the bank:
  - Add Read-aloud Misses and wrong Complex Word answers with source "wrong", and Flagged Words with source "flagged".
  - Increment times seen when a bank word appears in a new Chapter Version.
  - Graduate a word when, in a later Chapter, it appeared and was read correctly aloud, or its Complex Word question was answered correctly, and it wasn't flagged again.
  - Output the updated bank, this Chapter's Graduated Words, and the Words Learned total.
- **Chapter generator.**
  - Inputs: Chapter N+1 original text, the Chapter N version (baseline) with its Level Score, the Level decision, active Word Bank words with their Reinforcement style, and Graduated Words.
  - OCI Generative AI measures the baseline-to-original gap (sentence length, vocabulary, figurative language) and rewrites Chapter N+1 at the target Level.
  - Output: text, sentences mapped to original sentences, tokens, the reinforced-word list, a Level Score, and the Chapter Check for this version.
  - A validator rejects output that jumps more than one Level, changes character names, drops a Key Point, or leaves a Graduated Word simplified; one retry, then the demo fallback (ADR-0008).
  - Generation starts when Chapter Check answers are submitted; the client polls until the version is ready.
- **Progress.** Level Line (Chapter number, Level, Grading Result), Words Learned (total plus this Chapter's graduates), the active Word Bank, and the Streak.
- **AI gateway.** One fakeable interface over OCI:
  - rewrite chapter;
  - generate Chapter Check;
  - grade answer;
  - define word in context;
  - detect Complex Words and Key Points;
  - text-to-speech;
  - speech realtime token;
  - read text from image (glasses).

**API contract (route handlers; shapes in the shared types).**
- **Library:** list or search Books.
- **Reading:** open a Book at the Reader's current Chapter Version; get a Chapter Version (poll while generating); post a read-aloud summary; flag or unflag a word.
- **Chapter Check:** get it for a Chapter Version; post answers, returning the Session Result, Grading, Level decision, and next Chapter Version id with status.
- **Progress:** get progress for a Book.
- **AI services:** speech token; text-to-speech; Paper Page upload.

**Data (from the flow doc's proposed records).**
- **Reader:** account, current Book, current Chapter per Book.
- **Book, Chapter:** original text, Key Points, Complex Words.
- **Chapter Version:** Book, Chapter number, Level, Level Score, generated text, Chapter Check, reinforced words, baseline version id.
- **Session Result:** Read-aloud Misses, Chapter Check answers and score, Grading.
- **Word Bank entry:** word, source (wrong or flagged), times seen, graduated, graduated-at Chapter.

## Testing Decisions

- **What makes a good test:** it drives a module through its public interface with realistic inputs and asserts observable outputs only, never internal calls.
- **Seam 1, Grading + Level rules + Word Bank (one pure "chapter outcome" seam, most tests).** Given question grades, a read-aloud summary, and Flagged Words, assert:
  - the Grading Result, Barely Passed flag, and missed words;
  - the next Level and Reinforcement style;
  - the Word Bank after applying the session, Graduated Words, and Words Learned.

  Cover: every row of the level table; L5 cap and L1 floor; no read-aloud summary; a word flagged then graduated two Chapters later; a graduated word flagged again.
- **Seam 2, alignment:** expected tokens plus recognized words → per-word results and Read-aloud Misses. Cover correct, mispronounced, skipped, repeated, self-corrected words.
- **Seam 3, chapter validator:** reject a two-Level jump, a changed name, a dropped Key Point, and a simplified Graduated Word; accept a faithful one-step rewrite.
- **Seam 4, route integration:** against local Postgres with the AI gateway faked. Path: sign in → open Book → post read-aloud → flag a word → answer the Chapter Check → next Chapter Version ready one Level up → progress shows Level Line, Word Bank, Words Learned.
- **AI quality (evals, not unit tests):**
  - the grader against fixed answers per Chapter;
  - a human read of generated Gatsby Chapters 2–3 at each Level before the demo.
- **Prior art:** none yet. The shared mocks (Gatsby Chapter Version, mock listening, mock Chapter Check, Grading, Word Bank, progress) are the fixtures. Pure modules are built test-first.

## Out of Scope

- Placement test and Baseline Assessment.
- Level Picker and manual Level override (ADR-0009).
- Levels above the author's original.
- A Reader-entered Practice Words list (the Word Bank replaces it).
- Three separate Pillar Levels and Tracks.
- Daily Puzzle and Silent Mode (P2 stretch only).
- Friends, leaderboards, badges, and points.
- Monthly re-assessment.
- Licensed books.
- Storing or replaying audio.
- Native apps.
- Teacher or parent dashboards.
- Meta glasses paper-page reading stays a P2 experiment.

## Further Notes

**What changed from the scope-doc spec (17:40):**
- Per-Reader on-the-fly generation replaces pre-generated Leveled Pages (ADR-0008).
- One Grading Result plus the Word Bank replaces Pillar Levels and Tracks (ADR-0009).
- L5 is now the author's original.
- No Baseline Assessment or Level Picker.
- Levels change only between Chapters.

**Open, tunable at build time:** the score weights and thresholds above, the number of Chapter Check questions (default 3–5 total), and Chapter length per Book.

**Learner agency.** With no Level Picker, agency comes from choosing the Book, flagging words, and seeing why each Level was chosen. Re-adding a manual override later is a small change on top of the Level rules.

**Pitch angle.** "Each chapter is rewritten one step closer to the original." The Level Line climbing to L5 is the demo moment; Words Learned and the Word Bank prove learning, not task completion.

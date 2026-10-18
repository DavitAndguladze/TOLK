# Read-Aloud Leveling

An adaptive read-aloud app: each Chapter of a Book is rewritten one Level at a time, moving closer to the author's original text, based on how well the Reader understood the last Chapter.

## Content

**Book**:
A public-domain work in the Library, made of Chapters. Plot, names, and tone never change.
_Avoid_: Story, text, document

**Library**:
The catalog of Books a Reader can browse or search. Choosing a Book opens it at the Reader's current Chapter.
_Avoid_: Shelf, catalog page, store

**Chapter**:
One chapter of a Book as the author wrote it. Holds the original text, its Key Points, and its Complex Words.
_Avoid_: Scene, section, page

**Level**:
One rung on the 5-step ladder a Chapter is written at: L1 (most simplified) to L5 (the author's original text).
Under #41, a Level changes by at most one step using the last three distinct completed Chapters for the same Reader and Book at that Level, since the last actual Level change. Fewer than three holds; an average of at least 88 moves up, below 35 moves down. L1 and L5 are the bounds; L5 can move down.
_Avoid_: Difficulty, grade, Lexile

**Chapter Version**:
One Chapter rewritten for one Reader at one Level, generated on the fly from the previous Chapter Version, the Grading Result, and the Word Bank. It becomes the baseline for the next Chapter.
_Avoid_: Leveled Page, simplified text, rewrite

**Level Score**:
The stored measure of how far a Chapter Version sits from the original (sentence length, vocabulary, figurative language). The next generation compares against it.
_Avoid_: Difficulty score, readability

**Key Point**:
A plot point of a Chapter. Key Points are what Chapter Check questions target.
_Avoid_: Plot point, answer key, summary

**Complex Word**:
One of a Chapter's hardest words, detected from the Chapter text before the Reader starts. Chapter Check word questions target them.
_Avoid_: Vocab word, hard word

**Paper Page**:
A page of a physical book, photographed and turned into text, that the Reader reads. It has no Levels.
_Avoid_: Scan, photo page

## Reading session

**Reader**:
A person with an account who reads Books.
_Avoid_: User, student, learner

**Read-aloud**:
The Reader reading a Chapter Version out loud while the app compares speech word by word against the text.
_Avoid_: Dictation, voice mode

**Chunk**:
A short run of whole sentences from a Chapter Version, shown on one screen and read aloud in one listening session.
_Avoid_: Page, passage, section

**Read-aloud Miss**:
A word the Reader mispronounced or skipped while reading aloud.
_Avoid_: Error, mistake

**Flagged Word**:
A word the Reader tapped while reading to say they don't know it. It goes straight to the Word Bank.
_Avoid_: Lookup, bookmark, highlight

**Chapter Check**:
The short comprehension check after each Chapter, with questions on its Key Points and Complex Words.
_Avoid_: Quiz, assessment, test

**Grading Result**:
The one result per Chapter after combining AI-graded Chapter Check answers, Read-aloud Misses, and Flagged Words: Fully understood, Partly understood, or Struggled. Its score contributes to the three-Chapter Level decision; the latest result sets immediate Reinforcement (#41).
_Avoid_: Score, grade, pass/fail

**Barely Passed**:
A Fully understood Grading Result whose score is 80–87. It uses plain Reinforcement; the three-Chapter average determines the next Level (#41).
_Avoid_: Borderline, close call

**Session Result**:
The stored record of one Chapter read: Read-aloud Misses, Chapter Check score, and Grading Result.
_Avoid_: Attempt, run

**Chapter Completion**:
The saved Session Result, Level decision, Word Bank update, and next Chapter Version reference for one Reader and served Chapter Version. Retries return this same outcome without applying progress again.

## Words

**Word Bank**:
The Reader's words not yet mastered. Words enter when the Reader got them wrong (Read-aloud Miss or Chapter Check) or flagged them. The next Chapter Version reinforces them.
_Avoid_: Practice words, vocab list, keyword list

**Reinforcement**:
How a Chapter Version reuses a Word Bank word: plain reuse, a context clue, or an inline definition, depending on the Grading Result.
_Avoid_: Weaving, injection

**Graduated Word**:
A Word Bank word the Reader answers fully correctly in a contextual vocabulary question in a later Chapter, without flagging it again in that Chapter. Correct pronunciation alone does not qualify. It leaves the Word Bank and appears in its original form from then on. See spec amendment #41.
_Avoid_: Mastered, learned word

**Words Learned**:
The running total of Graduated Words for a Reader.
_Avoid_: Word count, vocabulary score

## Progress

**Level Line**:
The Level of each Chapter the Reader has read, shown as a climb toward L5. The demo moment.
_Avoid_: Progress bar, chart

**Streak**:
The count of consecutive days the Reader completed at least one Chapter Check.
_Avoid_: Login streak, chain

# Progress view — comprehension-first design (draft for R5-Q2)

Principle (ADR-0005): show understanding, never speed. Every number traces back to a Comprehension Check the Reader answered aloud.

## Where it appears
- **Session-end card**: shown when the Reader stops; 3 lines max.
- **Progress tab**: per Reader, across Stories.

## Components
### 1. Understood Level (headline)
The highest Level at which the Reader's last 3 Comprehension Checks were at least 2 "got it". Shown per Story and overall, with a trend across sessions.
- Different from the Level they *read* at. "Read at L5, understood at L4" is honest and motivating.
- Pitch line: "Not how fast you read. How high you understand."

### 2. Scene Map
The Story as a row of tiles, one per Scene. Tile color = got it / partial / missed / skipped; tile label = Level read at.
Tap a tile: the question, the Reader's answer transcript, the one-line AI feedback, the Key Points it was graded against, and **Reread this scene** (opens it one Level lower).

### 3. How this was graded (transparency)
On every check result: "Graded by OCI Generative AI against these Key Points: …". This answers the rubric's "make clear what informs AI outputs".
P2: **Dispute** button → result becomes "partial", logged, and the Reader's call stands (Reader is the authority, D12).

### 4. Practice Words
Each word: Added → Seen in N of 3 Stories → Used in an answer → Mastered, with the Reader's own sentence when they used it. (P1 shows the list; P2 shows the full path.)

### 5. Recap growth (P2)
Session-end retell graded against the Scene's Key Points: "Your Chapter 1 recap named 2 of 5 key events last week, 4 of 5 today."

## Data it needs
- Per Scene: 3–5 **Key Points** generated offline by the leveling pipeline (R3), human-checked. They are the grading rubric for checks and retells.
- Per check: Scene, Level read at, question, answer transcript, grade 0–2, feedback line, skipped flag.
- Per Practice Word: Stories seen in, answers used in.
- Fluency data (word results) feeds only the Level rule; it never appears here.

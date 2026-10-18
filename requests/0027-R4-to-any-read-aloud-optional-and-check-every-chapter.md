---
id: 0027
from: R4
to: any
status: open
issue: "#16"
created: 2026-10-17 23:24
updated: 2026-10-17 23:24
---

## Need

Three product rules from R4's user. Please keep them true in your area, and claim the one change that's needed (item 2).

1. **Reading aloud stays optional.** A Reader can always finish a Chapter without a microphone. The "Read silently" switch (#38) stays, and nothing may require read-aloud to reach the Chapter Check or the result. Silent Readers are graded 90/10 (Chapter Check / Flagged Words), and the result shows "Read aloud: Skipped".
2. **Tell Readers that reading aloud makes grading more accurate. (Change needed: R2.)** Next to the Read aloud / Read silently choice on the reading screen (`src/reading/ReadingScreen.tsx`), show a short line such as: *"Reading aloud is optional. It helps us grade your reading more accurately."* It should be visible before the Reader starts, not only after they switch to silent, and stay calm, not a warning. Wording is R2's call.
3. **Every Chapter ends with a Chapter Check (the assessment after each lesson), read aloud or silent.**
   - **Today:** true on dev, checked in headless Chrome at 390px. A silent read of L4 → Finish chapter → 5 OCI-written questions (3 Key Point + vulnerable, criticizing) → graded result. Silent L1 → 3 Key Point questions. No console errors.
   - **R3 (#14):** every generated Chapter Version must come with its Chapter Check through `generate(chapter, version)` (0016), including fallbacks.
   - **R2:** keep the `chapterCheck` slot after the Chapter in every mode, and in the real-listening UI (#55).
   - **R4:** keeps generation working for every Version: OCI-written with a deterministic fallback, so a Check always exists.

## Why

The user wants read-aloud as an aid, not a gate, and wants every lesson to end with a comprehension check (CONTEXT.md: Chapter Check). Item 2 explains why read-aloud is worth trying: read-aloud accuracy carries 20% of the score, and without it the Chapter Check weighs 90%.

## Proposed change

- R2 claims item 2, a small copy change in ReadingScreen.
- Everyone treats items 1 and 3 as acceptance rules for #16 (Golden Path). If a change of yours would break either, say so here first.

## Updates

- 2026-10-17 23:24 R4: opened.

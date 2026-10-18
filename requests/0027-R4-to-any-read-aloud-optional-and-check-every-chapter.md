---
id: 0027
from: R4
to: any
status: done
issue: "#16"
created: 2026-10-17 23:24
updated: 2026-10-17 23:30
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

- 2026-10-17 23:27 R2: claiming item2 copy in the existing #55 slice; read-aloud remains optional and the Chapter Check slot stays reachable in every mode. No change to grading weights or module ownership.

- 2026-10-17 23:29 R3/R5: acknowledged. Every generated or fallback artifact must carry its matching validated Check, and R5's wrapper preserves the Chapter Check slot in silent and read-aloud modes. No microphone gate is introduced. R2 retains the requested choice copy. Full seed reliability is still being verified; generated-check unit tests are not claimed as deployed acceptance.

- 2026-10-17 23:30 R2: item2 delivered in #55 c766eb1/source4a47d86: "Reading aloud is optional. It helps us grade your reading more accurately." appears before the initial choice, including silent selection; demo disclosure remains separate. Footer clearance increased for narrow screens. Every mode retains Chapter Check access; no grading-weight changes. Browser checks and Standards/Spec clear; all262 tests/types/webpack build pass. This marks the requested copy slice done, not deployed Golden Path acceptance.

---
id: 0051
from: R2
to: R4
status: in-progress
issue: "#95"
created: 2026-10-18 07:40
updated: 2026-10-18 07:55
---

## Need

Please consume/review the forthcoming #95 controls for #101 Chapter Check UI in your folder. R2 is publishing direct imports under @/reading/ui: Button, Card, SelectCard, ProgressBar and Dialog. R2 will not edit src/comprehension.

## Why

Shared native controls unblock your one-question-per-screen work and R2's later #102 results. The human's phone references use navy text, blue actions and generous rounded controls.

## Proposed change

Button keeps native button props and adds variant primary/secondary, loading/fullWidth. SelectCard keeps native radio/checkbox input behavior with title/description and optional correct/incorrect feedback; pass actual graded feedback only. ProgressBar takes completed value, max and an accessible label. Dialog uses native modal focus/Escape behavior with open/onClose/title/children. R6 request0050 owns global @theme/PhoneFrame mount. Exact PR/commit follows after keyboard/390px verification; review interfaces before adopting. For #102 later, please identify the existing safe question/Reader-answer data source rather than requiring invented result counts or a new grader.

## Updates

- 2026-10-18 07:44 R2: controls published in draft #108 at52579e0: https://github.com/DavitAndguladze/TOLK/pull/108 . 496tests/32DBskips, types/webpack build pass; Standards/Spec clear. Native keyboard selection and Dialog Escape/focus verified in actual browser. Ready for your interface review/adoption; no Check implementation claim. Full #95 still waits for R6 app integration0050.

- 2026-10-18 07:40 R2: implementation/typecheck in progress on r2/design-system; no R4 code edits or PR acceptance claimed.
- 2026-10-18 07:55 R4 (David): reviewed #108's control interfaces against #101 (one question per screen). They fit; R4 will adopt them in #101. Three asks before or with merge:
  1. **SelectCard incorrect label:** "Try again" implies a retry, but #101's flow is Check → feedback → Continue (no second try). Please use a neutral label such as "Not quite", or let the caller pass the label. Passing feedback per card works for showing the Reader's wrong pick plus the right answer (feedback="correct" on the right card). After Check, R4 sets disabled on the group (it passes through ...input already, good).
  2. **Dialog actions:** the exit confirmation needs two actions ("Keep going" / "Leave"). Dialog always renders its own Close button, so please add an optional actions slot, or render the built-in Close only when no actions are given.
  3. **ProgressBar:** fine for "Question 2 of 5" (value/max/label, real progressbar role). Optional: let callers hide the % text (showPercent={false}), since a question counter plus a % reads twice.
  Button (primary/secondary, loading while a per-question grade is pending, fullWidth for the bottom action) and Card are good as they are.
- 2026-10-18 07:55 R4 (David) → R2, **data source for #102 (result screen)**, no new grader needed:
  - The answers response (Api["POST /api/checks/[checkId]/answers"].res, returned as-is by #76's completeChapter) has session.grading: result, score (0–100), barelyPassed, basis {readAloudAccuracy|null, checkScore, checkMax, flaggedCount, gradedBy}, missedWords, and questionGrades[] {questionId, grade 0|1|2, feedback, rereadSentenceIndex, rereadSentence}. Also session.readAloudMisses, decision (from/to/reason/explanation), wordBank, nextVersionId.
  - **"x of y":** count questionGrades with grade === 2 as "got it", grade 1 as "partly", grade 0 as "missed", out of questionGrades.length. Don't present partly as correct. For a points view use basis.checkScore / basis.checkMax.
  - **Question text and the Reader's own answers** aren't in the response, but ChapterCheck (R4) already has both: the served Check (questions[].prompt, choices, word) and the submitted answers. R4 will pass { check, answers } into ResultScreen alongside the response, as part of #101. Match by questionId.

- 2026-10-18 08:08 R2: claiming your three requested adjustments now on r2/check-controls from merged dev7fa93cc: neutral incorrect label, Dialog actions slot, and optional ProgressBar percentage. #108 and root mount111 are confirmed merged on GitHub. Will return the exact PR/interface after browser/type/test checks; no R4 folder edits.

- 2026-10-18 08:16 R2: all three asks delivered in draft PR114 atc5790fa, https://github.com/DavitAndguladze/TOLK/pull/114 . Incorrect label is Not quite; Dialog actions replaces default Close only when supplied (callers control open); ProgressBar showPercent defaults true and false hides only visual percentage. 533tests/32DBskips, types/webpack build pass; Standards/Spec clear. Actual browser verified Keep going/Leave handlers, Escape/focus return, hidden percent with accessible2/5, no console warnings/errors. Ready for R4 adoption/review; no R4 folder edits or merge/deployment.

- 2026-10-18 13:24 R4 (David): thanks, #114 covers all three. #101 is PR #119 (stacked on #112) and uses today's merged controls. Once #114 merges, R4 will switch to the "Keep going"/"Leave" actions and `showPercent={false}`. Passing { check, answers } into ResultScreen waits on #102 adding those props.

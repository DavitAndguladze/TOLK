---
id: 0051
from: R2
to: R4
status: open
issue: "#95"
created: 2026-10-18 07:40
updated: 2026-10-18 07:40
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

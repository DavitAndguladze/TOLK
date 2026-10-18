# Word help while previewing a Level

R2 request 0084 F3. Based on dev `87f6ebf`; local branch `r5/preview-word-flags`.

Opening a word in a preview Level used to auto-save a flag against that preview Version and promise Word Bank inclusion. Chapter completion correctly consumes the assigned Version's flags, so the promise was false.

The R5 wrapper now passes `canFlag={!previewing}` to WordSheet. The sheet gates both automatic and manual flagging, hides the flag action in previews and says to return to the assigned Level to flag words. Meaning lookup and pronunciation controls remain available. The optional prop defaults to true, preserving the WordsDemo caller. No data, route, grading, reading UI or shared-type changes.

## Verification

- Actual app in integrated Browser with a disposable authenticated Reader and fresh local MySQL database, using normal migrations and existing shared sample Versions. No custom QA page or provider replacement. OCI disabled for this flag-only check.
- Before the fix, selecting L5 and opening `vulnerable` created the L5 token-5 flag; the database assertion requiring zero preview flags failed. The UI incorrectly promised Word Bank inclusion. Removed this disposable flag through Unflag before the fixed run.
- After reload, the L5 preview restored. Opening the same word returned its prepared meaning, retained Hear it, showed the preview notice and exposed no Flag/Unflag control. No preview flag writes appeared after reload; the same MySQL assertion passed with zero rows.
- Returning to assigned L1 and opening `judge` saved exactly one L1 token-21 flag; Unflag removed it. Both database assertions passed, with no L5 flags.
- Desktop 1280×720 and mobile 390×844: no horizontal overflow. Keyboard reached Hear it, Escape closed the sheet and focus returned to the word. Screenshots are ignored local `.scratch/preview-flags-{desktop,mobile}.png`.
- `npm run typecheck` and `git diff --check` passed. Runtime checks used `next dev --webpack`; no unchanged full suite or production build was repeated for this component gate.

The local database assertion script is `.scratch/preview-flags-verify.mjs`. Existing preview flags are neither moved nor deleted by this change. Real OCI playback, microphone transcription, live grading and production deployment are separate acceptance work under #168 / requests 0081–0083.

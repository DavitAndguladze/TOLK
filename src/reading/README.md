# Reading UI integration

The ReadingScreen uses `createListeningSource()` from `@/listening/client`, honoring the existing NEXT_PUBLIC_LISTENING_ENGINE build flag. Default mock playback is labelled “Demo listening”; real engines show “Connecting…” until Start resolves, then “Listening”. No automatic engine fallback is added.

`createReadingAttempt({ id, tokens }, source)` wraps the existing ListeningSource for one Reader attempt. Completed-Chunk or Pause summaries are committed once. A new Start waits for the previous Stop; Stop cancels a queued resume. `finish()` awaits cleanup, merges fragments across every Chapter Version token with R1's helper, and returns null for no scored evidence. Recognition partials are never appended as separate fragments. A reread clears old marks only after new scored evidence arrives; failed starts preserve previous results.

The reading reducer clears earlier outcomes on pending revisions and moves the current highlight back when necessary. Pause and Finish preserve unread words as pending. Chapter completion still leads to R4's Chapter Check.

Before the Chapter Check opens, `ChapterReadAloud` confirms the existing POST `/api/chapter-versions/[versionId]/read-aloud` contract. It sends the full merged summary with same-origin credentials and the existing `tolk-reader-session` / X-Reader-Session convention shared by ChapterCheck and WordSheet. R6 owns authentication and Reader + Version persistence. HTTP success plus JSON `{ ok: true }` is required to say saved; the request times out after ten seconds. No audio is sent or stored by this UI.

Silent reading skips the save entirely. If a save cannot be confirmed, the Reader can retry or choose Continue to Chapter Check. No saved-results claim is made in that path. Until R6's route lands, the current dev 404 follows this same visible recovery path, rather than blocking the Chapter Check or pretending to save. R4 still determines the grading basis from actual server state.

Scope: src/reading only, no shared types, server routes or other role code edits. R2 is being assisted by the R1 agent at the human's explicit request (comms 0010). Word taps/WordSheet and real progress data remain separate integration slices.

Checks: public readingReducer cases, ListeningSource/attempt lifecycle using the actual shared mock adapter, and summary HTTP interface with the network boundary faked. Live OCI adapter evidence remains in src/listening; R2 integration does not claim deployed/phone or authenticated persistence verification until R6 is ready.

# R5 live Words handoff

## Implemented

`ReadingWithWords` wraps R2's existing `ReadingScreen`, supplies flags and word taps, and accepts serializable `chapterVersionId`, `chunks`, and the `chapterCheck` React slot. The server parent should key it by authenticated Reader id plus Version id, including shared Chapter 1, so account changes remount and refresh saved flags. Word taps stay disabled during active listening through R2's existing behavior. A failed flag load permits reading and offers retry; it does not pretend the bank is empty.

The sheet saves a flag separately from looking up its meaning. Meaning retries never reflag a word the Reader removed. Flag changes display only after confirmed success. Closing the sheet cancels lookup/playback and releases generated audio. OCI failures offer retry; browser speech is an explicit, labeled fallback.

`words/server.ts` exports:

- `defineWord(version, tokenIndex, chapter)` → `{ meaning, source }`, with source `oci-generative-ai`, `chapter`, or `unavailable`. It calls R4's existing JSON-mode Chat against the tapped token's actual Version sentence, with an eight-second deadline. Malformed/failed replies fall back to a labeled prepared Chapter meaning, or an honest unavailable message. Invalid token references throw `RangeError`.
- `synthesizeWord(text)` → MP3 `ArrayBuffer`, or `null` when OCI configuration is missing. It uses installed `oci-common` signing and native `fetch`; no new dependency. It only accepts one word (maximum 80 characters), with a 15-second service timeout. `isSpeakableWord` in `oci-speech.ts` is available for HTTP validation.

## App/R6 contract

All routes use the authenticated cookie Reader. Never trust a client Reader id, token word, or supplied sentence. Resolve a ready, accessible Version and its matching Chapter server-side.

- `GET /api/chapter-versions/[versionId]/flags` → `{ flags: FlaggedWord[] }`, durable Reader + Version scope.
- Existing flag POST → `{ flagged, meaning: string }`; use the cheap prepared `meaningOf` here. The client separately requests live meaning. POST must be idempotent for a Reader + Version + token.
- Existing flag DELETE → `{ ok: true }` after durable confirmation.
- `GET /api/chapter-versions/[versionId]/words/[tokenIndex]/meaning` → `defineWord` result. Use `Cache-Control: private, no-store`.
- `POST /api/tts`, body `{ text: string }` → audio bytes, `Content-Type: audio/mpeg`, `Cache-Control: private, no-store`. Reject invalid word input with 400, missing service configuration with 503, provider failure with 502. Do not return provider diagnostics or credentials.

Parent owns HTTP handler tests and app mounting; R6 owns durable flags. The old process-local flag store remains untouched and is not a persistence implementation for this slice.

## Evidence, 2026-10-17 America/Chicago

- Actual OCI Speech in `us-chicago-1`: “advice”, valid MP3 header, 3,039 bytes, 488 ms. This proves synthesis, not audible browser playback.
- Actual OCI Generative AI: ordinary token “father” in “When I was young, my father gave me advice.” returned “A father is a male parent who has a child.” with source `oci-generative-ai`, 357 ms. A separate live “advice” lookup also passed.
- Both probes loaded the existing ignored `.env.local` by path. No credential copies or output were produced.
- Typecheck passed. Six focused Words test files, 32 tests passed: meaning/context/failure/timeout, flag hydration/save confirmation/stale-response rejection, speech input validation, explicit fallback behavior, audio cancellation, and existing Word Bank behavior.
- Bounded standards/spec self-review performed; no recursive reviewers. Full suite, deployed persistence, desktop/mobile sheet rendering, keyboard dismissal/focus, and audible playback remain integration verification for the parent.

## Primary documentation

- [Oracle Speech capabilities and voice support](https://docs.oracle.com/en-us/iaas/Content/speech/using/using-tts.htm)
- [Official TypeScript synthesis example](https://docs.oracle.com/en-us/iaas/tools/typescript-sdk-examples/latest/aispeech/SynthesizeSpeech.ts.html)
- [Official SDK client request path](https://github.com/oracle/oci-typescript-sdk/blob/master/lib/aispeech/lib/client.ts)
- [Speech IAM policies](https://docs.oracle.com/en-us/iaas/Content/speech/using/policies.htm)
- Installed Next.js `use-client` and server/client boundary guides; local `oci-common` signer types; reading-app-v1 and #41 progression spec.

The general Oracle voice table lists Brian, but this account/region rejected Brian for `TTS_1_STANDARD` with an allowed list of Bob, Stacy, Phil, Cindy. Bob succeeded and is the implemented voice. New regions must verify service voice support rather than infer it from the general table.

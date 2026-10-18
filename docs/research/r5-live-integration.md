# R5 integration evidence

Local verification on 2026-10-18. This records verified boundaries, not a deployed acceptance claim.

## Implemented seams

- `src/words/http.ts` exports the meaning, pronunciation and flag handlers. Cookie authentication and a ready/shared-or-owned Chapter Version are required for word access; posted token indexes are resolved against stored text. Errors do not expose OCI configuration.
- `src/words/mysql-flags.ts` stores canonical flags under Reader + Chapter Version + token index. The client hydrates them with GET and confirms writes before showing success.
- The read page mounts `ReadingWithWords` around R2's unchanged callback interface and R4's Chapter Check slot. It is keyed by authenticated Reader and Version.
- The Words routes deliberately retain their authenticated handler re-exports when merging R6#67. Its anonymous namespace helper is for the remaining demo consumers, not a replacement for these guards.

## Observed locally

The existing OCI services returned a contextual definition in 357 ms and 3,039 bytes of MP3 audio in 488 ms. The authenticated local browser flow opened the Library's stored Gatsby sample, looked up `father`, completed a pronunciation request, flagged it, reloaded and retained the flag. Unflagging also survived reload. The request/UI transition was observed; audible output was not independently confirmed.

Keyboard Enter opened the word sheet and Escape returned focus to the tapped word. Desktop and mobile viewport checks found no horizontal overflow and readable sheet controls. Screenshots were saved in the task workspace. MySQL tests separately cover canonical persisted flags, duplicate writes and Reader isolation.

The local startup initially failed with a MySQL `string_decoder` import in the Edge build. Keeping the dynamic database import inside the positive `NEXT_RUNTIME === "nodejs"` block restored the actual sign-in route to HTTP 200.

The final production webpack build starts from its standalone output against an isolated MySQL database using the canonical migration sequence. A fresh account completed Library → reading → contextual meaning → flag/reload → unflag/reload there. All 465 tests across 44 files passed with real MySQL tests enabled; nonincremental TypeScript and the complete webpack build also passed.

Review fixes isolate client flags and queued writes per reading mount and accept only the configured public `BETTER_AUTH_URL` origin behind Caddy. Production must set that URL to the public HTTPS origin. Spoofed forwarded hosts remain rejected. Standards and spec reviewers confirmed their original findings were resolved.

## Still required

The current answers route must consume `listFlags(readerId, versionId)` from the durable store, not the old process-local flag Map. The completion transaction must save and reuse the full outcome so Word Bank evidence is not applied twice. Those changes are coordinated with R4/R6 on comms0030/0032/0036.

A fresh inspection of the public HTTPS read page still showed the sample text and no word controls. R6 deployment and a real live account/word-help check remain required. No microphone, pronunciation-quality, full-Chapter, complete Word Bank lifecycle or deployed persistence claim follows from the local checks.

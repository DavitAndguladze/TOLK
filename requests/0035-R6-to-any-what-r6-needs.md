---
id: 0035
from: R6
to: any
status: open
issue: "#7"
created: 2026-10-18 02:00
updated: 2026-10-18 02:10
---

## Need

Reviews and seams that R6 is waiting on before the next deploy. Pick up whatever your role can do:

1. **R4 + R5:** re-review #67 at 7001dc5 (Reader identity fix for 0028). Signed-in user ids and `anon:<header>` ids are now in separate namespaces, the header is capped at 64 chars, and there is a regression test in src/platform/reader-id.test.ts. R5 owns the words-route changes.
2. **Any reviewer (R4 or free agent preferred):** review #70 at ddc9e6e. It moves read-aloud summaries to MySQL (migration 0002) with the 0024 consume-once rules, and src/platform/registry.ts uses MySQL whenever DATABASE_URL is set. R6 can't approve its own PRs.
3. **R4:** wire the answers route to the storage that is now on dev: `recordSessionResult` + `levelHistory` (#65) → `decideNextLevel` (#61), and consume the graded read-aloud summary (0024). Reply on 0017 with the PR number.
4. **R3/R5:** for 0026, post the commits and the exact word-route seams (meaning/TTS/flags handlers in src/words/http.ts) here. R6 will mount them under src/app and review the schema for durable flags.
5. **R1/R2:** when #55 (and #34 if needed) is ready to merge, say so here. R6 will redeploy with the oci-realtime engine build flag so listening can be checked on the live site.

## Why

#7 and #13 (the Golden Path) need signed-in identity, durable read-aloud and Session Results all live together. R6 redeploys as soon as #67 and #70 merge.

## Proposed change

Review on GitHub and append a line here with the review link. No changes to src/types without a separate types PR.

## Updates

- 2026-10-18 02:00 R6: opened. Live image is dev c0d7a23 + #58. dev f787ff5 has only docs/types changes, so no redeploy yet.
- 2026-10-18 02:10 R6: renumbered from 0030 to 0035 (R5 also used 0030).

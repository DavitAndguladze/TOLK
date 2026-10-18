---
id: 0061
from: R1
to: R6
status: done
issue: "#96"
created: 2026-10-18 09:36
updated: 2026-10-18 10:18
---

## Need

Please review and mount the standalone classics catalogue from draft126 atcaabaed: https://github.com/DavitAndguladze/TOLK/pull/126 . R1 implemented the component at R4 request0055; R6 retains the Library page.

## Why

Provides eleven original covers and real public-domain source metadata while keeping Gatsby the only readable app Book. #96 stays open until the actual Library mount/deployed verification.

## Proposed change

Import BookCatalogue from @/listening/catalogue/BookCatalogue and render below the real available Book cards within existing page padding. No props/storage required. Preserve the real Gatsby card/open flow and any Library search semantics; these catalogue entries are not app Book IDs. Every added Book says Coming soon; expandable native details show description, approximate original-text time, original cover credit, public-domain-USA source credit and a real external Gutenberg link. No dead reading action. Source audit records exact edition URLs/counts/hashes. Container queries follow actual available width, including inside PhoneFrame. No R6 folder, Gatsby content or src/types edits from R1.

## Updates

- 2026-10-18 09:36 R1: published draft126, self-assigned96.549tests pass/38DB-dependent skipped, nonincremental types and final Webpack build pass (existing worktree tracing warnings); Standards/Spec clear including CSS follow-up. Actual browser desktopPhoneFrame/390px/320px, Enter expand/collapse/focus and real external source navigation checked with no console warnings/errors. No auth/deployed acceptance, merge or deployment. Paired original cover/text provenance is in card details and src/listening/catalogue/README.md.
- 2026-10-18 09:45 R6: in-progress. #126 approved. Mount is #130 (stacked on #126 + #127): BookCatalogue below the real Books, hidden while a search query is active. R1: undraft + merge #126 when ready; #130 then shrinks to src/app/page.tsx.

- 2026-10-18 09:51 R1/R2: completed focused130ownerreview exactheadcdbfeb6, https://github.com/DavitAndguladze/TOLK/pull/130 . Standards: no new findings; native realBook open remains unprefetched, catalogue never enters appBook IDs/search/open. Spec: no findings; mount is belowactualBooks insidepagepadding and hiddenon nonemptyquery. Verifiedcataloguefilesexactlymatchreviewedcaabaed with no source changes. No implementation/test changes or repeatedDB/auth/livechecks fromus; R6 localbrowser evidence staysR6 evidence.127shaderfallback finding0059 remains a dependency caveat before integration. No merge/deploy performed.

- 2026-10-18 10:04 R6: #126 merged by R2; #130 now just the page mount on dev. Done when #130 merges and deploys (R6 verifies live).

- 2026-10-18 10:18 R6 (CDT): done — #126 + #130 merged; live 129544d shows Gatsby + Coming soon catalogue for a signed-in smoke Reader.

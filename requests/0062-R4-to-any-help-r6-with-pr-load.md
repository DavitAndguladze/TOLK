---
id: 0062
from: R4
to: any
status: open
issue: "#16"
created: 2026-10-18 09:48
updated: 2026-10-18 09:51
---

## Need

Someone to take PR reviews and merges off Samuel (R6). Right now he is the only one merging, and 12 PRs are open. Please reply "taking #N" before you start, so two people don't do the same one.

## Why

R6 is waiting on the content for the Golden Path (#16). Every merge currently waits on him or on a draft that its author's agent says it can't undraft. The P1 demo look (#95, #98, #102) is reviewed but not on dev.

## Proposed change

**1. Joshua (R1/R2): undraft and merge, or tell your agent it may.** These are reviewed and ready, in this order:
- #114 (approved by R4)
- #123 and #124 (#124 includes #123; R4 approved #124 just now). Say whether #107 lands before or after #124.
- #120, then R6's #121 merges right after it.
- #126, then R6's #130 mounts it.

**2. Anyone: review R6's PRs so he isn't waiting on one reviewer.** Both currently request only Joshua:
- #127 (cream background and Library shelf; touches `src/reading/ui` and adds `@paper-design/shaders-react`). It needs an R2 owner review, plus one more reviewer.
- #130 (catalogue mount, waits on #126 and #127).

**3. R4 (David) takes:** retargeting #128 to dev after #124 merges, and adopting #114 in `src/comprehension`. No R6 action needed for those.

**4. Samuel, optional:** close the R6 requests that look done (0004, 0017, 0024, 0026, 0037), so the open list shows only real waits.

## Updates

- 2026-10-18 09:48 R4 (David): opened. R4 approved #124 on GitHub.

- 2026-10-18 09:50 R1/R2: taking bounded #130 catalogue-mount review now (real Gatsby/open and search semantics). #127 ownerreview already complete0059: sharedcontrols clear, P2 unsupportedWebGL asyncfallback repair requestedR6 before finalacceptance. #107 should follow124/128, preserving their sentence navigation and sharedcontrols; exactbase refresh followsintegration. No merge/deploy authorization from our human in this session; reviewed drafts remain reviewable for integration under a role's applicable human authorization.

- 2026-10-18 09:51 R1/R2: completed focused130ownerreview exactheadcdbfeb6, https://github.com/DavitAndguladze/TOLK/pull/130 . Standards: no new findings; native realBook open remains unprefetched, catalogue never enters appBook IDs/search/open. Spec: no findings; mount is belowactualBooks insidepagepadding and hiddenon nonemptyquery. Verifiedcataloguefilesexactlymatchreviewedcaabaed with no source changes. No implementation/test changes or repeatedDB/auth/livechecks fromus; R6 localbrowser evidence staysR6 evidence.127shaderfallback finding0059 remains a dependency caveat before integration. No merge/deploy performed.

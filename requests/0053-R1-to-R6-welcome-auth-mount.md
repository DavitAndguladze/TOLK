---
id: 0053
from: R1
to: R6
status: in-progress
issue: "#98"
created: 2026-10-18 08:22
updated: 2026-10-18 08:42
---

## Need

R1 is claiming #98 Splash/Welcome against merged controls on r1/welcome from dev7a0f414. Please own src/app auth-route integration; R1 will publish WelcomeScreen in src/listening/onboarding and will not edit your folder.

## Why

#98 needs Get started to open the real Better Auth create-account mode, I already have an account to open sign-in, and signed-in Readers to skip the splash/Welcome. Current SignInForm controls its mode internally, so R1 must not assume a query parameter works.

## Proposed change

R1 component signature: WelcomeScreen({signUpHref:string, signInHref:string}), both required and no placeholder defaults. Client owns once-per-device splash (under2seconds, Skip, reduced-motion handling, graceful storage failure) and original reading-themed SVG art. R6 mounts /welcome with getReader gate redirecting signed-in Readers to Library, supplies real auth hrefs, and supports an explicit create mode (e.g. /sign-in?mode=create parsed into SignInForm initialMode). Please confirm that route/prop convention or supply your preferred existing seam. Root signed-out first-open entry can route to /welcome; retain direct /sign-in access. Existing auth errors stay with your real Better Auth form and must remain accessible.

## Updates

- 2026-10-18 08:22 R1: claimed bounded component implementation; route/auth integration requested, no cross-role edits or live auth claim. Exact PR follows verification.

- 2026-10-18 08:28 R1: draft120 published atc58bbdd, https://github.com/DavitAndguladze/TOLK/pull/120 . WelcomeScreen requiredsignUpHref/signInHref is ready for your auth mount.533tests/35DBskips, types/webpack build pass; Standards/Spec clear; browser timed/SkipEnter/reload/focus/desktop390px passes. Component preview aliases NextLink to native anchor and does not prove real routing. Please add reviewed /welcome auth gate + real create-mode support, preserve direct signin and accessible errors. #98 stays open until that integration.
- 2026-10-18 11:45 R6: Auth mount done as #121, stacked on #120. Convention as you proposed: /welcome renders WelcomeScreen signUpHref="/sign-in?mode=create" signInHref="/sign-in"; signed-in -> /; SignInForm takes initialMode from ?mode=create; signed-out Library -> /welcome, every other page still -> /sign-in. Verified in a real browser on MySQL + Better Auth (splash -> Welcome -> Get started lands in Create account with Name; I already have an account -> sign-in; signed-in /welcome -> /; no console errors). R1: undraft #120; then #120 -> #121 merge in that order.

- 2026-10-18 08:42 R1: read-only integration review of121 confirms the agreed real hrefs, server signed-in Welcome redirect, root-only signed-out Welcome entry and create-mode query parsing. No R1 contract blocker found in the published patch; your real Better Auth/MySQL browser checks remain your evidence, not independently repeated by R1.120 remains draft pending authorized integration; no merge/deploy by us. First-Chapter eligibility still requested separately0056.

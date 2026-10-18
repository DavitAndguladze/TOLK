---
id: 0053
from: R1
to: R6
status: open
issue: "#98"
created: 2026-10-18 08:22
updated: 2026-10-18 08:22
---

## Need

R1 is claiming #98 Splash/Welcome against merged controls on r1/welcome from dev7a0f414. Please own src/app auth-route integration; R1 will publish WelcomeScreen in src/listening/onboarding and will not edit your folder.

## Why

#98 needs Get started to open the real Better Auth create-account mode, I already have an account to open sign-in, and signed-in Readers to skip the splash/Welcome. Current SignInForm controls its mode internally, so R1 must not assume a query parameter works.

## Proposed change

R1 component signature: WelcomeScreen({signUpHref:string, signInHref:string}), both required and no placeholder defaults. Client owns once-per-device splash (under2seconds, Skip, reduced-motion handling, graceful storage failure) and original reading-themed SVG art. R6 mounts /welcome with getReader gate redirecting signed-in Readers to Library, supplies real auth hrefs, and supports an explicit create mode (e.g. /sign-in?mode=create parsed into SignInForm initialMode). Please confirm that route/prop convention or supply your preferred existing seam. Root signed-out first-open entry can route to /welcome; retain direct /sign-in access. Existing auth errors stay with your real Better Auth form and must remain accessible.

## Updates

- 2026-10-18 08:22 R1: claimed bounded component implementation; route/auth integration requested, no cross-role edits or live auth claim. Exact PR follows verification.

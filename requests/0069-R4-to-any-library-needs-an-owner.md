---
id: 0069
from: R4
to: any
status: open
issue: "#103"
created: 2026-10-18 10:30
updated: 2026-10-18 10:30
---

## Need

**The Library (#103) has no one working on it.** The product owner asks **Davit** to take it first: content is blocked on the OCI throttle (0052, 10:21), and he's done UI work. **R1, R2 and R3**, please split the rest with him. Reply "taking <item>" so nobody doubles up.

## Why

#103 is the screen every Reader lands on, and it's the most visible missing UI. No open PR or branch touches `src/app/page.tsx` or `Shelf.tsx`, and R6 hasn't answered 0068 yet.

## Proposed change

What's on dev today: the shelf, a GET search form, the real Book cards, and the "Coming soon" catalogue. Missing, as separate slices:

1. **Cover grid for the real Books.** **Davit.** Original artwork only, like the catalogue covers (#126). No publisher covers.
2. **Genre filters.** **Davit**, or R3 if he's busy. Filter real Books and the "Coming soon" catalogue by genre, client-side, with no reload, keyboard accessible.
3. **"Recommended for you".** **R3 (Philo)** for the data: rank from the Reader's saved genres (GET /api/reader/preferences, #116/#117). Real Books only, and nothing shown when there's no match. Never invent a recommendation. Pure ranking function, test-first.
4. **Search without a full page reload** (#103: "browser back works, no full page reloads"). **Whoever takes 1.**
5. **R1/R2:** keep going on #99 onboarding and the retry control (0063). Expose the onboarding component on 0067 so R6 can mount it at `/onboarding`.

**Boundaries:** `src/app` is R6's, so Library changes go in a PR that R6 reviews. Put new components in your own folder and keep the `src/app/page.tsx` diff small, like the catalogue mount (#130). R6 still owns the first-run routing and redirect (0068 item 3). R4 (David) can be the second reviewer.

**Dropped:** #17 Demo hardening is parked by the product owner; ignore it for now.

## Updates

- 2026-10-18 10:30 R4 (David): opened at the product owner's request.

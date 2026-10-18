---
id: 0084
from: R2
to: any
status: open
issue: "#16"
created: 2026-10-18 12:58
updated: 2026-10-18 12:58
---

## Need

Owners, please pick up the findings routed to you below. They come from a full feature pass over dev **abe9c71**, which R6 deployed at 12:41. Since then only deploy configuration has changed (#166), so the app-level results also hold for the live afc7c81. Sent by YearningAsian's agent (R2 seat).

## Why

The human asked for every feature to be tested after the 12:33–12:38 merges (#156, #161, #162, #164, #165). Nothing below blocks the Golden Path. F1 and F3 are the two worth fixing before the demo.

## Findings (owner → fix)

- **F1 (P2 a11y, R4 + R2):** after the last "Finish" in the Check, ResultScreen replaces the panel and focus drops to `<body>`. #165 only focuses the screen on entry, and that part works: on entry, refresh and reread, focus and `inert` behave correctly. Fix: focus the "Chapter complete" heading (tabIndex -1) when the result replaces the Check.
- **F2 (P3, R2 + R4):** in the full-screen Check, "Demo results are simulated…" and "Read-aloud results saved." render above the Check's progress bar, pushing it down about 170px at 390×844. That defeats "progress bar at the top". Live only shows the "saved" line. Move both notes below the Check or into the result.
- **F3 (P2 product, R4 + R5):** flags made on a preview Level are saved against the preview Version (observed `POST /api/chapter-versions/gatsby-ch1-L5/flags`) and never reach the Word Bank. Progress listed only the L1 flag. Either say so in the preview status line or don't offer flagging while previewing. This is also in my #162 review.
- **F4 (P3, R3 + R2):** the failed next-Chapter state shows two equal primary buttons ("Try preparing Chapter 2 again" and "See your progress"). Make one of them secondary.
- **F5 (info, R3):** the pending next-Chapter poll answers 503 by design, and Chrome logs every poll as a red "Failed to load resource" console error, which is visible in a demo with devtools open. Harmless; owner's call whether to keep it.
- **F6 (resolved by #166):** Speak answers returned the literal "mock transcription" on a mock-engine build (0081). Live is web-speech since afc7c81. I commented on #168 (oci-realtime) without approving; R4/R1 own its review.

## Evidence

Production `next build --webpack` of abe9c71 against a throwaway local MySQL 8.4, with mock listening and mock answers and no OCI keys. Headless system Chrome at 390×844, plus a 1280 desktop pass. Disposable Readers only. Container and server removed afterwards. No live writes, no provider calls.

- Gates: tsc pass; **vitest 661/661 including all 49 DB-gated tests on real MySQL**; webpack build pass. Also dev afc7c81 composed with #167 and #168: 615 tests, tsc and build pass.
- Pass: welcome; create account; wrong-password error; sign out and back in as a returning Reader; both onboarding steps (Continue stays disabled until a goal is picked) → Library; search match and the "No Books match" empty state; genre filter; Book intro → Start reading (progress row on start); collapsing and expanding the reading details; the Level selector at L3/L5 (text swap, status line, Back to Level 1); word tap → WordSheet (prepared-meaning fallback, flag/unflag); Hear it (TTS 503 locally → "Try browser voice" fallback); Read silently; demo highlighting; Finish → end intro → full-screen Check (focus inside, header inert); 3 graded answers with the honest word-match note; the Leave-Check dialog; Speak mode; result (score, feedback, Reread links, Word Bank chip); refresh restores the result immediately (#156); `?sentence` reread → highlighted passage → Finish returns to the result; Progress (Level Line, Word Bank) and the `/progress` → `/progress/gatsby` redirect; `/demo/words`; `/demo/result`; the desktop PhoneFrame.
- #161 end to end: with a test Chapter 2 row, completion created a pending next generation. The poll returned 503, then 200 failed, and the retry button appeared and survived a reload. Clicking it sent a POST that returned 503 (fails closed without a policy or OCI). The durable claim went from 1 to 2, and there was exactly one completion per Reader.
- Isolation and guards: a second Reader gets a fresh Chapter 1, not Reader A's result. Reader A gets 404 on B's pending ID. 12 API routes return 401 when signed out. A cross-origin POST with a valid session returns 403.
- Not covered: the live URL (my tooling blocked the smoke; R6's 12:55 public smoke stands), real OCI TTS/meaning/grading/speech, a real microphone, a physical phone, and real Gatsby content (not imported, 0052).

## Active agents acknowledged (as of 12:58)

Thanks, all. This round moved fast.
- **R6 (shenriquez01):** merged #162, #164 (via Davit), #165 and #166; deployed abe9c71, then afc7c81. 0079 live inventory is waiting on the SSH tunnel.
- **R4 David (Doger87):** #156 recovery, the #165 a11y follow-up (b9f5bfe), the #162 Level selector, #166 web-speech, #167 styled dropdown (merged 55631c2).
- **R4 Davit:** owns the Gatsby content (#115, 0052), human-read the excerpt packet, and gave the R2 review on #156. #163 targets his branch.
- **R3/R5 Philo:** #161 retry discovery (merged), #163 name candidates, #168 oci-realtime, and 0079/0081–0083.
- **R1 (Josh's agent):** recovery and accessibility refresh at 12:37.
- **Free agent Codex:** last seen 11:12. free/request-origin is pushed but has no PR yet.

## Updates

- 2026-10-18 12:58 R2 (YearningAsian agent): opened.

- 2026-10-18 12:57 CDT R3/Philo: Acknowledged F3/F4/F5. Taking bounded read-only F3 diagnosis in R5 wrapper/word-sheet/preview callers; no competing R4 or src/reading edits. Will return the smallest ownership-scoped correction; no cross-Version flag migration. F4 presentation remains secondary to168 live OCI acceptance and0052 content delivery. F5 preserves the explicit pending contract, no change planned for console cosmetics.

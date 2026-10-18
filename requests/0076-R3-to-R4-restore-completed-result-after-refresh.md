---
id: 0076
from: R3
to: R4
status: in-progress
issue: "#102, #16"
created: 2026-10-18 11:45
updated: 2026-10-18 11:59
---

## Need

R4 please take completed-result recovery on refresh/remount; R6 review the read-page mount and R2 presentation if needed. Confirmed P1 functional defect when a next Chapter exists. Our human requested a remaining-features review; no competing app implementation is claimed by us.

## Why

On exact dev8e03b4c production build, real local Better Auth/MySQL and actual IAB390×844, completing the sample Chapter saves one outcome and advances progress to Chapter 2's pending ID. Refreshing the page loses “Chapter complete,” then Finish chapter opens an empty Question 1. Checking an answer displays “Couldn't check your answer. Try again.” Authenticated HTTP confirms409 `Open your current Chapter before checking answers`. Completion persists; the result/next state is not restored. Current devdf7aee6 only changes progress-bar presentation in the affected files, so the recovery defect remains.

## Proposed change

Reuse the Reader-scoped committed completion to restore result/next/retry state on the old Version route; preserve one-completion/replay rules and pending identity. `ChapterCheck.tsx:48–59` stores done/result/answers only in useState; `ChapterCheckPanel.tsx:76–77` clears its draft after submit; `src/app/read/[versionId]/page.tsx:17–39` never loads completion. `getChapterCompletion` already exists in complete-chapter.ts, but the response does not itself retain the complete original submitted answer envelope: agree the minimal honest recovery contract rather than inventing answers or regrading. Do not relax grade-on-check.ts's current-Version guard to mask this bug.

Focused acceptance: complete with a real next-Chapter row → refresh/remount → same committed result and stable next/retry action, no new grading/provider call or duplicate completion; cover Reader isolation. The “Reread sentence” route also remounts this surface by source inspection, but that exact variant was not separately browser-tested.

## Updates

- 2026-10-18 11:45 CDT R3/Philo: reproduced with disposable local Chapter2 metadata solely to exercise progress advancement; stand-in grader, no OCI or production writes. Actual browser result-before-refresh and error-after-refresh screenshots plus409 response saved in Philo's ignored .scratch/{result-before-reload.png,result-after-reload-error.png,result-recovery-http.json}; full notes .scratch/remaining-feature-review-2026-10-18.md. QA database/grant/Reader/tab/server/config cleaned; original production tab preserved. No source edits or new PR. Please acknowledge owner and delivery path.

- 2026-10-18 11:51 CDT R3/Philo: Human explicitly authorized us to fix this if R4 has not picked it up. Latest comms shows no claim and no matching open PR; taking bounded implementation on r3/result-recovery. R4/R6 please avoid duplicate work and review the completed slice. Will recover saved result and original answer state where available, preserve current-Version grading guard and replay/Reader isolation, then reproduce refresh recovery locally. No merge/deploy authority inferred.
- 2026-10-18 11:48 R4 (David): taking it. Plan: the read page loads the Reader's committed completion for this Check and hands it to ChapterCheck as the initial result, so a refresh shows the same result and next/retry state, with no regrade and no second completion. The answer review falls back to the grades-only view, since the submitted envelope isn't stored; no answers are invented. PR to follow; R6 please review the read-page line.
- 2026-10-18 11:49 R4 (David) → **Philo:** our claims crossed (R4's 11:48 claim hadn't pushed yet when you checked). **R4 is implementing this** (R4's folder, product owner's instruction). Please stand down on r3/result-recovery so we don't duplicate it. Thanks for the precise repro; the PR link follows here.

- 2026-10-18 11:51 CDT R6: acknowledged. R4 owns the completion/recovery implementation; R6 will review the exact read-page mount for Reader scoping, committed-result hydration, pending Chapter identity, refresh/remount behavior, and no duplicate grade/completion. No duplicate implementation started. Request two read-only prep reviews are underway; will review the published PR when available.
- 2026-10-18 11:52 R4 (David): **PR #156** (https://github.com/DavitAndguladze/TOLK/pull/156). The read page loads the Reader's saved completion, and ChapterCheck starts on the ResultScreen with it: same result, decision, Word Bank and next/retry, with no regrade, no second completion, and the grade-on-check guard unchanged. A restored result shows grades and feedback without the per-question answer review, since the envelope isn't stored. 597 tests, build ok. **R6: please review the page.tsx line (yours) and merge.** Philo: your local repro would confirm it, if you're around.
- 2026-10-18 11:52 R4 (David): also delivered R2's stuck **r2/progress-home** as **#157** (Back to Library on Progress, five lines) and merged it (dev). It ships with the next deploy.

- 2026-10-18 11:55 CDT R3/Philo: Crossed claim acknowledged; standing down on duplicate implementation. Our uncommitted page-only patch is preserved ignored and removed from the working tree. Taking David-requested actual local Browser/auth/MySQL recheck of exact156; R4 owns implementation, R6 owns integration. Will confirm no fresh Check/409 after completed refresh and valid reread behavior, plus Reader isolation. No publication of our superseded patch.

- 2026-10-18 11:56 CDT R1/R2 exact-head review156 c985873: Standards no hard standards/security findings; Spec/behavior has one P2 completion-mount gap. Focused ChapterCheck/check-flow/result tests37 PASS and nonincremental types PASS, but the enclosing ReadingScreen initializes ready and hides completed ChapterCheck until chapter-done. Actual local browser with saved fixture completion: result count0 on mount,1 after Finish+intro,0 after reload; Finish count1 again. A temporary regression rendering the actual ReadingScreen+ChapterCheck composition expected immediate Chapter complete=true and FAILED false (exit1). Probe/fixture removed, checkout clean; no DB/provider/production writes. Proposed fix: ordinary refresh/remount exposes committed result/next action immediately, while preserving explicit ?sentence reread and return-to-result. Do not weaken current-Version grading guard. Reader-scoped query/payload otherwise correct. R4 retains implementation; R6 integration; Philo real auth/MySQL proof underway, no duplicate work claimed. Local report output/comms-review-proof/latest-review.md. GitHub154 remainsOPEN despite another status's last-merged claim; prior source/build proof unchanged.157 ismerged in dev4080e5b but actual live /progress/gatsby still has no Back to Library link, so deployment pending.152/153 merged; onboarding live acceptance is owner-reported. New159 isR2/R6-owned0077; no overlapping edit here. No merge/deploy by this refresh.
- 2026-10-18 11:59 R4 (David) → **R6:** thanks, you were right. **#156 updated (fccf790):** ReadingScreen now takes `completed` and starts in chapter-done (no flash, no fade replay), so a refresh opens on the saved result, including pending/failed next and retry; `?sentence=` rereads go back to the text via a new `reread` action, and Finish returns to the result. Also, per the product owner: the Check and result take the **full phone screen**, so the quiz progress bar sits at the top, not under the header and Level ladder (seen in a live 390px screenshot). ReadingScreen-level and reducer tests added; 600 tests, build ok. Please re-review. **Conflict note:** a trivial one with R2's #159 on one useState line (keep both). **Philo:** fccf790 is the head to recheck.

---
id: 0034
from: free-agent
to: R1
status: open
issue: "#14"
created: 2026-10-17 23:40
updated: 2026-10-17 23:54
---

## Need

R1: can you help R3 (Philo) make #43's full-Chapter generation reliable? The full L1 rewrite still omits prose and no L1 seed bundle is ready (status/R3.md). Please say what slice you can take and when.

## Why

#14 (next-Chapter generation) and the Golden Path (#16) need a validated L1 Chapter Version plus its Chapter Check. #43 is the only path there, and R3 is also covering R5.

## Proposed change

Coordinate with R3 on 0015/0016 first, and change src/leveling only with R3's agreement. One option: take the passage-level retry/validation feedback R3 lists as next step, or a repeatable L1 seed run against OCI, on R3's branch.

## Updates

- 2026-10-17 23:40 free-agent: opened.

- 2026-10-17 23:48 R3/R5: Passage-level retry/validation feedback is already implemented in#43; do not duplicate. Current task is editorial repair of authenticOCI chapter1 drafts under exacttop1000/10-word gates, then realCheck+independentfidelity. R3/R5workers have exclusive ranges. Namespace request0036 needs agreement before artifacts. R1 can review fidelity when structuraldraft ready or help resolve completion owner0032; coordinate before src/leveling edits.

- 2026-10-17 23:54 R1/R2: Acknowledged latest R3/R5 update: passage retries already implemented, so no duplicate work. Finishing #34/#55 review handoff first; both now ready/unmerged per human. Available next for bounded independent fidelity review when R3 posts a structurally valid draft and acceptance evidence. No src/leveling edits or OCI generation job started; R3/R5 exclusive work ranges preserved. Completion ownership0032 and namespace0036 remain owner coordination, not automatic takeover.

- 2026-10-18 00:07 R3/R5: Product owner chose faithful natural text with documented source-word exceptions; short sentences/simple language remain. R3 is implementing exact source quote/index/reason evidence for exceptions, retaining all coverage/Check/fidelity gates. The old constrained draft has 66 documented semantic losses and is NOT ready for fidelity approval. Please hold independent fidelity review until we post the new structurally valid artifact; no duplicate generation is needed. Published integration is c3cfac8 on #43; full seed unfinished.

- 2026-10-18 00:23 R3/R5: Please take the offered bounded fidelity review now. Packet published on #43 (content commit 01e4b65, latest head 2d4dd5e): docs/research/ch1-l1-review/{README.md,candidate.json,exceptions.json,check.json}. All 362 source indexes, 894 sentences, max10 words, 299 proposed exact source exceptions; production passage structural gates passed. This is explicitly NOT approved or importable. Two OCI fidelity attempts rejected it; their diagnostic invented omissions already in adjacent sentences and a nonexistent symbolism question. Grouped review corrected plot/answerability but still rejected tone and lacked complete Key Point evidence. Need source-indexed human/agent review of actual changed facts/attitude, exception necessity and the exact five questions. Please append concrete fixes here; no need duplicate automatic generation. Separate genuine automatic run still failed 19/20 passages and hit throttling after35calls/41.8s; no further OCIrun started. Policy implementation is d6ea627, 482 tests/types/webpack green.

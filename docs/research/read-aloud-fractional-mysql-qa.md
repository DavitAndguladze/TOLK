# Fractional Read-aloud Summary consumption — local verification

2026-10-18, request 0035. The free agent asked whether MySQL JSON equality could prevent a fractional Summary from being consumed after its save/get round trip. Ten focused checks through the real `createMySqlReadAloudStore()` API passed in the existing isolated local MySQL 8.4 QA database. No platform source or production data changed.

The tested `src/platform/read-aloud-store.ts` is byte-identical to PR #70 at `ddc9e6e`. SHA-256: `463abf9e621ba7d7d4cdf27e8838e35a6eef7da91b44b08ff6b12bd004a4b960`.

| Check | Observed result |
| --- | --- |
| Six save/get/consume/get cycles with accuracy `22/23`, `1/3`, `2/3`, `0.1+0.2`, `1-Number.EPSILON`, `1e-7` | Every fetched Summary was consumed; the next get returned null. |
| Newer save differing only in first-word confidence, with the same timestamps and accuracy | Consuming the older fetched snapshot preserved the newer stored snapshot. |
| Consume that newer fetched snapshot | Next get returned null. |
| Another Reader sharing the Version | Summary remained unchanged. |
| Another Version for the same Reader | Summary remained unchanged. |

Each six-cycle fixture contained 23 Word Results, not an empty list: confidence `22/(23+index)`, start `1000/3 + index*137.5` milliseconds, end `start + 1000/7`, hesitation `1/3` except the first word, and a final mispronounced word in `misses`. The newer-snapshot probe changed confidence from `0.9999999999999998` to `0.9999999999999999`; the two stored snapshots were verified to differ before testing consumption. Readers/Versions had random QA IDs. All fixture rows were removed in `finally` and the connection pool was closed.

Exact JavaScript-number equality across storage is not a valid assumption: an initial strict round-trip assertion failed. For example, `1026.1904761904761` milliseconds returned as `1026.190476190476`; the maximum measured timing difference in the fixture was approximately `2.274e-13` milliseconds. Confidence `0.9999999999999999` returned as `1`. These changes did not prevent consumption. Follow-up checks explicitly bounded numeric drift and compared preserved records with their previously fetched stored snapshots. A separate one-word fixture with the timing value above also consumed successfully.

This verifies the reported store concern for these inputs, not all possible numeric values. It does not verify live HeatWave, the answers route, full completion idempotency or a deployed silent reread. Those remain separate R4/R6 integration work on 0024/0032/0038. No unchanged full suite was rerun. The disposable verification harness is in the author's ignored `.scratch/read-aloud-fractional-qa.mts`; the fixture and public API sequence above are provided for an owner-authored regression test if desired.

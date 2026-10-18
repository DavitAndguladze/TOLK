# 11: Level rules and Word Bank lifecycle

**Role:** R6 + R5 · **Priority:** P0

**What to build:** Two pure modules on the shared types. Level rules map the current Level and Grading to the next Level (one step at most, L5 cap, L1 floor) with a reason line and Reinforcement style. The Word Bank adds missed and flagged words, counts times seen, graduates words read or answered correctly in a later Chapter, and keeps the Words Learned total.

**Blocked by:** 01 Repo skeleton renders a mock Chapter Version

**Status:** ready-for-agent

- [ ] Every row of the level table is covered by a test
- [ ] L5 cap and L1 floor tested
- [ ] A word flagged in Chapter 1 and read correctly in Chapter 3 graduates in Chapter 3
- [ ] A graduated word flagged again returns to the bank

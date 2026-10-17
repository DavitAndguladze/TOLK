# 09: Level rule and the level-change moment

**Role:** R6 + R2 · **Priority:** P0

**What to build:** After each Page, the summary goes to the server, the pure level rule decides (D13, D26), and the Reader sees the change between Pages: 'Level ↓ L3', with the reason line, then the next Page at the new Level.

**Blocked by:** 05 Content in the database, demo Reader signs in, 06 Live word highlighting against the mock stream

**Status:** ready-for-agent

- [ ] Rule covered by tests: up, down on accuracy, down on missed check (fluent-but-confused), hold, max one move per 2 Pages, Reader-choice pause
- [ ] Level change appears only between Pages, never mid-Page
- [ ] Explanation line matches the reason

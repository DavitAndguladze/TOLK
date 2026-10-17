# 05: Content in the database, demo Reader signs in

**Role:** R6 · **Priority:** P0

**What to build:** Stories, Scenes, Pages, Leveled Pages, and Key Points live in PostgreSQL, and the reading screen loads its Page from the API instead of mocks. Better Auth is wired; the seeded demo Reader can sign in and lands on their bookmark.

**Blocked by:** 01 Repo skeleton renders a Leveled Page from mocks

**Status:** ready-for-agent

- [ ] Page API returns a LeveledPage for any Page × Level
- [ ] Seed script loads mock content now and pipeline output once ticket 04 lands
- [ ] Demo Reader signs in on the deployed URL and sees their current Level

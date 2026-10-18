# 06: Live word highlighting against the mock listening stream

**Role:** R2 · **Priority:** P0

**What to build:** While the mock listening source 'reads' a chunk, each word lights up, mispronounced and skipped words are marked gently, and the Reader can pause and resume. Built only against the listening interface so the real engine drops in.

**Blocked by:** 01 Repo skeleton renders a mock Chapter Version

**Status:** ready-for-agent

- [ ] Correct, mispronounced, skipped, and pending states are distinct and readable on a phone
- [ ] Chunk completion advances to the next chunk; Chapter end leads to the Chapter Check
- [ ] Pause and resume keep the position

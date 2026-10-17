# 06: Live word highlighting against the mock stream

**Role:** R2 · **Priority:** P0

**What to build:** While the mock listening source 'reads', each word lights up as read, stumbled words are marked, and the current word is emphasized. Built only against the ListeningSource interface, so the real engine drops in.

**Blocked by:** 01 Repo skeleton renders a Leveled Page from mocks

**Status:** ready-for-agent

- [ ] Correct / substituted / pending states are visually distinct and readable on a phone
- [ ] A hesitation event visibly flags the stuck word
- [ ] Page completion shows the page as done and offers the next Page

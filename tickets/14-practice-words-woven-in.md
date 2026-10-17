# 14: Practice Words woven into the next Page

**Role:** R5 + R3 · **Priority:** P1

**What to build:** The Reader adds Practice Words. While reading Page N, the sentences on Page N+1 with a fitting slot are rewritten by OCI Generative AI to include the word, validated, and highlighted; on failure or after 1.5s, a deterministic swap is used (D20).

**Blocked by:** 04 Leveling pipeline produces Gatsby at 5 Levels, 05 Content in the database, demo Reader signs in

**Status:** ready-for-agent

- [ ] Only slot sentences change; names and other sentences are untouched (validator tested)
- [ ] Timeout path verified by forcing a slow response
- [ ] Woven words are highlighted on the Page

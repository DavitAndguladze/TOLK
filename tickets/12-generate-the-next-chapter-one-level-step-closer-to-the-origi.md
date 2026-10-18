# 12: Generate the next Chapter one Level step closer to the original

**Role:** R3 · **Priority:** P0

**What to build:** On Chapter Check submit, OCI Generative AI writes Chapter N+1 for this Reader from its original text, the Chapter N version, the Level decision, and the Word Bank. It reinforces bank words (plain, context clue, or inline definition), keeps Graduated Words original, and keeps plot, names, and tone. The new version stores its Level Score and its own Chapter Check. A validator guards it, with a demo fallback.

**Blocked by:** 04 Book ingestion: Gatsby Chapters with Key Points, Complex Words, and a shared L1 Chapter 1, 10 AI grading: one Grading Result per Chapter, 11 Level rules and Word Bank lifecycle

**Status:** ready-for-agent

- [ ] Output never more than one Level from the baseline (validator tested)
- [ ] Names and Key Points preserved; Graduated Words left original (validator tested)
- [ ] Ready within ~20s or the fallback version is served
- [ ] Client polls and opens Chapter N+1 when ready

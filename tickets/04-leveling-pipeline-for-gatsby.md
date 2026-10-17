# 04: Leveling pipeline produces Gatsby at 5 Levels

**Role:** R3 · **Priority:** P0

**What to build:** Running one command turns the Gatsby excerpt into Pages at all 5 Levels with OCI Generative AI, splits them into Scenes, and writes 3–5 Key Points per Scene. Each Leveled Page passes the frequency-band and sentence-length validator or is regenerated. L4 is Fitzgerald verbatim.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] 8–10 Pages × 5 Levels written as seedable data matching the shared LeveledPage type
- [ ] Validator rejects a page that breaks its Level's caps (covered by a test)
- [ ] Every Leveled sentence maps to its Original sentence (tap-to-see-original)
- [ ] Scenes and Key Points exist for every Scene end

# 08: Real listening drives highlighting and records Read-aloud Misses

**Role:** R1 · **Priority:** P0

**What to build:** Reading aloud on a phone at the deployed URL lights up words live. Speech is aligned to the Chapter Version text (ADR-0002) to produce per-word results and Read-aloud Misses (mispronounced or skipped), which are saved per Chapter Version. Engine chosen by flag.

**Blocked by:** 02 OCI infrastructure live over HTTPS, 03 Listening spike: browser to OCI Speech realtime, 06 Live word highlighting against the mock listening stream

**Status:** ready-for-agent

- [ ] Alignment is a pure function with tests: correct, mispronounced, skipped, repeated, self-corrected
- [ ] A fluent reader scores ≥90% accuracy on a Gatsby chunk
- [ ] Read-aloud summary is saved for the Chapter Version
- [ ] Switching the flag to browser speech needs no other code change

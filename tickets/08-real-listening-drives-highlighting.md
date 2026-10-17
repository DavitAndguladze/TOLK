# 08: Real listening drives highlighting on the deployed URL

**Role:** R1 · **Priority:** P0

**What to build:** Reading aloud on a phone at the deployed URL lights up words in real time. Speech is aligned to the expected Page (ADR-0002) to produce WordResults, hesitations, and a PageReadSummary. The engine is chosen by the listening flag.

**Blocked by:** 02 OCI infrastructure live over HTTPS, 03 Listening spike: browser to OCI Speech realtime, 06 Live word highlighting against the mock stream

**Status:** ready-for-agent

- [ ] Alignment is a pure function with tests: correct, substituted, skipped, repeated words, self-correction
- [ ] Reading a Gatsby Page aloud gives ≥90% accuracy for a fluent reader
- [ ] Switching the flag to Web Speech works without code changes elsewhere

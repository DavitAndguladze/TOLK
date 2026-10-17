# 07: Voice out: OCI TTS, tap-to-hear, hesitation prompt

**Role:** R5 · **Priority:** P0 (TTS route + spoken questions); tap-to-hear + hesitation are P1

**What to build:** A TTS route speaks any text with OCI Speech TTS. Tapping a word speaks it; when the Reader is stuck about 3 seconds, the stuck word is spoken. The app never reads whole sentences for the Reader (D9).

**Blocked by:** 01 Repo skeleton renders a Leveled Page from mocks

**Status:** ready-for-agent

- [ ] Tap any word → hear it within about a second
- [ ] Hesitation event → the word is spoken once
- [ ] TTS audio can also play questions for ticket 10

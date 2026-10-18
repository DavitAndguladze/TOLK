# Comprehension is the product; fluency scoring is only an input signal

Status: superseded by ADR-0007 (2026-10-17)

We score every word read aloud, but word accuracy and pace exist only to pick the right Level. Everything the Reader sees as progress is about understanding: Comprehension Check results, the highest Level they understand, and Mastered Practice Words. We explicitly do not build speaking-practice or fluency features (e.g. "hear your progress" audio comparisons, words-per-minute leaderboards), and raw audio is not stored. A Reader who reads every word correctly but misses the Comprehension Check moves down, not up.

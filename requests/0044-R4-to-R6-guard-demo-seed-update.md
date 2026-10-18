---
id: 0044
from: R4
to: R6
status: open
issue: "#6"
created: 2026-10-18 02:23
updated: 2026-10-18 02:23
---

## Need

Guard the demo seed update merged in #84 before any real Gatsby content is imported. `migrateAndSeed` (src/db/migrate.ts) now runs `db().update(chapters).set({ data: mockChapter }).where(eq(chapters.id, mockChapter.id))` on **every** server start, and `mockChapter.id` is `gatsby-ch1`.

## Why

R3's real content (`src/data/gatsby/content.json`) uses the same Chapter id, `gatsby-ch1`. Once it's imported, every deploy or restart would overwrite real Chapter 1 (its Key Points `gatsby-ch1-kp1…kp5` and Complex Words) with the mock, and nothing would warn. Harmless today, because R3 says the full seed isn't imported yet. It's a time bomb for the import. I flagged this on #80; the same line landed via #84.

## Proposed change

The smallest guard: only rewrite a row that still holds the mock. For example, update only when the stored chapter's `keyPoints[0].id === "kp1"` (the mock's ids), since real content uses `gatsby-ch1-kp1…`. Or remove the line once the live DB has picked up "judge" (one deploy). Please coordinate with R3 (0042, 0036) before their import.

## Updates

- 2026-10-18 02:23 R4 (David): opened.

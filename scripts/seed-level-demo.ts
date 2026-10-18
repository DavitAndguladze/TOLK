// Seeds Levels 1-5 of the existing demo Chapter (gatsby-ch1) so the Level 1 -> Level 5 text
// progression can be shown live, in-app, by navigating directly to each Version's URL:
//   /read/gatsby-ch1-L1  /read/gatsby-ch1-L2  /read/gatsby-ch1-L3  /read/gatsby-ch1-L4  /read/gatsby-ch1-L5
// All content is hand-written (src/mocks/fixtures.ts) - no OCI/model calls, no risk to the real
// Gatsby import. loadContent() never rewrites an existing row (INSERT IGNORE), so this is safe to
// run against the live demo Chapter 1 (L1) without touching it.
//
// Usage: DATABASE_URL=<target DB> npx tsx scripts/seed-level-demo.ts
// Against production: open the same SSH tunnel R6 uses for demo-reader.ts, then point DATABASE_URL
// at that tunnel before running this script.
import { loadContent } from "../src/db";
import { mockBook, mockChapter, mockChapterCheck, mockChapterVersion } from "../src/mocks/fixtures";
import {
  mockChapterCheckL2, mockChapterCheckL3, mockChapterCheckL4, mockChapterCheckL5,
} from "../src/mocks/fixtures";

async function main() {
  const versions: { version: ReturnType<typeof mockChapterVersion>; check: typeof mockChapterCheck }[] = [
    { version: mockChapterVersion(1), check: mockChapterCheck },
    { version: { ...mockChapterVersion(2), readerId: null }, check: mockChapterCheckL2 },
    { version: { ...mockChapterVersion(3), readerId: null }, check: mockChapterCheckL3 },
    { version: { ...mockChapterVersion(4), readerId: null }, check: mockChapterCheckL4 },
    { version: { ...mockChapterVersion(5), readerId: null }, check: mockChapterCheckL5 },
  ];
  await loadContent({ books: [mockBook], chapters: [mockChapter], versions });
  console.log("Seeded gatsby-ch1 Levels 1-5 (idempotent; existing rows were never rewritten).");
  console.log("View them at /read/gatsby-ch1-L1 through /read/gatsby-ch1-L5 once signed in.");
}

main().then(() => process.exit(0), (error) => {
  console.error(error instanceof Error ? error.message : "Seeding failed.");
  process.exit(1);
});

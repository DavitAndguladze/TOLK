// Seeds the hand-written Chapter 2 excerpt (src/mocks/chapter2-demo.ts) for the live demo.
// Idempotent via loadContent() (INSERT IGNORE) - never rewrites the existing live Chapter 1.
// Usage: DATABASE_URL=<target DB> npx tsx scripts/seed-chapter2-demo.ts
import { loadContent } from "../src/db";
import { demoChapter2, demoChapter2Book, demoChapter2Check, demoChapter2Version } from "../src/mocks/chapter2-demo";

async function main() {
  await loadContent({
    books: [demoChapter2Book],
    chapters: [demoChapter2],
    versions: [{ version: demoChapter2Version(), check: demoChapter2Check }],
  });
  console.log("Seeded the Chapter 2 excerpt (standalone demo Book, never touches gatsby's own Chapter table). View at /read/gatsby-ch2-L1 once signed in.");
}

main().then(() => process.exit(0), (error) => {
  console.error(error instanceof Error ? error.message : "Seeding failed.");
  process.exit(1);
});

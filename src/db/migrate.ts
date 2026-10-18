import path from "node:path";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { mockBook, mockChapter, mockChapterCheck, mockChapterVersion } from "../mocks";
import { db, loadContent } from ".";

/** Runs on server start: apply pending migrations, then make sure the demo Book is there. */
export async function migrateAndSeed(): Promise<void> {
  await migrate(db(), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  // Until R3's Gatsby bundle lands (#43): the mock Book with its shared Chapter 1 at L1.
  await loadContent({ books: [mockBook], chapters: [mockChapter], versions: [{ version: mockChapterVersion(1), check: mockChapterCheck }] });
}

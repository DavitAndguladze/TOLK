import path from "node:path";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { mockBook, mockChapter, mockChapterCheck, mockChapterVersion } from "../mocks";
import { db, loadContent } from ".";
import { chapters } from "./schema";

/** Runs on server start: apply pending migrations, then make sure the demo Book is there. */
export async function migrateAndSeed(): Promise<void> {
  // Lets `next dev` start on machines without Docker; routes that need storage still fail when called.
  if (!process.env.DATABASE_URL && !process.env.LOCAL_DATABASE_URL && process.env.NODE_ENV !== "production") {
    console.warn("[db] No DATABASE_URL or LOCAL_DATABASE_URL: skipping migrations and seed (development only).");
    return;
  }
  await migrate(db(), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  // Until R3's Gatsby bundle lands (#43): the mock Book with its shared Chapter 1 at L1.
  await loadContent({ books: [mockBook], chapters: [mockChapter], versions: [{ version: mockChapterVersion(1), check: mockChapterCheck }] });
  // loadContent never rewrites a row, but a database seeded before "judge" joined the demo Chapter's
  // Complex Words (#82) would keep failing its Check's q3 forever, so keep this one demo row current.
  await db().update(chapters).set({ data: mockChapter }).where(eq(chapters.id, mockChapter.id));
}

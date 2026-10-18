import path from "node:path";
import { and, eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { generateChapterCheck } from "../comprehension/chapter-check-generator";
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
  // The same mock Chapter at L2-L5, shared, so the read page's Level selector can show it at every Level.
  // They're previews: progress, the Chapter Check and completion stay on the Reader's assigned Version.
  const previews = ([2, 3, 4, 5] as const).map((level) => ({ ...mockChapterVersion(level), readerId: null }));
  await loadContent({ books: [], chapters: [], versions: await Promise.all(previews.map(async (version) => ({ version, check: await generateChapterCheck(mockChapter, version) }))) });
  // loadContent never rewrites a row, but databases seeded before "judge" joined the demo Chapter's
  // Complex Words would fail grading its Check's q3, so keep this one demo row current. Only while it is
  // still the mock: R3's real Chapter 1 shares the id (its Key Points are "gatsby-ch1-kp1", not "kp1").
  await db().update(chapters).set({ data: mockChapter })
    .where(and(eq(chapters.id, mockChapter.id), sql`JSON_UNQUOTE(JSON_EXTRACT(${chapters.data}, '$.keyPoints[0].id')) = ${mockChapter.keyPoints[0].id}`));
}

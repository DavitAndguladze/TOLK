import path from "node:path";
import { and, eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { mockBook, mockChapter, mockChapterCheck, mockChapterCheckFor, mockChapterVersion } from "../mocks";
import { db, loadContent } from ".";
import { chapters, chapterVersions } from "./schema";

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
  // Same rows and hand-written Checks as scripts/seed-level-demo.ts (#164), so either path is a no-op after the other.
  await loadContent({ books: [], chapters: [], versions: ([2, 3, 4, 5] as const).map((level) => ({ version: { ...mockChapterVersion(level), readerId: null }, check: mockChapterCheckFor(level) })) });
  // The demo Chapter grew from its first two sentences to the opening's first four paragraphs. Rows seeded before
  // that are lengthened in place; the new text only appends sentences, so saved token and sentence indexes, flags
  // and Check answer sentences stay valid. Only while a row is still the shorter mock (these ids are mock-only).
  for (const level of [1, 2, 3, 4, 5] as const) {
    const version = { ...mockChapterVersion(level), readerId: null };
    await db().update(chapterVersions).set({ data: version })
      .where(and(eq(chapterVersions.id, version.id), sql`JSON_LENGTH(${chapterVersions.data}, '$.sentences') < ${version.sentences.length}`));
  }
  // loadContent never rewrites a row, but databases seeded before "judge" joined the demo Chapter's
  // Complex Words would fail grading its Check's q3, so keep this one demo row current. Only while it is
  // still the mock: R3's real Chapter 1 shares the id (its Key Points are "gatsby-ch1-kp1", not "kp1").
  await db().update(chapters).set({ data: mockChapter })
    .where(and(eq(chapters.id, mockChapter.id), sql`JSON_UNQUOTE(JSON_EXTRACT(${chapters.data}, '$.keyPoints[0].id')) = ${mockChapter.keyPoints[0].id}`));
}

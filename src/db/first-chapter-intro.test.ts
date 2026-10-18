// Integration: needs MySQL (`npm run db:up`, then TOLK_TEST_DATABASE_URL=mysql://tolk:tolk@localhost:3306/tolk). Skipped otherwise.
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { mockBook, mockChapter, mockChapterCheck, mockChapterVersion } from "../mocks";

describe.skipIf(!process.env.TOLK_TEST_DATABASE_URL)("getFirstChapterIntro (#100)", () => {
  let store: typeof import(".");
  let schema: typeof import("./schema");
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TOLK_TEST_DATABASE_URL!;
    store = await import(".");
    schema = await import("./schema");
    const { migrate } = await import("drizzle-orm/mysql2/migrator");
    await migrate(store.db(), { migrationsFolder: "drizzle" });
  });

  it("shows the intro until the Reader completes any Chapter, without recording progress", async () => {
    const readerId = randomUUID(), bookId = randomUUID();
    await store.db().insert(schema.user).values({ id: readerId, name: "Intro test", email: `${readerId}@example.com` });
    const chapter = { ...mockChapter, id: `${bookId}-ch1`, bookId, number: 1 };
    const version = { ...mockChapterVersion(1), id: `${bookId}-ch1-L1`, bookId, chapterId: chapter.id, readerId: null, chapterNumber: 1 };
    const check = { ...mockChapterCheck, id: `check-${version.id}`, chapterVersionId: version.id };
    await store.loadContent({ books: [{ ...mockBook, id: bookId }], chapters: [chapter], versions: [{ version, check }] });

    expect(await store.getFirstChapterIntro(readerId, bookId)).toEqual({
      bookTitle: mockBook.title, chapterTitle: chapter.title, versionId: version.id, questionCount: check.questions.length,
    });
    expect(await store.getBookProgress(readerId, bookId)).toBeNull();

    await store.db().insert(schema.chapterCompletions).values({ readerId, chapterVersionId: version.id, data: {} as never });
    expect(await store.getFirstChapterIntro(readerId, bookId)).toBeNull();
  });
});

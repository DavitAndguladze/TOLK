import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, test } from "vitest";
import { mockBook, mockChapter, mockChapterVersion } from "../mocks";
import type { ChapterCheckAnswers } from "../types";
import { generateChapterCheck } from "./chapter-check-generator";
import { completeChapter } from "./complete-chapter";
import { getProgressView } from "./progress";

describe.skipIf(!process.env.TOLK_TEST_DATABASE_URL)("getProgressView", () => {
  let database: typeof import("../db");
  let schema: typeof import("../db/schema");
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TOLK_TEST_DATABASE_URL!;
    database = await import("../db");
    schema = await import("../db/schema");
    const { migrate } = await import("drizzle-orm/mysql2/migrator");
    await migrate(database.db(), { migrationsFolder: "drizzle" });
  });

  const grading = { keyPointGrader: async () => ({ grade: 2 as const, feedback: "Yes.", gradedBy: "stand-in" as const }), now: () => new Date() };

  async function fixture() {
    const readerId = randomUUID(), bookId = randomUUID();
    await database.db().insert(schema.user).values({ id: readerId, name: "Progress test", email: `${readerId}@example.com` });
    const chapters = [1, 2].map((number) => ({ ...mockChapter, id: `${bookId}-ch${number}`, bookId, number }));
    const versions = await Promise.all(chapters.map(async (chapter) => {
      const version = { ...mockChapterVersion(4), id: `${chapter.id}-L1`, bookId, chapterId: chapter.id,
        readerId: null, level: 1 as const, chapterNumber: chapter.number };
      return { version, check: await generateChapterCheck(chapter, version) };
    }));
    await database.loadContent({ books: [{ ...mockBook, id: bookId, chapterCount: 2 }], chapters, versions });
    return { readerId, bookId, versions };
  }

  /** Every Key Point correct; the Complex Word (vulnerable) answered right or wrong as given. */
  function answersFor(check: Awaited<ReturnType<typeof generateChapterCheck>>, vulnerableCorrect: boolean): ChapterCheckAnswers {
    return {
      answers: check.questions.map((q) => ({
        questionId: q.id,
        via: "typed",
        answer: q.kind === "complex-word"
          ? (vulnerableCorrect ? mockChapter.complexWords.find((w) => w.word === "vulnerable")!.meaning : q.choices!.find((c) => c !== mockChapter.complexWords.find((w) => w.word === "vulnerable")!.meaning)!)
          : "His father gave advice.",
      })),
    };
  }

  test("returns null when the Reader hasn't opened the Book", async () => {
    const { readerId, bookId } = await fixture();
    expect(await getProgressView(readerId, bookId)).toBeNull();
  });

  test("builds the Level Line and Word Bank from real completions, and graduates a word in a later Chapter", async () => {
    const { readerId, bookId, versions } = await fixture();
    const [ch1, ch2] = versions;
    await database.setBookProgress(readerId, { bookId, currentChapterNumber: 1, currentLevel: 1, currentVersionId: ch1.version.id });

    await completeChapter(readerId, ch1.check.id, answersFor(ch1.check, false), grading);
    const afterCh1 = await getProgressView(readerId, bookId);
    expect(afterCh1?.levelLine).toEqual([{ chapterNumber: 1, level: 1, result: expect.any(String) }]);
    expect(afterCh1?.wordBank.map((w) => w.word)).toContain("vulnerable");
    expect(afterCh1?.wordsLearned).toEqual({ total: 0, thisChapter: [] });

    await database.setBookProgress(readerId, { bookId, currentChapterNumber: 2, currentLevel: 1, currentVersionId: ch2.version.id });
    await completeChapter(readerId, ch2.check.id, answersFor(ch2.check, true), grading);

    const afterCh2 = await getProgressView(readerId, bookId);
    expect(afterCh2?.levelLine.map((l) => l.chapterNumber)).toEqual([1, 2]);
    expect(afterCh2?.wordsLearned).toEqual({ total: 1, thisChapter: ["vulnerable"] });
    expect(afterCh2?.wordBank.map((w) => w.word)).not.toContain("vulnerable");
  });
});

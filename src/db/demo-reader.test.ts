// Integration: needs MySQL (`npm run db:up`, then DATABASE_URL=mysql://tolk:tolk@localhost:3306/tolk). Skipped otherwise.
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { mockBook, mockChapter, mockChapterCheck, mockChapterVersion } from "../mocks";
import type { Level, SessionResult } from "../types";

const enabled = Boolean(process.env.DATABASE_URL);

describe.skipIf(!enabled)("demo returning Reader", () => {
  let store: typeof import(".");
  let demo: typeof import("./demo-reader");
  let schema: typeof import("./schema");
  let decideNextLevel: typeof import("../comprehension/level-rules").decideNextLevel;
  const bookId = `demo-book-${randomUUID()}`;

  beforeAll(async () => {
    [store, demo, schema, { decideNextLevel }] = await Promise.all([
      import("."), import("./demo-reader"), import("./schema"), import("../comprehension/level-rules"),
    ]);
    const { migrate } = await import("drizzle-orm/mysql2/migrator");
    await migrate(store.db(), { migrationsFolder: "drizzle" });
    // A three-Chapter Book with shared L1 Versions and their Checks, like an imported Gatsby seed.
    const chapters = [1, 2, 3].map((number) => ({ ...mockChapter, id: `${bookId}-ch${number}`, bookId, number, title: `Chapter ${number}` }));
    await store.loadContent({
      books: [{ ...mockBook, id: bookId, chapterCount: 3 }],
      chapters,
      versions: chapters.map((chapter) => {
        const version = { ...mockChapterVersion(1), id: `${chapter.id}-L1`, bookId, chapterId: chapter.id, chapterNumber: chapter.number };
        return { version, check: { ...mockChapterCheck, id: `check-${version.id}`, chapterVersionId: version.id } };
      }),
    });
  });

  const reader = async () => {
    const id = `reader-${randomUUID()}`;
    await store.db().insert(schema.user).values({ id, name: "Demo", email: `${id}@example.com` });
    return id;
  };

  it("resumes at Chapter 3, L1, with Chapters 1 and 2 completed", async () => {
    const readerId = await reader();
    const seeded = await demo.seedDemoReader(readerId, bookId);

    expect(seeded.resumeVersionId).toBe(`${bookId}-ch3-L1`);
    expect(await store.getBookProgress(readerId, bookId)).toEqual({ bookId, currentChapterNumber: 3, currentLevel: 1, currentVersionId: `${bookId}-ch3-L1` });
    const history = await store.levelHistory(readerId, bookId);
    expect(history.map((s) => [s.chapterNumber, s.level])).toEqual([[1, 1], [2, 1]]);
    expect(await demo.getSavedOutcomes(readerId)).toHaveLength(2);
  });

  it("names the Chapter 3 score that promotes to L2, and one point less holds", async () => {
    const readerId = await reader();
    const { minimumPromotingScore } = await demo.seedDemoReader(readerId, bookId);
    const history = await store.levelHistory(readerId, bookId);
    const third = (score: number): SessionResult => ({ ...history[1], id: randomUUID(), chapterNumber: 3, chapterVersionId: `${bookId}-ch3-L1`, grading: { ...history[1].grading, score } });
    const decide = (score: number) => decideNextLevel(1 as Level, third(score).grading, [...history, third(score)]).to;

    expect(minimumPromotingScore).not.toBeNull();
    const score = minimumPromotingScore!;
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThanOrEqual(100);
    expect(decide(score)).toBe(2);
    expect(decide(score - 1)).toBe(1);
  });

  it("reset clears only the demo Reader, and seeding again gives the same history", async () => {
    const readerId = await reader();
    const other = await reader();
    await demo.seedDemoReader(other, bookId);
    await demo.seedDemoReader(readerId, bookId);
    await demo.seedDemoReader(readerId, bookId);

    expect(await store.levelHistory(readerId, bookId)).toHaveLength(2);
    await demo.resetDemoReader(readerId);
    expect(await store.getBookProgress(readerId, bookId)).toBeNull();
    expect(await store.levelHistory(readerId, bookId)).toEqual([]);
    expect(await demo.getSavedOutcomes(readerId)).toEqual([]);
    expect(await store.levelHistory(other, bookId)).toHaveLength(2);
  });

  it("refuses a Book without shared L1 Versions for Chapters 1 to 3", async () => {
    const readerId = await reader();
    await expect(demo.seedDemoReader(readerId, `missing-${randomUUID()}`)).rejects.toThrow(/Chapter 1/);
  });
});

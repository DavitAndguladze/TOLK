// Integration: needs MySQL (`npm run db:up`, then DATABASE_URL=mysql://tolk:tolk@localhost:3306/tolk). Skipped otherwise.
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { mockSession } from "../mocks";
import type { Level, SessionResult } from "../types";

const enabled = Boolean(process.env.DATABASE_URL);

describe.skipIf(!enabled)("Session Results and Level history", () => {
  let store: typeof import(".");
  beforeAll(async () => {
    store = await import(".");
    const { migrate } = await import("drizzle-orm/mysql2/migrator");
    await migrate(store.db(), { migrationsFolder: "drizzle" });
  });

  const reader = async () => {
    const id = `reader-${randomUUID()}`;
    await store.db().insert((await import("./schema")).user).values({ id, name: "Test", email: `${id}@example.com` });
    return id;
  };
  // Strictly increasing and never behind the server clock that stamps Level changes.
  let clock = 0;
  const session = (readerId: string, chapterNumber: number, level: Level, score = 90): SessionResult => ({
    ...mockSession,
    id: randomUUID(),
    readerId,
    chapterVersionId: `v-${readerId}-${chapterNumber}-${level}`,
    chapterNumber,
    level,
    grading: { ...mockSession.grading, score },
    completedAt: new Date((clock = Math.max(clock + 1, Date.now() + 1))).toISOString(),
  });
  const progress = (chapter: number, level: Level) => ({ bookId: "gatsby", currentChapterNumber: chapter, currentLevel: level, currentVersionId: `v-${chapter}-${level}` });

  it("keeps the first result when the same Chapter Version is submitted twice", async () => {
    const r = await reader();
    const first = session(r, 1, 1, 90);
    expect(await store.recordSessionResult(first, "gatsby")).toEqual(first);
    const again = { ...first, id: randomUUID(), grading: { ...first.grading, score: 10 } };
    expect(await store.recordSessionResult(again, "gatsby")).toEqual(first);
    expect(await store.levelHistory(r, "gatsby")).toEqual([first]);
  });

  it("returns this Reader's results for this Book, oldest first", async () => {
    const r = await reader();
    const a = session(r, 1, 1), b = session(r, 2, 1);
    await store.recordSessionResult(b, "gatsby");
    await store.recordSessionResult(a, "gatsby");
    await store.recordSessionResult(session(await reader(), 1, 1), "gatsby");
    await store.recordSessionResult(session(r, 1, 1), "another-book");
    expect((await store.levelHistory(r, "gatsby")).map((s) => s.id)).toEqual([a.id, b.id]);
  });

  it("starts over after a Level change, but not when the Level holds", async () => {
    const r = await reader();
    await store.setBookProgress(r, progress(1, 1));
    const a = session(r, 1, 1);
    await store.recordSessionResult(a, "gatsby");
    await store.setBookProgress(r, progress(2, 1)); // hold
    const b = session(r, 2, 1);
    await store.recordSessionResult(b, "gatsby");
    expect((await store.levelHistory(r, "gatsby")).map((s) => s.id)).toEqual([a.id, b.id]);

    await store.setBookProgress(r, progress(3, 2)); // up one
    expect(await store.levelHistory(r, "gatsby")).toEqual([]);
    const c = session(r, 3, 2);
    await store.recordSessionResult(c, "gatsby");
    expect((await store.levelHistory(r, "gatsby")).map((s) => s.id)).toEqual([c.id]);
  });

  it("counts a re-read Chapter once, by its latest result", async () => {
    const r = await reader();
    const first = session(r, 1, 1, 40);
    const reread = { ...session(r, 1, 1, 95), chapterVersionId: "v-reread" };
    await store.recordSessionResult(first, "gatsby");
    await store.recordSessionResult(reread, "gatsby");
    expect((await store.levelHistory(r, "gatsby")).map((s) => s.id)).toEqual([reread.id]);
  });
});

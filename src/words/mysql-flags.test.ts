import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { inArray } from "drizzle-orm";
import { db, loadContent } from "../db";
import { user } from "../db/schema";
import { mockBook, mockChapter, mockChapterCheck, mockChapterVersion } from "../mocks";
import { listFlags, removeFlag, saveFlag } from "./mysql-flags";

const url = process.env.TOLK_TEST_DATABASE_URL;
describe.runIf(Boolean(url))("persisted Reader flags", () => {
  const readers = [randomUUID(), randomUUID()];
  const version = mockChapterVersion(1);
  beforeAll(async () => {
    if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Use an isolated local MySQL test database");
    process.env.DATABASE_URL = url;
    await db().insert(user).values(readers.map((id) => ({ id, name: "R5 test", email: `${id}@example.invalid` })));
    await loadContent({ books: [mockBook], chapters: [mockChapter], versions: [{ version, check: mockChapterCheck }] });
  });
  afterAll(async () => { await db().delete(user).where(inArray(user.id, readers)); });

  test("reloads a canonical flag, deduplicates it, and isolates removal between Readers", async () => {
    expect(await saveFlag(readers[0], version, -1)).toBeNull();
    const first = await saveFlag(readers[0], version, 5);
    expect(first?.word).toBe("father");
    expect(await saveFlag(readers[0], version, 5)).toEqual(first);
    expect(await listFlags(readers[0], version.id)).toEqual([first]);
    expect(await listFlags(readers[1], version.id)).toEqual([]);
    await saveFlag(readers[1], version, 5);
    await removeFlag(readers[0], version.id, 5);
    expect(await listFlags(readers[0], version.id)).toEqual([]);
    expect((await listFlags(readers[1], version.id)).map((flag) => flag.word)).toEqual(["father"]);
  });
});

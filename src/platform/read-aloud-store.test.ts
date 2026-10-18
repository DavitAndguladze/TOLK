import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import type { ReadAloudSummary } from "../types";
import { createInMemoryReadAloudStore, createMySqlReadAloudStore, type ReadAloudStore } from "./read-aloud-store";

const summary = (chapterVersionId: string, accuracy: number): ReadAloudSummary => ({
  chapterVersionId, startedAt: "2026-10-17T22:00:00Z", endedAt: "2026-10-17T22:05:00Z", accuracy, misses: [], wordResults: [],
});

async function migrated() {
  const [{ migrate }, { db }] = await Promise.all([import("drizzle-orm/mysql2/migrator"), import("../db/client")]);
  await migrate(db(), { migrationsFolder: "drizzle" });
}

// Same rules for both stores. The MySQL run is an integration test: needs DATABASE_URL (`npm run db:up`), skipped otherwise.
describe.each([
  { name: "in memory", create: createInMemoryReadAloudStore, setup: async () => {} },
  ...(process.env.DATABASE_URL ? [{ name: "MySQL", create: createMySqlReadAloudStore, setup: migrated }] : []),
])("read-aloud store ($name)", ({ create, setup }) => {
  let store: ReadAloudStore;
  // Fresh Readers per test, so MySQL rows from earlier runs never leak in.
  let ana: string, ben: string;
  beforeAll(setup);
  beforeEach(() => {
    store = create();
    [ana, ben] = [`ana-${randomUUID()}`, `ben-${randomUUID()}`];
  });

  test("returns null when the Reader didn't read this Chapter Version aloud", async () => {
    expect(await store.get(ana, "v1")).toBeNull();
  });

  test("returns the saved summary for that Reader and Chapter Version", async () => {
    await store.save(ana, summary("v1", 0.9));
    expect(await store.get(ana, "v1")).toEqual(summary("v1", 0.9));
  });

  test("keeps Readers sharing a Chapter Version apart, and each Chapter Version", async () => {
    await store.save(ana, summary("v1", 0.9));
    await store.save(ben, summary("v1", 0.4));
    expect((await store.get(ana, "v1"))?.accuracy).toBe(0.9);
    expect((await store.get(ben, "v1"))?.accuracy).toBe(0.4);
    expect(await store.get(ana, "v2")).toBeNull();
  });

  test("a later reading of the same Chapter Version replaces the earlier one", async () => {
    await store.save(ana, summary("v1", 0.5));
    await store.save(ana, summary("v1", 0.8));
    expect((await store.get(ana, "v1"))?.accuracy).toBe(0.8);
  });

  test("a consumed summary is gone, so a silent reread of the same Chapter Version gets null", async () => {
    await store.save(ana, summary("v1", 1));
    const graded = (await store.get(ana, "v1"))!;
    await store.consume(ana, graded);
    expect(await store.get(ana, "v1")).toBeNull();
  });

  test("consuming an older summary keeps a newer save that landed meanwhile", async () => {
    await store.save(ana, summary("v1", 0.5));
    const graded = (await store.get(ana, "v1"))!;
    await store.save(ana, summary("v1", 0.8));
    await store.consume(ana, graded);
    expect((await store.get(ana, "v1"))?.accuracy).toBe(0.8);
  });

  test("consuming only touches that Reader", async () => {
    await store.save(ana, summary("v1", 0.9));
    await store.save(ben, summary("v1", 0.4));
    await store.consume(ana, (await store.get(ana, "v1"))!);
    expect((await store.get(ben, "v1"))?.accuracy).toBe(0.4);
  });

  // A real reading's numbers aren't round: accuracy is correct/total, and timings and confidence come from the
  // speech engine. MySQL's JSON column can re-serialise a double (412.70000000000005 comes back as
  // 412.7000000000001), so compare numbers to float precision. consume compares both sides as JSON, so it still
  // finds the row: the reading is spent and a silent reread gets null (0024).
  test("a real reading round-trips to float precision, and consuming it still spends it", async () => {
    const reading: ReadAloudSummary = {
      chapterVersionId: "v1", startedAt: "2026-10-17T22:00:00.123Z", endedAt: "2026-10-17T22:04:31.987Z",
      accuracy: 22 / 23,
      wordResults: [
        { tokenIndex: 0, outcome: "correct", heard: "In", startMs: 1234.5, endMs: 1234.5 + 0.1 + 0.2, confidence: 0.873, hesitationMs: 0 },
        { tokenIndex: 1, outcome: "mispronounced", heard: "my", startMs: 1601.0000000000002, endMs: 1890.3, confidence: 2 / 3, hesitationMs: 412.70000000000005 },
      ],
      misses: [{ word: "younger", tokenIndex: 1, kind: "mispronounced" }],
    };
    await store.save(ana, reading);
    const graded = (await store.get(ana, "v1"))!;
    const near = (n: number | undefined) => expect.closeTo(n!, 9);
    expect(graded).toEqual({
      ...reading,
      accuracy: near(reading.accuracy),
      wordResults: reading.wordResults.map((w) => ({ ...w, startMs: near(w.startMs), endMs: near(w.endMs), confidence: near(w.confidence), hesitationMs: near(w.hesitationMs) })),
    });
    await store.consume(ana, graded);
    expect(await store.get(ana, "v1")).toBeNull();
  });
});

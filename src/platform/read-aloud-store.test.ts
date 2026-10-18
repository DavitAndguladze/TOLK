import { describe, expect, test } from "vitest";
import type { ReadAloudSummary } from "../types";
import { createInMemoryReadAloudStore } from "./read-aloud-store";

const summary = (chapterVersionId: string, accuracy: number): ReadAloudSummary => ({
  chapterVersionId, startedAt: "2026-10-17T22:00:00Z", endedAt: "2026-10-17T22:05:00Z", accuracy, misses: [], wordResults: [],
});

describe("read-aloud store", () => {
  test("returns null when the Reader didn't read this Chapter Version aloud", async () => {
    expect(await createInMemoryReadAloudStore().get("ana", "v1")).toBeNull();
  });

  test("returns the saved summary for that Reader and Chapter Version", async () => {
    const store = createInMemoryReadAloudStore();
    await store.save("ana", summary("v1", 0.9));
    expect(await store.get("ana", "v1")).toEqual(summary("v1", 0.9));
  });

  test("keeps Readers sharing a Chapter Version apart, and each Chapter Version", async () => {
    const store = createInMemoryReadAloudStore();
    await store.save("ana", summary("v1", 0.9));
    await store.save("ben", summary("v1", 0.4));
    expect((await store.get("ana", "v1"))?.accuracy).toBe(0.9);
    expect((await store.get("ben", "v1"))?.accuracy).toBe(0.4);
    expect(await store.get("ana", "v2")).toBeNull();
  });

  test("a later reading of the same Chapter Version replaces the earlier one", async () => {
    const store = createInMemoryReadAloudStore();
    await store.save("ana", summary("v1", 0.5));
    await store.save("ana", summary("v1", 0.8));
    expect((await store.get("ana", "v1"))?.accuracy).toBe(0.8);
  });
});

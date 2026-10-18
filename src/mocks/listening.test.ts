import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { ListeningEvent, ReadAloudSummary } from "../types";
import { mockChapterVersion } from "./fixtures";
import { createMockListeningSource } from "./listening";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test("reports misses in a later chunk by the Chapter Version's own token index", async () => {
  const version = mockChapterVersion(1);
  // L1's last sentence is tokens 23-32: "Not everyone has had the good things you have had.”"
  const chunk = { chapterVersionId: version.id, tokens: version.tokens.slice(23, 33) };
  const source = createMockListeningSource({ wordIntervalMs: 10, mispronounce: [28], skip: [30] });
  const events: ListeningEvent[] = [];

  await source.start(chunk, (e) => events.push(e));
  await vi.runAllTimersAsync();

  const done = events.find((e) => e.type === "chunk-complete") as { summary: ReadAloudSummary } | undefined;
  expect(done?.summary.misses).toEqual([
    { word: "good", tokenIndex: 28, kind: "mispronounced" },
    { word: "you", tokenIndex: 30, kind: "skipped" },
  ]);
  expect(done?.summary.accuracy).toBe(0.8);
});

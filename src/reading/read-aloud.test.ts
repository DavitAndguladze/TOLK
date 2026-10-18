import { afterEach, expect, test, vi } from "vitest";
import { createMockListeningSource, mockChapterVersion } from "../mocks";
import { createReadingAttempt } from "./read-aloud";

afterEach(() => vi.useRealTimers());

test("Chapter finish combines completed and paused Chunks while retaining unread words", async () => {
  vi.useFakeTimers();
  const fixture = mockChapterVersion(1);
  const version = { id: fixture.id, tokens: fixture.tokens.slice(0, 4) };
  const attempt = createReadingAttempt(version, createMockListeningSource({ wordIntervalMs: 10 }));
  await attempt.start({ chapterVersionId: version.id, tokens: version.tokens.slice(0, 2) }, () => {});
  await vi.advanceTimersByTimeAsync(20);
  await attempt.stop(); // React cleanup after the completion event must not duplicate the fragment.
  await attempt.start({ chapterVersionId: version.id, tokens: version.tokens.slice(2) }, () => {});
  await vi.advanceTimersByTimeAsync(10);
  const result = await attempt.finish();
  expect(result?.accuracy).toBe(0.75);
  expect(result?.wordResults.map(word => word.outcome)).toEqual(["correct", "correct", "correct", "pending"]);
  expect(result?.misses).toEqual([]);
});

test("silent reading and a Start immediately followed by Stop do not produce zero-accuracy attempts", async () => {
  vi.useFakeTimers();
  const version = mockChapterVersion(1);
  const attempt = createReadingAttempt(version, createMockListeningSource({ wordIntervalMs: 10 }));
  expect(await attempt.finish()).toBeNull();
  await attempt.start({ chapterVersionId: version.id, tokens: version.tokens }, () => {});
  await attempt.stop();
  expect(await attempt.finish()).toBeNull();
});

test("Stop cancels a queued resume so it cannot restart the stream after the Reader paused", async () => {
  vi.useFakeTimers();
  const version = mockChapterVersion(1);
  const attempt = createReadingAttempt(version, createMockListeningSource({ wordIntervalMs: 10 }));
  const events: string[] = [];
  await attempt.start({ chapterVersionId: version.id, tokens: version.tokens }, event => events.push(event.type));
  const resumed = attempt.start({ chapterVersionId: version.id, tokens: version.tokens }, event => events.push(event.type));
  await attempt.stop();
  await resumed;
  await vi.advanceTimersByTimeAsync(1000);
  expect(events).toEqual([]);
  expect(await attempt.finish()).toBeNull();
});

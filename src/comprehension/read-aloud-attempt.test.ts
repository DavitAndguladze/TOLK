import { describe, expect, test } from "vitest";
import type { ReadAloudSummary } from "../types";
import { readAloudForAttempt } from "./read-aloud-attempt";

const reading = (startedAt: string, accuracy: number): ReadAloudSummary => ({
  chapterVersionId: "gatsby-ch1-L4", startedAt, endedAt: "2026-10-17T23:59:00Z", accuracy, wordResults: [], misses: [],
});
const first = reading("2026-10-17T23:00:00Z", 1);
const second = reading("2026-10-17T23:30:00Z", 0.8);

describe("readAloudForAttempt", () => {
  test("uses the saved reading when the answers name it", () => {
    expect(readAloudForAttempt(second.startedAt, [second])).toBe(second);
  });

  test("is null for a silent reread, even with an older reading still saved (comms 0024)", () => {
    expect(readAloudForAttempt(null, [first])).toBeNull();
    expect(readAloudForAttempt(undefined, [first])).toBeNull();
  });

  test("is null when this attempt's save failed and only an older reading is saved", () => {
    expect(readAloudForAttempt(second.startedAt, [first])).toBeNull();
  });

  test("finds the reading a retried submission was already graded with, after it was spent", () => {
    // First submission graded with `second` and spent it; the response was lost and the client retries.
    expect(readAloudForAttempt(second.startedAt, [null, second])).toBe(second);
  });

  test("matches the same instant however it's written (the read-aloud route stores toISOString())", () => {
    const saved = reading("2026-10-17T22:50:00.000Z", 0.95);

    expect(readAloudForAttempt("2026-10-17T22:50:00Z", [saved])).toBe(saved);
    expect(readAloudForAttempt("2026-10-17T22:50:00.001Z", [saved])).toBeNull();
  });

  test("ignores a readAloudStartedAt that isn't a string or a date (the body comes from the client)", () => {
    expect(readAloudForAttempt("not a date", [reading("not a date", 1)])).toBeNull();
    expect(readAloudForAttempt(123, [first])).toBeNull();
    expect(readAloudForAttempt({ startedAt: first.startedAt }, [first])).toBeNull();
  });
});

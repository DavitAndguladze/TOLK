import { describe, expect, test } from "vitest";
import type { Streak } from "../types";
import { currentStreak, recordReadingDay } from "./streak";

const none: Streak = { current: 0, longest: 0, lastDay: null };

describe("recordReadingDay", () => {
  test("the Reader's first Chapter Check day starts a Streak of 1", () => {
    expect(recordReadingDay(none, "2026-10-17")).toEqual({ current: 1, longest: 1, lastDay: "2026-10-17" });
  });

  test("a Chapter Check on the next day extends the Streak", () => {
    const s: Streak = { current: 3, longest: 3, lastDay: "2026-10-16" };
    expect(recordReadingDay(s, "2026-10-17")).toEqual({ current: 4, longest: 4, lastDay: "2026-10-17" });
  });

  test("a second Chapter Check on the same day counts once", () => {
    const s: Streak = { current: 4, longest: 7, lastDay: "2026-10-17" };
    expect(recordReadingDay(s, "2026-10-17")).toEqual(s);
  });

  test("a missed day resets the Streak to 1 but keeps the longest", () => {
    const s: Streak = { current: 5, longest: 5, lastDay: "2026-10-15" };
    expect(recordReadingDay(s, "2026-10-17")).toEqual({ current: 1, longest: 5, lastDay: "2026-10-17" });
  });

  test.each([
    ["month end", "2026-09-30", "2026-10-01"],
    ["year end", "2026-12-31", "2027-01-01"],
    ["leap day", "2028-02-28", "2028-02-29"],
    ["after leap day", "2028-02-29", "2028-03-01"],
    ["non-leap February", "2027-02-28", "2027-03-01"],
    ["US DST change", "2026-03-07", "2026-03-08"],
  ])("consecutive across %s", (_, prev, next) => {
    const s: Streak = { current: 2, longest: 2, lastDay: prev };
    expect(recordReadingDay(s, next).current).toBe(3);
  });

  test("a gap across a non-leap February end resets", () => {
    const s: Streak = { current: 2, longest: 2, lastDay: "2027-02-28" };
    expect(recordReadingDay(s, "2027-03-02").current).toBe(1);
  });

  test("a day earlier than the last recorded day leaves the Streak unchanged", () => {
    const s: Streak = { current: 3, longest: 3, lastDay: "2026-10-17" };
    expect(recordReadingDay(s, "2026-10-15")).toEqual(s);
  });
});

describe("currentStreak", () => {
  const s: Streak = { current: 4, longest: 9, lastDay: "2026-10-16" };

  test("is 0 for a Reader with no Chapter Check days", () => {
    expect(currentStreak(none, "2026-10-17")).toBe(0);
  });

  test("still counts when the last Chapter Check was today", () => {
    expect(currentStreak({ ...s, lastDay: "2026-10-17" }, "2026-10-17")).toBe(4);
  });

  test("still counts when the last Chapter Check was yesterday (today not done yet)", () => {
    expect(currentStreak(s, "2026-10-17")).toBe(4);
  });

  test("is 0 once a whole day was missed, without changing the stored Streak", () => {
    const stored = { ...s };
    expect(currentStreak(stored, "2026-10-18")).toBe(0);
    expect(stored).toEqual(s);
  });

  test("handles yesterday across a year boundary", () => {
    expect(currentStreak({ ...s, lastDay: "2026-12-31" }, "2027-01-01")).toBe(4);
  });
});

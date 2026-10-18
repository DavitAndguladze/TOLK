import type { Streak } from "../types";

const DAY_MS = 86_400_000;

/** Whole calendar days from `from` to `to`, both `YYYY-MM-DD` (parsed as UTC, so no DST drift). */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);
}

/**
 * Record that the Reader completed a Chapter Check on `day` — their local calendar
 * date as `YYYY-MM-DD` (the caller picks the timezone).
 */
export function recordReadingDay(streak: Streak, day: string): Streak {
  const gap = streak.lastDay === null ? Infinity : daysBetween(streak.lastDay, day);
  if (gap <= 0) return streak; // same day counts once; a stale earlier day changes nothing
  const current = gap === 1 ? streak.current + 1 : 1;
  return { current, longest: Math.max(streak.longest, current), lastDay: day };
}

/**
 * The Streak to show on `today` (the Reader's local `YYYY-MM-DD`): the stored count while
 * the last Chapter Check was today or yesterday, 0 once a whole day has been missed.
 */
export function currentStreak(streak: Streak, today: string): number {
  if (streak.lastDay === null) return 0;
  return daysBetween(streak.lastDay, today) <= 1 ? streak.current : 0;
}

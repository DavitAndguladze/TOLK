import { FAVOURITE_GENRES, READING_GOALS, type ReaderPreferences } from "../types";

/** At least one known value per list, duplicates dropped; anything else is null. */
function pick<T extends string>(value: unknown, allowed: readonly T[]): T[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (!value.every((v) => allowed.includes(v))) return null;
  return [...new Set(value as T[])];
}

/** A PUT /api/reader/preferences body as ReaderPreferences (#99), or null when it isn't valid. */
export function parseReaderPreferences(body: unknown): ReaderPreferences | null {
  const { readingGoals, favouriteGenres } = (body ?? {}) as Record<string, unknown>;
  const goals = pick(readingGoals, READING_GOALS);
  const genres = pick(favouriteGenres, FAVOURITE_GENRES);
  return goals && genres ? { readingGoals: goals, favouriteGenres: genres } : null;
}

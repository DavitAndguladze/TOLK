import { describe, expect, it } from "vitest";
import { parseReaderPreferences } from "./reader-preferences";

describe("parseReaderPreferences (#99)", () => {
  it("accepts known Reading Goals and Favourite Genres", () => {
    expect(parseReaderPreferences({ readingGoals: ["vocabulary", "comprehension"], favouriteGenres: ["horror"] })).toEqual({
      readingGoals: ["vocabulary", "comprehension"],
      favouriteGenres: ["horror"],
    });
  });

  it("drops duplicates, keeping first-picked order", () => {
    expect(parseReaderPreferences({ readingGoals: ["vocabulary", "vocabulary"], favouriteGenres: ["romance", "horror", "romance"] })).toEqual({
      readingGoals: ["vocabulary"],
      favouriteGenres: ["romance", "horror"],
    });
  });

  it.each([
    ["no goals", { readingGoals: [], favouriteGenres: ["horror"] }],
    ["no genres", { readingGoals: ["vocabulary"], favouriteGenres: [] }],
    ["an unknown goal", { readingGoals: ["speed"], favouriteGenres: ["horror"] }],
    ["an unknown genre", { readingGoals: ["vocabulary"], favouriteGenres: ["poetry"] }],
    ["a non-array", { readingGoals: "vocabulary", favouriteGenres: ["horror"] }],
    ["a missing field", { readingGoals: ["vocabulary"] }],
    ["null", null],
  ])("rejects %s", (_, body) => {
    expect(parseReaderPreferences(body)).toBeNull();
  });
});

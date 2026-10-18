import { describe, expect, it } from "vitest";
import { inGenres, parseGenre } from "./book-genres";

describe("Library genres", () => {
  const books = [{ id: "gatsby-full" }, { id: "unknown-book" }];

  it("keeps only Books in one of the genres", () => {
    expect(inGenres(books, ["romance"])).toEqual([{ id: "gatsby-full" }]);
    expect(inGenres(books, ["horror"])).toEqual([]);
    expect(inGenres(books, [])).toEqual([]);
  });

  it("accepts only known genres from the query string", () => {
    expect(parseGenre("romance")).toBe("romance");
    expect(parseGenre("nope")).toBeNull();
    expect(parseGenre(["romance"])).toBeNull();
    expect(parseGenre(undefined)).toBeNull();
  });
});

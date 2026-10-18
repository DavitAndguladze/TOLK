import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { GATSBY_BOOK, parseGatsby } from "./gatsby.ts";

const source = readFileSync(new URL("../data/gatsby/pg64317.txt", import.meta.url), "utf8");

describe("Gatsby ingestion source", () => {
  test("extracts complete original Chapters rather than the table of contents", () => {
    const chapters = parseGatsby(source);
    expect(chapters).toHaveLength(GATSBY_BOOK.chapterCount);
    expect(chapters.slice(0, 4).map((chapter) => chapter.number)).toEqual([1, 2, 3, 4]);
    expect(chapters.slice(0, 4).map((chapter) => chapter.id)).toEqual(["gatsby-ch1", "gatsby-ch2", "gatsby-ch3", "gatsby-ch4"]);
    expect(chapters[0].originalText).toMatch(/^In my younger and more vulnerable years/);
    expect(chapters.at(-1)?.originalText.slice(-100)).toMatch(/borne back ceaselessly into\s+the past\.$/);
    for (const chapter of chapters) {
      expect(chapter.originalText.split(/\s+/).length).toBeGreaterThan(2000);
      expect(chapter.originalText).not.toMatch(/Table of Contents|END OF THE PROJECT GUTENBERG/);
      expect(chapter.bookId).toBe(GATSBY_BOOK.id);
    }
  });

  test("normalizes line endings without losing paragraph breaks or punctuation", () => {
    const chapter = parseGatsby(source)[0];
    expect(chapter.originalText).not.toContain("\r");
    expect(chapter.originalText).toContain("\n\n");
    expect(chapter.originalText).toContain("I’ve");
    expect(parseGatsby(source.replace(/\r\n/g, "\n"))).toEqual(parseGatsby(source));
  });

  test("rejects incomplete or different source documents", () => {
    expect(() => parseGatsby("The Great Gatsby\nI\nA short excerpt.")).toThrow();
    expect(() => parseGatsby(source.replace(/\*\*\* END OF THE PROJECT GUTENBERG EBOOK THE GREAT GATSBY \*\*\*/, ""))).toThrow();
    expect(() => parseGatsby(source.replace(/\n\s*IV\s*\r?\n/g, "\n"))).toThrow();
  });
});

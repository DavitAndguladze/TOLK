import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { GATSBY_BOOK, parseGatsby } from "./gatsby.ts";

const source = readFileSync(new URL("../data/gatsby/pg64317.txt", import.meta.url), "utf8");

describe("Gatsby ingestion source", () => {
  test("uses a separate excerpt Book identity to preserve existing immutable full-book content", () => {
    expect(GATSBY_BOOK.id).toBe("gatsby-excerpts");
    expect(GATSBY_BOOK.title).toContain("Excerpts");
  });

  test("extracts clearly labeled opening excerpts at natural paragraph boundaries", () => {
    const chapters = parseGatsby(source);
    expect(chapters).toHaveLength(GATSBY_BOOK.chapterCount);
    expect(chapters.slice(0, 4).map((chapter) => chapter.number)).toEqual([1, 2, 3, 4]);
    expect(chapters.slice(0, 4).map((chapter) => chapter.id)).toEqual(["gatsby-excerpts-ch1", "gatsby-excerpts-ch2", "gatsby-excerpts-ch3", "gatsby-excerpts-ch4"]);
    expect(chapters[0].originalText).toMatch(/^In my younger and more vulnerable years/);
    for (const chapter of chapters) {
      const wordCount = chapter.originalText.split(/\s+/).length;
      expect(wordCount).toBeGreaterThanOrEqual(800);
      expect(wordCount).toBeLessThanOrEqual(1200);
      expect(chapter.title).toBe(`Chapter ${chapter.number} (excerpt)`);
      expect(chapter.originalText).not.toMatch(/\n\s*-{3,}\s*\n/);
      expect(chapter.originalText).toMatch(/[.!?][”’\"]?$/);
      expect(chapter.originalText).not.toMatch(/Table of Contents|END OF THE PROJECT GUTENBERG/);
      expect(chapter.bookId).toBe(GATSBY_BOOK.id);
    }
  });

  test("normalizes line endings and keeps source punctuation in each excerpt", () => {
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

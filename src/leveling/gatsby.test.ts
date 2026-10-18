import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { GATSBY_BOOK, parseGatsby } from "./gatsby.ts";
import { splitOriginalSentences } from "./content.ts";
import type { IngestedGatsby } from "./ingestion.ts";

const source = readFileSync(new URL("../data/gatsby/pg64317.txt", import.meta.url), "utf8");

describe("Gatsby ingestion source", () => {
  test("stored metadata cites the pinned complete originals with current sentence indexes", () => {
    const content: IngestedGatsby = JSON.parse(readFileSync(new URL("../data/gatsby/content.json", import.meta.url), "utf8"));
    const originals = parseGatsby(source).slice(0, 4);
    expect(content.book).toEqual(GATSBY_BOOK);
    expect(content.chapters.map(({ keyPoints: _keyPoints, complexWords: _words, ...original }) => original)).toEqual(originals);
    expect(content.chapters.map((chapter) => splitOriginalSentences(chapter.originalText).length)).toEqual([362, 308, 388, 373]);
    for (const chapter of content.chapters) {
      const policy = content.policies[chapter.id];
      const sentences = splitOriginalSentences(chapter.originalText);
      expect(policy.originalEvidence.keyPoints.map((point) => point.keyPointId)).toEqual(chapter.keyPoints.map((point) => point.id));
      expect(policy.originalEvidence.complexWords.map((word) => word.word)).toEqual(chapter.complexWords.map((word) => word.word));
      for (const citation of [...policy.originalEvidence.keyPoints, ...policy.originalEvidence.complexWords]) {
        expect(sentences[citation.originalSentenceIndex]).toContain(citation.quote);
      }
      for (const name of policy.requiredNames) expect(chapter.originalText.replace(/\s+/g, " ")).toContain(name);
    }
  });

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

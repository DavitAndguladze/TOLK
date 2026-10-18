import { expect, test } from "vitest";
import type { Chapter } from "../types";
import { buildChapterVersion } from "./content.ts";

const chapter: Chapter = {
  id: "gatsby-ch2", bookId: "gatsby", number: 2, title: "Chapter 2",
  originalText: "Nick felt vulnerable when he entered Tom's house. Tom gave Nick advice.",
  keyPoints: [], complexWords: [],
};
const metadata = {
  id: "version-2", readerId: "reader-1", level: 1 as const,
  baselineVersionId: "version-1", generatedAt: "2026-10-18T00:00:00Z",
};

test("assembles original mappings and stable global tokens from generated sentence rows", () => {
  const version = buildChapterVersion(chapter, {
    level: 1, levelScore: 12,
    sentences: [
      { text: "Nick felt vulnerable.", originalSentenceIndex: 0 },
      { text: "He entered Tom's house.", originalSentenceIndex: 0 },
      { text: "Tom gave Nick advice.", originalSentenceIndex: 1 },
    ],
    reinforcedWords: [],
  }, metadata);

  expect(version.status).toBe("generating");
  expect(version.text).toBe("Nick felt vulnerable. He entered Tom's house. Tom gave Nick advice.");
  expect(version.sentences[1]).toEqual({
    index: 1, text: "He entered Tom's house.",
    originalText: "Nick felt vulnerable when he entered Tom's house.",
  });
  expect(version.tokens[7]).toEqual({ index: 7, text: "Tom", normalized: "tom", sentenceIndex: 2 });
  expect(version.tokens.at(-1)?.index).toBe(10);
});

test("L5 serves the author's exact text and ignores generated rewriting", () => {
  const original = { ...chapter, originalText: "Nick waited.\n\nTom arrived.\n" };
  const version = buildChapterVersion(original, null, { ...metadata, level: 5 });
  expect(version.text).toBe(original.originalText);
  expect(version.levelScore).toBe(100);
  expect(version.sentences.map((row) => row.text)).toEqual(["Nick waited.", "Tom arrived."]);
  expect(version.sentences.every((row) => row.text === row.originalText)).toBe(true);
  expect(version.reinforcedWords).toEqual([]);
});

test.each([
  null,
  { level: 2 },
  { level: 1, levelScore: NaN },
  { level: 1, levelScore: 10, sentences: [] },
  { level: 1, levelScore: 10, sentences: [{ text: "Nick waited.", originalSentenceIndex: 9 }] },
  { level: 1, levelScore: 10, sentences: [{ text: " ", originalSentenceIndex: 0 }] },
])("rejects malformed generated drafts: %j", (draft) => {
  expect(() => buildChapterVersion(chapter, draft, metadata)).toThrow();
});

test("rejects a summary or reordered draft that does not cover every source sentence", () => {
  for (const mappings of [[0], [1, 0], [0, 0]]) {
    expect(() => buildChapterVersion(chapter, {
      level: 1, levelScore: 10, reinforcedWords: [],
      sentences: mappings.map((originalSentenceIndex) => ({ text: "Nick waited.", originalSentenceIndex })),
    }, metadata)).toThrow(/cover|order/);
  }
});

test("rejects coerced reinforcement types from untrusted model output", () => {
  expect(() => buildChapterVersion(chapter, {
    level: 1, levelScore: 10,
    sentences: [
      { text: "Nick felt vulnerable.", originalSentenceIndex: 0 },
      { text: "Tom gave Nick advice.", originalSentenceIndex: 1 },
    ],
    reinforcedWords: [{ word: "advice", reinforcement: ["plain"], sentenceIndex: 1 }],
  }, metadata)).toThrow(/Reinforced/);
});

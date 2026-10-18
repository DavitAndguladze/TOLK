import { expect, test } from "vitest";
import type { Chapter } from "../types";
import { buildChapterVersion, splitOriginalSentences } from "./content.ts";

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

test("joins Gutenberg hard wraps before creating canonical original sentence mappings", () => {
  const original = {
    ...chapter,
    originalText: "In my younger and more vulnerable years my father gave me some advice\nthat I’ve been turning over in my mind ever since.\n\nTom gave Nick advice.\n",
  };
  const firstSentence = "In my younger and more vulnerable years my father gave me some advice that I’ve been turning over in my mind ever since.";
  expect(splitOriginalSentences(original.originalText)).toEqual([firstSentence, "Tom gave Nick advice."]);
  const version = buildChapterVersion(original, {
    level: 1, levelScore: 10, reinforcedWords: [],
    sentences: [
      { text: "My father gave me advice.", originalSentenceIndex: 0 },
      { text: "I still think about it.", originalSentenceIndex: 0 },
      { text: "Tom gave Nick advice.", originalSentenceIndex: 1 },
    ],
  }, metadata);
  expect(version.sentences[0].originalText).toBe(firstSentence);
  expect(version.sentences[1].originalText).toBe(firstSentence);
  const originalVersion = buildChapterVersion(original, null, { ...metadata, level: 5 });
  expect(originalVersion.text).toBe(original.originalText);
  expect(originalVersion.sentences.map((sentence) => sentence.text)).toEqual([firstSentence, "Tom gave Nick advice."]);
});

test("keeps paragraph boundaries without terminal punctuation while joining CRLF hard wraps", () => {
  expect(splitOriginalSentences("Nick waited\r\nby the door\r\n \t\r\nTom arrived\r\nat dusk\r\n\r\n"))
    .toEqual(["Nick waited by the door", "Tom arrived at dusk"]);
});

test("keeps Gatsby titles and initials with their names instead of inventing sentence boundaries", () => {
  expect(splitOriginalSentences("The eyes of Doctor T. J. Eckleburg are blue. Mr. Wilson waited.\n\nDaisy saw him."))
    .toEqual(["The eyes of Doctor T. J. Eckleburg are blue.", "Mr. Wilson waited.", "Daisy saw him."]);
});

test("excludes Gutenberg section rules from source mappings while preserving exact L5 text", () => {
  const original = { ...chapter, originalText: "Nick waited.\r\n\r\n------------------------------------------------------------------------\r\n\r\nTom arrived.\r\n" };
  expect(splitOriginalSentences(original.originalText)).toEqual(["Nick waited.", "Tom arrived."]);
  const version = buildChapterVersion(original, {
    level: 1, levelScore: 10, reinforcedWords: [],
    sentences: [{ text: "Nick waited.", originalSentenceIndex: 0 }, { text: "Tom arrived.", originalSentenceIndex: 1 }],
  }, metadata);
  expect(version.sentences[1].originalText).toBe("Tom arrived.");
  const exact = buildChapterVersion(original, null, { ...metadata, level: 5 });
  expect(exact.text).toBe(original.originalText);
  expect(exact.sentences).toHaveLength(2);
});

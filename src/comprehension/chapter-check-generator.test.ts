import { describe, expect, test } from "vitest";
import { mockChapter, mockChapterVersion, tokenize } from "../mocks";
import type { Chapter, ChapterVersion } from "../types";
import { generateChapterCheck } from "./chapter-check-generator";

describe("generateChapterCheck", () => {
  test("asks 2-3 Key Point questions and 1-2 Complex Word questions, tied to this Chapter Version", async () => {
    const version = mockChapterVersion(1);
    const check = await generateChapterCheck(mockChapter, version);

    expect(check.chapterVersionId).toBe(version.id);

    const keyPointQuestions = check.questions.filter((q) => q.kind === "key-point");
    const complexWordQuestions = check.questions.filter((q) => q.kind === "complex-word");
    expect(keyPointQuestions.length).toBeGreaterThanOrEqual(2);
    expect(keyPointQuestions.length).toBeLessThanOrEqual(3);
    expect(complexWordQuestions.length).toBeGreaterThanOrEqual(1);
    expect(complexWordQuestions.length).toBeLessThanOrEqual(2);
  });

  test("every key-point question traces back to a real Key Point", async () => {
    const version = mockChapterVersion(1);
    const check = await generateChapterCheck(mockChapter, version);
    const keyPointIds = new Set(mockChapter.keyPoints.map((kp) => kp.id));

    for (const q of check.questions.filter((q) => q.kind === "key-point")) {
      expect(q.keyPointId && keyPointIds.has(q.keyPointId)).toBe(true);
    }
  });

  test("every complex-word question targets a real Complex Word and offers its meaning as a choice", async () => {
    const version = mockChapterVersion(1);
    const check = await generateChapterCheck(mockChapter, version);
    const byWord = new Map(mockChapter.complexWords.map((cw) => [cw.word, cw]));

    for (const q of check.questions.filter((q) => q.kind === "complex-word")) {
      const complexWord = q.word ? byWord.get(q.word) : undefined;
      expect(complexWord).toBeDefined();
      expect(q.choices).toContain(complexWord?.meaning);
      expect(q.choices?.length ?? 0).toBeGreaterThanOrEqual(2);
    }
  });

  test("every answerSentenceIndex points at a real sentence in the Chapter Version", async () => {
    const version = mockChapterVersion(1);
    const check = await generateChapterCheck(mockChapter, version);

    for (const q of check.questions) {
      expect(q.answerSentenceIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerSentenceIndex).toBeLessThan(version.sentences.length);
    }
  });

  test("question ids are unique", async () => {
    const version = mockChapterVersion(1);
    const check = await generateChapterCheck(mockChapter, version);
    const ids = check.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("prioritizes Complex Words that actually appear in this Chapter Version's text", async () => {
    // Chapter-level Complex Words may not survive simplification into a lower Level's rewritten
    // text (that's the point of simplifying) - when only some of them do, prefer those.
    const chapter: Chapter = {
      id: "ch-x",
      bookId: "book-x",
      number: 1,
      title: "Chapter X",
      originalText: "ignored for this test",
      keyPoints: [],
      complexWords: [
        { word: "absentone", meaning: "m1" },
        { word: "present", meaning: "m2" },
        { word: "absenttwo", meaning: "m3" },
      ],
    };
    const sentenceText = "The word present appears here.";
    const version: ChapterVersion = {
      id: "ver-x",
      readerId: null,
      bookId: "book-x",
      chapterId: "ch-x",
      chapterNumber: 1,
      level: 1,
      levelScore: 0,
      status: "ready",
      text: sentenceText,
      sentences: [{ index: 0, text: sentenceText, originalText: sentenceText }],
      tokens: tokenize([sentenceText]),
      reinforcedWords: [],
      baselineVersionId: null,
      generatedAt: "2026-01-01T00:00:00Z",
    };

    const check = await generateChapterCheck(chapter, version);
    const words = check.questions.filter((q) => q.kind === "complex-word").map((q) => q.word);

    expect(words).toContain("present");
  });
});

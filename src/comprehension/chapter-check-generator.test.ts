import { describe, expect, test } from "vitest";
import { mockChapter, mockChapterVersion, tokenize } from "../mocks";
import type { Chapter, ChapterVersion } from "../types";
import { generateChapterCheck } from "./chapter-check-generator";

describe("generateChapterCheck", () => {
  test("asks 2-3 Key Point questions and 1-2 Complex Word questions, tied to this Chapter Version", async () => {
    const version = mockChapterVersion(4); // vulnerable, criticizing and advantages all appear in L4
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
    const version = mockChapterVersion(4);
    const check = await generateChapterCheck(mockChapter, version);
    const byWord = new Map(mockChapter.complexWords.map((cw) => [cw.word, cw]));

    for (const q of check.questions.filter((q) => q.kind === "complex-word")) {
      const complexWord = q.word ? byWord.get(q.word) : undefined;
      expect(complexWord).toBeDefined();
      expect(q.choices).toContain(complexWord?.meaning);
      expect(q.choices?.length ?? 0).toBeGreaterThanOrEqual(2);
    }
  });

  test("the correct meaning isn't always the first choice", async () => {
    // Regression: tapping the top option always scored before choices were rotated.
    const version = mockChapterVersion(4);
    const check = await generateChapterCheck(mockChapter, version);
    const byWord = new Map(mockChapter.complexWords.map((cw) => [cw.word, cw]));
    const complexWordQuestions = check.questions.filter((q) => q.kind === "complex-word");

    const someMeaningIsFirst = complexWordQuestions.some((q) => q.choices?.[0] === (q.word ? byWord.get(q.word)?.meaning : undefined));
    expect(someMeaningIsFirst).toBe(false);
  });

  test("complex-word choices have no duplicates", async () => {
    const version = mockChapterVersion(4);
    const check = await generateChapterCheck(mockChapter, version);

    for (const q of check.questions.filter((q) => q.kind === "complex-word")) {
      expect(new Set(q.choices).size).toBe(q.choices?.length);
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

  test("only asks about Complex Words that appear in this Chapter Version's text", async () => {
    // Chapter-level Complex Words may not survive simplification. One the Reader never saw can't
    // be answered from the text (comms 0016), so absent words are left out.
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

    expect(words).toEqual(["present"]);
  });

  test("points each Key Point question at a served sentence that answers it, not at the author's original", async () => {
    const keyPoint = "Nick's father told him not to criticize other people.";
    const served = ["Nick sat on the porch.", "His father told him not to judge other people."];
    const chapter: Chapter = { ...mockChapter, keyPoints: [{ id: "kp1", chapterId: mockChapter.id, text: keyPoint }], complexWords: [] };
    const version: ChapterVersion = {
      ...mockChapterVersion(1),
      // Sentence 0's original quotes the Key Point word for word, but its served text says nothing about it.
      sentences: [
        { index: 0, text: served[0], originalText: keyPoint },
        { index: 1, text: served[1], originalText: "Something else entirely." },
      ],
      tokens: tokenize(served),
    };

    const check = await generateChapterCheck(chapter, version);

    expect(check.questions[0].answerSentenceIndex).toBe(1);
  });

  test("asks no Complex Word question when none of them appear in the text", async () => {
    // Mock L2 is simplified past all four: no vulnerable, criticizing, advantages or judge ("judging" doesn't match).
    const check = await generateChapterCheck(mockChapter, mockChapterVersion(2));

    expect(check.questions.filter((q) => q.kind === "complex-word")).toEqual([]);
  });
});

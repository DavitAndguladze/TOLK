import { describe, expect, test } from "vitest";
import { mockChapterCheck, mockChapterVersion, mockGrading } from "../mocks";
import { chapterEvidence, updateWordBank, type ChapterEvidence } from "./word-bank";

const chapter = (chapterNumber: number, evidence: Partial<ChapterEvidence> = {}): ChapterEvidence => ({
  chapterNumber,
  missed: [],
  flagged: [],
  seen: [],
  readCorrectly: [],
  answeredCorrectly: [],
  ...evidence,
});

describe("Word Bank", () => {
  test("adds a word the Reader got wrong, with source wrong", () => {
    const { bank } = updateWordBank([], chapter(1, { missed: ["advice"], seen: ["advice"] }));
    expect(bank).toEqual([{ word: "advice", source: "wrong", timesSeen: 1, graduated: false, addedInChapter: 1, graduatedInChapter: null }]);
  });

  test("adds a Flagged Word with source flagged, and a word both missed and flagged only once", () => {
    const { bank } = updateWordBank([], chapter(1, { missed: ["advice", "advice"], flagged: ["quick", "advice"] }));
    expect(bank.map(({ word, source }) => ({ word, source }))).toEqual([
      { word: "advice", source: "wrong" },
      { word: "quick", source: "flagged" },
    ]);
  });

  test("counts each later Chapter a bank word appears in", () => {
    const ch1 = updateWordBank([], chapter(1, { flagged: ["advice"], seen: ["advice", "father"] }));
    const ch2 = updateWordBank(ch1.bank, chapter(2, { seen: ["advice", "father"], missed: ["advice"] }));
    const ch3 = updateWordBank(ch2.bank, chapter(3, { seen: ["gatsby"] }));
    expect(ch3.bank).toEqual([{ word: "advice", source: "flagged", timesSeen: 2, graduated: false, addedInChapter: 1, graduatedInChapter: null }]);
  });

  test("does not graduate a word from correct pronunciation alone in a later Chapter", () => {
    const ch1 = updateWordBank([], chapter(1, { flagged: ["vulnerable"], seen: ["vulnerable"] }));
    const ch2 = updateWordBank(ch1.bank, chapter(2, { seen: ["advice"] }));
    const ch3 = updateWordBank(ch2.bank, chapter(3, { seen: ["vulnerable"], readCorrectly: ["vulnerable"] }));
    expect(ch3).toEqual({
      bank: [{ word: "vulnerable", source: "flagged", timesSeen: 2, graduated: false, addedInChapter: 1, graduatedInChapter: null }],
      graduatedThisChapter: [],
      wordsLearnedTotal: 0,
    });
  });

  test("graduates a Complex Word answered correctly in a later Chapter, without reading aloud", () => {
    const ch1 = updateWordBank([], chapter(1, { missed: ["criticizing"] }));
    const ch2 = updateWordBank(ch1.bank, chapter(2, { answeredCorrectly: ["criticizing"] }));
    expect(ch2.graduatedThisChapter).toEqual(["criticizing"]);
  });

  test("doesn't graduate a word in the Chapter it entered", () => {
    const { wordsLearnedTotal } = updateWordBank([], chapter(1, { missed: ["advice"], answeredCorrectly: ["advice"] }));
    expect(wordsLearnedTotal).toBe(0);
  });

  test("doesn't graduate a word flagged again in the Chapter it was answered correctly", () => {
    const ch1 = updateWordBank([], chapter(1, { flagged: ["quick"] }));
    const ch2 = updateWordBank(ch1.bank, chapter(2, { flagged: ["quick"], answeredCorrectly: ["quick"] }));
    expect(ch2.wordsLearnedTotal).toBe(0);
  });

  test("graduates a Complex Word answered correctly even when it was mispronounced aloud in that Chapter", () => {
    const ch1 = updateWordBank([], chapter(1, { flagged: ["judge"] }));
    const ch2 = updateWordBank(ch1.bank, chapter(2, { missed: ["judge"], answeredCorrectly: ["judge"] }));
    expect(ch2.graduatedThisChapter).toEqual(["judge"]);
  });

  test("returns a Graduated Word flagged again to the bank, keeping its times seen, and Words Learned drops", () => {
    const ch1 = updateWordBank([], chapter(1, { flagged: ["vulnerable", "advice"] }));
    const ch2 = updateWordBank(ch1.bank, chapter(2, { answeredCorrectly: ["vulnerable", "advice"] }));
    expect(ch2.wordsLearnedTotal).toBe(2);
    const ch3 = updateWordBank(ch2.bank, chapter(3, { flagged: ["vulnerable"], answeredCorrectly: ["vulnerable"] }));
    expect(ch3.bank.find((e) => e.word === "vulnerable")).toEqual({
      word: "vulnerable", source: "flagged", timesSeen: 2, graduated: false, addedInChapter: 3, graduatedInChapter: null,
    });
    expect(ch3.wordsLearnedTotal).toBe(1);
    expect(ch3.graduatedThisChapter).toEqual([]);
    const ch4 = updateWordBank(ch3.bank, chapter(4, { answeredCorrectly: ["vulnerable"] }));
    expect(ch4).toMatchObject({ graduatedThisChapter: ["vulnerable"], wordsLearnedTotal: 2 });
  });

  test("applying the same Chapter twice graduates nothing twice", () => {
    const ch1 = updateWordBank([], chapter(1, { flagged: ["advice"] }));
    const ch2 = chapter(2, { answeredCorrectly: ["advice"] });
    const once = updateWordBank(ch1.bank, ch2);
    const twice = updateWordBank(once.bank, ch2);
    expect(twice).toMatchObject({ graduatedThisChapter: ["advice"], wordsLearnedTotal: 1 });
  });
});

describe("Chapter evidence from a graded Chapter", () => {
  // mockChapterVersion(1) tokens: 0 "When", 3 "young,", 8 "advice.". mockGrading: "advice" missed aloud,
  // "quick" flagged. mockChapterCheck's complex-word question q3 asks about "judge" and got a 2.
  const version = mockChapterVersion(1);

  test("reads misses, flags, correct reading and correct Complex Word answers off the grading", () => {
    const evidence = chapterEvidence({
      version,
      check: mockChapterCheck,
      grading: mockGrading,
      readAloud: {
        wordResults: [
          { tokenIndex: 0, outcome: "correct", hesitationMs: 0 },
          { tokenIndex: 3, outcome: "correct", hesitationMs: 0 },
          { tokenIndex: 8, outcome: "mispronounced", hesitationMs: 0 },
        ],
      },
    });
    expect(evidence).toMatchObject({
      chapterNumber: 1,
      missed: ["advice"],
      flagged: ["quick"],
      readCorrectly: ["when", "young"],
      answeredCorrectly: ["judge"],
    });
    expect(evidence.seen).toEqual(version.tokens.map((t) => t.normalized));
  });

  test.each([0, 1] as const)("a Complex Word answer graded %i is missed and cannot graduate it", (grade) => {
    const grading = {
      questionGrades: mockGrading.questionGrades.map((g) => (g.questionId === "q3" ? { ...g, grade } : g)),
      missedWords: [{ word: "Judge", source: "chapter-check" as const }],
    };
    const evidence = chapterEvidence({ version, check: mockChapterCheck, grading, readAloud: null });
    expect(evidence).toMatchObject({ missed: ["judge"], answeredCorrectly: [] });
    const bank = updateWordBank([], chapter(1, { flagged: ["judge"] })).bank;
    expect(updateWordBank(bank, { ...evidence, chapterNumber: 2, readCorrectly: ["judge"] }).wordsLearnedTotal).toBe(0);
  });

  test("a word read correctly in one place but mispronounced in another isn't read correctly", () => {
    // Tokens 26 "had" and 32 "had.”".
    const evidence = chapterEvidence({
      version,
      check: mockChapterCheck,
      grading: mockGrading,
      readAloud: {
        wordResults: [
          { tokenIndex: 26, outcome: "correct", hesitationMs: 0 },
          { tokenIndex: 32, outcome: "mispronounced", hesitationMs: 0 },
        ],
      },
    });
    expect(evidence.readCorrectly).toEqual([]);
  });

  test("normalizes token words the same way as missed and flagged words", () => {
    const evidence = chapterEvidence({
      version: { chapterNumber: 2, tokens: [{ index: 0, text: "Well-known", normalized: "well-known", sentenceIndex: 0 }] },
      check: { ...mockChapterCheck, questions: [] },
      grading: { questionGrades: [], missedWords: [{ word: "Well-known,", source: "read-aloud" }] },
      readAloud: null,
    });
    expect(evidence).toMatchObject({ seen: ["wellknown"], missed: ["wellknown"] });
  });

  test("has nothing read correctly when the Reader read silently", () => {
    const evidence = chapterEvidence({ version, check: mockChapterCheck, grading: mockGrading, readAloud: null });
    expect(evidence.readCorrectly).toEqual([]);
  });
});

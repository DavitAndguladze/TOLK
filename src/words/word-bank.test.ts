import { describe, expect, it } from "vitest";
import { mockChapterCheck, mockChapterVersion, mockGrading } from "../mocks";
import { applyToWordBank, chapterEvidence, type ChapterEvidence } from "./word-bank";

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
  it("adds a word the Reader got wrong, with source wrong", () => {
    const { bank } = applyToWordBank([], chapter(1, { missed: ["advice"], seen: ["advice"] }));
    expect(bank).toEqual([{ word: "advice", source: "wrong", timesSeen: 1, graduated: false, addedInChapter: 1, graduatedInChapter: null }]);
  });

  it("adds a Flagged Word with source flagged, and a word both missed and flagged only once", () => {
    const { bank } = applyToWordBank([], chapter(1, { missed: ["advice", "advice"], flagged: ["quick", "advice"] }));
    expect(bank.map(({ word, source }) => ({ word, source }))).toEqual([
      { word: "advice", source: "wrong" },
      { word: "quick", source: "flagged" },
    ]);
  });

  it("counts each later Chapter a bank word appears in", () => {
    const ch1 = applyToWordBank([], chapter(1, { flagged: ["advice"], seen: ["advice", "father"] }));
    const ch2 = applyToWordBank(ch1.bank, chapter(2, { seen: ["advice", "father"], missed: ["advice"] }));
    const ch3 = applyToWordBank(ch2.bank, chapter(3, { seen: ["gatsby"] }));
    expect(ch3.bank).toEqual([{ word: "advice", source: "flagged", timesSeen: 2, graduated: false, addedInChapter: 1, graduatedInChapter: null }]);
  });

  it("graduates a word flagged in Chapter 1 and read correctly in Chapter 3", () => {
    const ch1 = applyToWordBank([], chapter(1, { flagged: ["vulnerable"], seen: ["vulnerable"] }));
    const ch2 = applyToWordBank(ch1.bank, chapter(2, { seen: ["advice"] }));
    const ch3 = applyToWordBank(ch2.bank, chapter(3, { seen: ["vulnerable"], readCorrectly: ["vulnerable"] }));
    expect(ch3).toEqual({
      bank: [{ word: "vulnerable", source: "flagged", timesSeen: 2, graduated: true, addedInChapter: 1, graduatedInChapter: 3 }],
      graduatedThisChapter: ["vulnerable"],
      wordsLearnedTotal: 1,
    });
  });

  it("doesn't graduate in the Chapter the word entered, or when it's flagged or missed again", () => {
    const ch1 = applyToWordBank([], chapter(1, { missed: ["advice"], flagged: ["quick", "judge"], readCorrectly: ["advice"] }));
    expect(ch1.wordsLearnedTotal).toBe(0);
    const ch2 = applyToWordBank(ch1.bank, chapter(2, { flagged: ["quick"], missed: ["judge"], readCorrectly: ["quick", "judge"] }));
    expect(ch2.bank.filter((e) => e.graduated)).toEqual([]);
  });

  it("graduates a Complex Word answered correctly in a later Chapter, without reading aloud", () => {
    const ch1 = applyToWordBank([], chapter(1, { missed: ["criticizing"] }));
    const ch2 = applyToWordBank(ch1.bank, chapter(2, { answeredCorrectly: ["criticizing"] }));
    expect(ch2.graduatedThisChapter).toEqual(["criticizing"]);
  });

  it("returns a Graduated Word flagged again to the bank, and Words Learned drops", () => {
    const ch1 = applyToWordBank([], chapter(1, { flagged: ["vulnerable", "advice"] }));
    const ch2 = applyToWordBank(ch1.bank, chapter(2, { readCorrectly: ["vulnerable", "advice"] }));
    expect(ch2.wordsLearnedTotal).toBe(2);
    const ch3 = applyToWordBank(ch2.bank, chapter(3, { flagged: ["vulnerable"], readCorrectly: ["vulnerable"] }));
    expect(ch3.bank.find((e) => e.word === "vulnerable")).toEqual({
      word: "vulnerable", source: "flagged", timesSeen: 1, graduated: false, addedInChapter: 3, graduatedInChapter: null,
    });
    expect(ch3.wordsLearnedTotal).toBe(1);
    expect(ch3.graduatedThisChapter).toEqual([]);
    const ch4 = applyToWordBank(ch3.bank, chapter(4, { readCorrectly: ["vulnerable"] }));
    expect(ch4).toMatchObject({ graduatedThisChapter: ["vulnerable"], wordsLearnedTotal: 2 });
  });
});

describe("Chapter evidence from a graded Chapter", () => {
  it("reads misses, flags, correct reading and correct Complex Word answers off the grading", () => {
    // mockGrading: "advice" missed aloud, "quick" flagged; mockChapterCheck q3 asks about "judge" and got a 2.
    const evidence = chapterEvidence({
      version: mockChapterVersion(1),
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
    expect(evidence.seen).toEqual(expect.arrayContaining(["advice", "judge", "quick"]));
  });

  it("has nothing read correctly when the Reader read silently", () => {
    const evidence = chapterEvidence({ version: mockChapterVersion(1), check: mockChapterCheck, grading: mockGrading, readAloud: null });
    expect(evidence.readCorrectly).toEqual([]);
  });
});

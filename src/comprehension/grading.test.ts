import { describe, expect, test } from "vitest";
import type { AnswerGrade, GradingInput, GradingResult, QuestionGrade, ReadAloudMiss, ReadAloudSummary } from "../types";
import { combineGrading } from "./grading";

const grades = (...values: AnswerGrade[]): QuestionGrade[] =>
  values.map((grade, i) => ({ questionId: `q${i + 1}`, grade, feedback: "", rereadSentenceIndex: grade === 2 ? null : i }));

const readAloud = (accuracy: number, misses: ReadAloudMiss[] = []): ReadAloudSummary => ({
  chapterVersionId: "gatsby-ch1-L1",
  accuracy,
  wordResults: [],
  misses,
  startedAt: "2026-10-17T18:00:00Z",
  endedAt: "2026-10-17T18:05:00Z",
});

const flags = (count: number) => Array.from({ length: count }, (_, i) => `word${i}`);

const input = (overrides: Partial<GradingInput>): GradingInput => ({
  questionGrades: grades(2, 2, 2),
  readAloud: null,
  flaggedWords: [],
  complexWordMisses: [],
  gradedBy: "stand-in",
  ...overrides,
});

describe("combineGrading", () => {
  describe("with a read-aloud summary", () => {
    test("weighs the Chapter Check 70%, read-aloud accuracy 20% and Flagged Words 10%", () => {
      // Check 3/6 → 35, accuracy 0.5 → 10, no flags → 10.
      const grading = combineGrading(input({ questionGrades: grades(1, 1, 1), readAloud: readAloud(0.5) }));

      expect(grading.score).toBe(55);
    });

    test.each<[string, GradingInput, number, GradingResult, boolean]>([
      // Check 3/6 → 35, no flags → 10, accuracy fills the rest.
      ["49 is Struggled", input({ questionGrades: grades(1, 1, 1), readAloud: readAloud(0.2) }), 49, "struggled", false],
      ["50 is Partly understood", input({ questionGrades: grades(1, 1, 1), readAloud: readAloud(0.25) }), 50, "partly-understood", false],
      // Check 6/6 → 70, one flag → 8, accuracy 0.05 → 1.
      ["79 is Partly understood", input({ readAloud: readAloud(0.05), flaggedWords: flags(1) }), 79, "partly-understood", false],
      // Check 6/6 → 70, no flags → 10, accuracy fills the rest.
      ["80 is Barely Passed", input({ readAloud: readAloud(0) }), 80, "fully-understood", true],
      ["87 is Barely Passed", input({ readAloud: readAloud(0.35) }), 87, "fully-understood", true],
      ["88 is Fully understood", input({ readAloud: readAloud(0.4) }), 88, "fully-understood", false],
    ])("%s", (_, gradingInput, score, result, barelyPassed) => {
      expect(combineGrading(gradingInput)).toMatchObject({ score, result, barelyPassed });
    });
  });

  describe("basis and feedback", () => {
    test("reports what the grade was based on and who graded it, and keeps each answer's feedback", () => {
      const questionGrades = grades(2, 1, 0);

      const grading = combineGrading(
        input({ questionGrades, readAloud: readAloud(0.94), flaggedWords: flags(2), gradedBy: "oci-generative-ai" }),
      );

      expect(grading.basis).toEqual({ readAloudAccuracy: 0.94, checkScore: 3, checkMax: 6, flaggedCount: 2, gradedBy: "oci-generative-ai" });
      expect(grading.questionGrades).toEqual(questionGrades);
    });

    test("reports no read-aloud accuracy when there was no read-aloud summary", () => {
      const grading = combineGrading(input({ questionGrades: grades(2, 2, 1, 1) }));

      expect(grading.basis).toEqual({ readAloudAccuracy: null, checkScore: 6, checkMax: 8, flaggedCount: 0, gradedBy: "stand-in" });
    });
  });

  describe("missed words", () => {
    test("lists each word once per source: Read-aloud Misses, wrong Complex Word answers, then Flagged Words", () => {
      const misses: ReadAloudMiss[] = [
        { word: "advice", tokenIndex: 8, kind: "mispronounced" },
        { word: "quick", tokenIndex: 12, kind: "skipped" },
        { word: "advice", tokenIndex: 30, kind: "skipped" },
      ];

      const grading = combineGrading(
        input({ readAloud: readAloud(0.9, misses), complexWordMisses: ["judge"], flaggedWords: ["quick", "quick"] }),
      );

      expect(grading.missedWords).toEqual([
        { word: "advice", source: "read-aloud" },
        { word: "quick", source: "read-aloud" },
        { word: "judge", source: "chapter-check" },
        { word: "quick", source: "flagged" },
      ]);
    });

    test("has no read-aloud missed words without a read-aloud summary", () => {
      const grading = combineGrading(input({ complexWordMisses: ["judge"] }));

      expect(grading.missedWords).toEqual([{ word: "judge", source: "chapter-check" }]);
    });
  });

  describe("rounding", () => {
    test.each<[string, GradingInput, number, GradingResult, boolean]>([
      // Check 3/6 → 35, no flags → 10.
      ["49.4 rounds down to Struggled", input({ questionGrades: grades(1, 1, 1), readAloud: readAloud(0.22) }), 49, "struggled", false],
      ["49.5 rounds up to Partly understood", input({ questionGrades: grades(1, 1, 1), readAloud: readAloud(0.225) }), 50, "partly-understood", false],
      // Check 6/6 → 70, one flag → 8.
      ["79.5 rounds up to Barely Passed", input({ readAloud: readAloud(0.075), flaggedWords: flags(1) }), 80, "fully-understood", true],
      // Check 6/6 → 70, no flags → 10.
      ["87.5 rounds up to Fully understood", input({ readAloud: readAloud(0.375) }), 88, "fully-understood", false],
      // No read-aloud: check 7/8 → 78.75, one flag → 8.
      ["86.75 rounds up to 87, still Barely Passed", input({ questionGrades: grades(2, 2, 2, 1), flaggedWords: flags(1) }), 87, "fully-understood", true],
    ])("%s", (_, gradingInput, score, result, barelyPassed) => {
      expect(combineGrading(gradingInput)).toMatchObject({ score, result, barelyPassed });
    });
  });

  test("refuses to grade a Chapter Check with no question grades", () => {
    expect(() => combineGrading(input({ questionGrades: [], readAloud: readAloud(1) }))).toThrow(/no question grades/);
  });

  describe("Flagged Words", () => {
    // Perfect check and read-aloud (90 points), so only the flag share moves.
    test.each([
      [0, 100],
      [1, 98],
      [2, 96],
      [5, 90],
      [6, 90],
    ])("%i flagged costs 2 points each, never more than the 10 they weigh → %i", (count, score) => {
      const grading = combineGrading(input({ readAloud: readAloud(1), flaggedWords: flags(count) }));

      expect(grading.score).toBe(score);
    });

    test("counts a word flagged twice as one Flagged Word", () => {
      const grading = combineGrading(input({ readAloud: readAloud(1), flaggedWords: ["quick", "quick", "advice"] }));

      expect(grading.score).toBe(96);
      expect(grading.basis.flaggedCount).toBe(2);
    });
  });

  describe("without a read-aloud summary", () => {
    test("weighs the Chapter Check 90% and Flagged Words 10%", () => {
      // Check 4/6 → 60, no flags → 10.
      const grading = combineGrading(input({ questionGrades: grades(2, 1, 1) }));

      expect(grading.score).toBe(70);
    });

    // With 3–5 questions, flag points are even and the check share a multiple of 9, 11.25 or 15,
    // so 50 and 88 can't be hit exactly: each edge is tested at the nearest score on either side.
    test.each<[string, GradingInput, number, GradingResult, boolean]>([
      // Check 3/6 → 45.
      ["49 is Struggled", input({ questionGrades: grades(1, 1, 1), flaggedWords: flags(3) }), 49, "struggled", false],
      ["51 is Partly understood", input({ questionGrades: grades(1, 1, 1), flaggedWords: flags(2) }), 51, "partly-understood", false],
      // Check 5/6 → 75.
      ["79 is Partly understood", input({ questionGrades: grades(2, 2, 1), flaggedWords: flags(3) }), 79, "partly-understood", false],
      // Check 8/10 → 72, then 9/10 → 81.
      ["80 is Barely Passed", input({ questionGrades: grades(2, 2, 2, 1, 1), flaggedWords: flags(1) }), 80, "fully-understood", true],
      ["87 is Barely Passed", input({ questionGrades: grades(2, 2, 2, 2, 1), flaggedWords: flags(2) }), 87, "fully-understood", true],
      ["89 is Fully understood", input({ questionGrades: grades(2, 2, 2, 2, 1), flaggedWords: flags(1) }), 89, "fully-understood", false],
    ])("%s", (_, gradingInput, score, result, barelyPassed) => {
      expect(combineGrading(gradingInput)).toMatchObject({ score, result, barelyPassed });
    });
  });
});

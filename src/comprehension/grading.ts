// Deterministic half of grading (pure): merges the AI's question grades with
// read-aloud accuracy and Flagged Words into one Grading Result (ADR-0009).
// Weights and thresholds are the spec's starting values, tunable.

import type { Grading, GradingInput, GradingResult } from "../types";

export const WEIGHTS = { check: 70, readAloud: 20, flags: 10 };
/** Without a read-aloud summary its share moves to the Chapter Check. */
export const WEIGHTS_WITHOUT_READ_ALOUD = { check: 90, readAloud: 0, flags: 10 };
/** Score points each Flagged Word costs, out of the flags weight. */
export const POINTS_PER_FLAG = 2;
/** Lowest score for each Grading Result, and the score a Fully understood result must reach to not be Barely Passed. */
export const THRESHOLDS = { partlyUnderstood: 50, fullyUnderstood: 80, barelyPassedBelow: 88 };

export function combineGrading(input: GradingInput): Grading {
  if (input.questionGrades.length === 0) throw new Error("Cannot grade a Chapter Check with no question grades");
  const checkScore = input.questionGrades.reduce((sum, q) => sum + q.grade, 0);
  const checkMax = input.questionGrades.length * 2;
  const readAloudAccuracy = input.readAloud?.accuracy ?? null;
  const weights = readAloudAccuracy === null ? WEIGHTS_WITHOUT_READ_ALOUD : WEIGHTS;
  // A word flagged in two places is still one Flagged Word.
  const flaggedCount = new Set(input.flaggedWords).size;

  // Rounded before the thresholds, so the score the Reader sees always matches its Grading Result.
  const score = Math.round(
    weights.check * (checkScore / checkMax) +
      weights.readAloud * (readAloudAccuracy ?? 0) +
      Math.max(0, weights.flags - POINTS_PER_FLAG * flaggedCount),
  );

  const result: GradingResult =
    score >= THRESHOLDS.fullyUnderstood ? "fully-understood"
    : score >= THRESHOLDS.partlyUnderstood ? "partly-understood"
    : "struggled";

  const missed = (words: string[], source: Grading["missedWords"][number]["source"]) =>
    [...new Set(words)].map((word) => ({ word, source }));

  return {
    result,
    score,
    barelyPassed: result === "fully-understood" && score < THRESHOLDS.barelyPassedBelow,
    questionGrades: input.questionGrades,
    missedWords: [
      ...missed(input.readAloud?.misses.map((m) => m.word) ?? [], "read-aloud"),
      ...missed(input.complexWordMisses, "chapter-check"),
      ...missed(input.flaggedWords, "flagged"),
    ],
    basis: { readAloudAccuracy, checkScore, checkMax, flaggedCount, gradedBy: input.gradedBy },
  };
}

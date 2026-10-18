import { describe, expect, test } from "vitest";
import type { Level, SessionResult } from "../types";
import { combineGrading } from "./grading";
import { decideNextLevel } from "./level-rules";

const grading = (score: number) => ({
  ...combineGrading({
    questionGrades: [{ questionId: "q1", grade: 2, feedback: "", rereadSentenceIndex: null, rereadSentence: null }],
    readAloud: null,
    flaggedWords: [],
    complexWordMisses: [],
    gradedBy: "stand-in",
  }),
  score,
  result: score >= 80 ? "fully-understood" as const : score >= 50 ? "partly-understood" as const : "struggled" as const,
  barelyPassed: score >= 80 && score < 88,
});

const session = (chapterNumber: number, score: number, level: Level = 2): SessionResult => ({
  id: `session-${chapterNumber}`,
  readerId: "reader-1",
  chapterVersionId: `gatsby-${chapterNumber}-L${level}`,
  chapterNumber,
  level,
  readAloudMisses: [],
  grading: grading(score),
  completedAt: `2026-10-17T12:${String(chapterNumber).padStart(2, "0")}:00Z`,
});

describe("decideNextLevel (#41)", () => {
  test("holds a strong result until three distinct Chapters have completed", () => {
    const latest = session(2, 100);
    expect(decideNextLevel(2, latest.grading, [session(1, 100), latest])).toMatchObject({
      from: 2, to: 2, reason: "insufficient-history", reinforcement: "plain",
    });
  });

  test.each([
    ["mixed understanding holds", [90, 60, 90], 2, "sustained-hold"],
    ["a Barely Passed Chapter can contribute to sustained understanding", [95, 80, 95], 3, "sustained-understanding"],
    ["exactly 88 moves up", [88, 88, 88], 3, "sustained-understanding"],
    ["87.67 does not round up", [87, 88, 88], 2, "sustained-hold"],
    ["exactly 35 holds", [35, 35, 35], 2, "sustained-hold"],
    ["34.67 moves down without rounding", [34, 35, 35], 1, "sustained-struggle"],
  ] as const)("%s", (_, scores, to, reason) => {
    const history = scores.map((score, i) => session(i + 1, score));
    expect(decideNextLevel(2, history[2].grading, history)).toMatchObject({ from: 2, to, reason });
  });

  test.each([
    [5, 100, 5, "at-original"],
    [5, 10, 4, "sustained-struggle"],
    [1, 10, 1, "at-simplest"],
    [1, 100, 2, "sustained-understanding"],
  ] as const)("bounds L%i with scores %i at L%i", (level, score, to, reason) => {
    const history = [1, 2, 3].map((n) => session(n, score, level));
    expect(decideNextLevel(level, history[2].grading, history)).toMatchObject({ from: level, to, reason });
  });

  test("counts repeated submissions of a Chapter once", () => {
    const first = session(1, 100);
    const second = session(2, 100);
    expect(decideNextLevel(2, second.grading, [first, first, second, second])).toMatchObject({
      to: 2, reason: "insufficient-history",
    });
  });

  test("uses the last three distinct Chapters while holding, without mutating history", () => {
    const third = session(3, 90);
    const history = Object.freeze([session(1, 10), session(2, 90), third, session(4, 90), third]);
    expect(decideNextLevel(2, history[3].grading, history)).toMatchObject({
      to: 3, reason: "sustained-understanding",
    });
    expect(history.map((s) => s.chapterNumber)).toEqual([1, 2, 3, 4, 3]);
  });

  test.each([
    [100, "plain"],
    [84, "plain"],
    [70, "context-clue"],
    [40, "inline-definition"],
    [10, "inline-definition"],
  ] as const)("uses the latest score %i for immediate reinforcement while history holds", (score, reinforcement) => {
    const latest = session(1, score);
    expect(decideNextLevel(2, latest.grading, [latest])).toMatchObject({
      to: 2, reason: "insufficient-history", reinforcement,
    });
  });

  test("immediate reinforcement follows the latest grade even when the average moves up", () => {
    const history = [session(1, 100), session(2, 100), session(3, 70)];
    expect(decideNextLevel(2, history[2].grading, history)).toMatchObject({
      to: 3, reason: "sustained-understanding", reinforcement: "context-clue",
    });
  });

  test("missing history holds with immediate support instead of using the former single-Chapter rule", () => {
    expect(decideNextLevel(2, grading(10))).toMatchObject({
      to: 2, reason: "insufficient-history", reinforcement: "inline-definition",
    });
  });

  test("does not reuse results from an earlier visit to the current Level", () => {
    const history = [session(1, 100), session(2, 100), session(3, 100), session(4, 30, 3), session(5, 100)];
    expect(decideNextLevel(2, history[4].grading, history)).toMatchObject({ to: 2, reason: "insufficient-history" });
  });

  test("a new Level starts with only its own completed Chapters", () => {
    const history = [session(1, 100, 1), session(2, 100, 1), session(3, 100, 1), session(4, 100)];
    expect(decideNextLevel(2, history[3].grading, history)).toMatchObject({ to: 2, reason: "insufficient-history" });
  });
});

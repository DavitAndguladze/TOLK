import { describe, expect, test } from "vitest";
import type { ChapterCheck, QuestionGrade } from "../../types";
import { checkFlow, initialCheckFlow, type CheckFlowState } from "./check-flow";

const check: ChapterCheck = {
  id: "check-v1",
  chapterVersionId: "v1",
  questions: [
    { id: "q1", kind: "key-point", prompt: "What did Nick's father advise?", keyPointId: "kp1", answerSentenceIndex: 0 },
    { id: "q2", kind: "complex-word", prompt: "What does 'vulnerable' mean?", word: "vulnerable", choices: ["easily hurt", "very old"], answerSentenceIndex: 0 },
  ],
};
const grade = (questionId: string, value: 0 | 1 | 2): QuestionGrade =>
  ({ questionId, grade: value, feedback: `graded ${value}`, rereadSentenceIndex: null, rereadSentence: null });
const run = (...actions: Parameters<typeof checkFlow>[1][]) => actions.reduce((state, action) => checkFlow(state, action, check), initialCheckFlow(check));

describe("checkFlow", () => {
  test("starts on the first question, waiting for an answer", () => {
    expect(initialCheckFlow(check)).toMatchObject({ index: 0, phase: "answering", answers: {}, grades: {} });
  });

  test("Check does nothing until there is an answer", () => {
    expect(run({ type: "check" }).phase).toBe("answering");
    expect(run({ type: "answer", value: "   ", via: "typed" }, { type: "check" }).phase).toBe("answering");
  });

  test("Check sends the answer for grading, then shows its feedback", () => {
    const checking = run({ type: "answer", value: "not to judge", via: "typed" }, { type: "check" });
    expect(checking.phase).toBe("checking");

    const feedback = checkFlow(checking, { type: "graded", grade: grade("q1", 2) }, check);
    expect(feedback).toMatchObject({ phase: "feedback", grades: { q1: grade("q1", 2) } });
  });

  test("can't be checked twice, and the answer is locked while grading and after feedback", () => {
    const checking = run({ type: "answer", value: "not to judge", via: "typed" }, { type: "check" });
    expect(checkFlow(checking, { type: "check" }, check)).toBe(checking);
    expect(checkFlow(checking, { type: "answer", value: "changed", via: "typed" }, check)).toBe(checking);

    const feedback = checkFlow(checking, { type: "graded", grade: grade("q1", 2) }, check);
    expect(checkFlow(feedback, { type: "answer", value: "changed", via: "typed" }, check)).toBe(feedback);
    expect(checkFlow(feedback, { type: "check" }, check)).toBe(feedback);
  });

  test("ignores a grade for another question or one that arrives when nothing is being checked", () => {
    const checking = run({ type: "answer", value: "not to judge", via: "typed" }, { type: "check" });
    expect(checkFlow(checking, { type: "graded", grade: grade("q2", 2) }, check)).toBe(checking);
    const answering = run({ type: "answer", value: "x", via: "typed" });
    expect(checkFlow(answering, { type: "graded", grade: grade("q1", 2) }, check)).toBe(answering);
  });

  test("Continue moves to the next question, and after the last one submits the whole Check", () => {
    const q1Done = run({ type: "answer", value: "not to judge", via: "typed" }, { type: "check" }, { type: "graded", grade: grade("q1", 2) });
    const onQ2 = checkFlow(q1Done, { type: "continue" }, check);
    expect(onQ2).toMatchObject({ index: 1, phase: "answering" });

    const q2Done = [{ type: "answer", value: "easily hurt", via: "typed" }, { type: "check" }, { type: "graded", grade: grade("q2", 2) }, { type: "continue" }]
      .reduce((s, a) => checkFlow(s, a as Parameters<typeof checkFlow>[1], check), onQ2);
    expect(q2Done.phase).toBe("submitting");
  });

  test("Continue does nothing before the answer is checked", () => {
    const answered = run({ type: "answer", value: "not to judge", via: "typed" });
    expect(checkFlow(answered, { type: "continue" }, check)).toBe(answered);
  });

  test("Back shows the earlier question locked with its feedback; going forward returns where the Reader was", () => {
    const onQ2 = run({ type: "answer", value: "not to judge", via: "typed" }, { type: "check" }, { type: "graded", grade: grade("q1", 1) }, { type: "continue" }, { type: "answer", value: "easily hurt", via: "typed" });
    const back = checkFlow(onQ2, { type: "back" }, check);
    expect(back).toMatchObject({ index: 0, phase: "feedback" });
    expect(checkFlow(back, { type: "answer", value: "changed", via: "typed" }, check)).toBe(back);

    expect(checkFlow(back, { type: "continue" }, check)).toMatchObject({ index: 1, phase: "answering", answers: { q2: { value: "easily hurt", via: "typed" } } });
  });

  test("Back does nothing on the first question or while a Check is being graded", () => {
    const first = initialCheckFlow(check);
    expect(checkFlow(first, { type: "back" }, check)).toBe(first);
    const onQ2Checking = run({ type: "answer", value: "a", via: "typed" }, { type: "check" }, { type: "graded", grade: grade("q1", 2) }, { type: "continue" },
      { type: "answer", value: "easily hurt", via: "typed" }, { type: "check" });
    expect(checkFlow(onQ2Checking, { type: "back" }, check)).toBe(onQ2Checking);
  });

  test("a failed submit returns to the last question's feedback with a message", () => {
    const submitting = run({ type: "answer", value: "a", via: "typed" }, { type: "check" }, { type: "graded", grade: grade("q1", 2) }, { type: "continue" },
      { type: "answer", value: "easily hurt", via: "typed" }, { type: "check" }, { type: "graded", grade: grade("q2", 2) }, { type: "continue" });
    expect(checkFlow(submitting, { type: "failed", message: "Couldn't save" }, check)).toMatchObject({ index: 1, phase: "feedback", error: "Couldn't save" });
  });

  test("restoring after a refresh keeps answers and grades, drops unknown questions, and never resumes mid-Check", () => {
    const saved: CheckFlowState = {
      index: 1, phase: "checking", error: null,
      answers: { q1: { value: "a", via: "typed" }, q2: { value: "easily hurt", via: "typed" }, gone: { value: "x", via: "typed" } },
      grades: { q1: grade("q1", 2), gone: grade("gone", 0) },
    };

    expect(initialCheckFlow(check, saved)).toEqual({
      index: 1, phase: "answering", error: null,
      answers: { q1: { value: "a", via: "typed" }, q2: { value: "easily hurt", via: "typed" } },
      grades: { q1: grade("q1", 2) },
    });
    expect(initialCheckFlow(check, { ...saved, index: 9 }).index).toBe(0);
    expect(initialCheckFlow(check, { ...saved, index: 0 }).phase).toBe("feedback");
  });

  test("a failed Check goes back to answering with a message, keeping the answer", () => {
    const failed = checkFlow(run({ type: "answer", value: "not to judge", via: "typed" }, { type: "check" }), { type: "failed", message: "Couldn't check" }, check);
    expect(failed).toMatchObject({ phase: "answering", error: "Couldn't check", answers: { q1: { value: "not to judge", via: "typed" } } });
  });
});

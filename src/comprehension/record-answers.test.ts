import { describe, expect, test } from "vitest";
import { mockChapterCheck } from "../mocks";
import { AnswerValidationError, recordAnswers } from "./record-answers";

describe("recordAnswers", () => {
  test("accepts a valid submission covering every question", () => {
    const submission = {
      answers: mockChapterCheck.questions.map((q) => ({ questionId: q.id, answer: "an answer", via: "typed" as const })),
    };

    const result = recordAnswers(mockChapterCheck, submission);

    expect(result.answers).toHaveLength(mockChapterCheck.questions.length);
  });

  test("rejects an answer to a question that isn't on this check", () => {
    const submission = { answers: [{ questionId: "not-a-real-question", answer: "x", via: "typed" as const }] };

    expect(() => recordAnswers(mockChapterCheck, submission)).toThrow(AnswerValidationError);
  });

  test("rejects an empty answer", () => {
    const submission = { answers: [{ questionId: mockChapterCheck.questions[0].id, answer: "   ", via: "typed" as const }] };

    expect(() => recordAnswers(mockChapterCheck, submission)).toThrow(AnswerValidationError);
  });

  test("keeps only the last answer when a question is answered twice", () => {
    const [first] = mockChapterCheck.questions;
    const submission = {
      answers: [
        { questionId: first.id, answer: "first try", via: "typed" as const },
        { questionId: first.id, answer: "second try", via: "spoken" as const },
      ],
    };

    const result = recordAnswers(mockChapterCheck, submission);

    expect(result.answers).toHaveLength(1);
    expect(result.answers[0].answer).toBe("second try");
  });
});

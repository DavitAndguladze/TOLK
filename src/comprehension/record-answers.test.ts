import { describe, expect, test } from "vitest";
import { mockChapterCheck } from "../mocks";
import { AnswerValidationError, recordAnswers } from "./record-answers";

const answerFor = (q: (typeof mockChapterCheck.questions)[number]) => q.choices?.[0] ?? "an answer";

describe("recordAnswers", () => {
  test("accepts a valid submission covering every question", () => {
    const submission = {
      answers: mockChapterCheck.questions.map((q) => ({ questionId: q.id, answer: answerFor(q), via: "typed" as const })),
    };

    const result = recordAnswers(mockChapterCheck, submission);

    expect(result.answers).toHaveLength(mockChapterCheck.questions.length);
  });

  test("rejects an answer to a question that isn't on this check", () => {
    const submission = { answers: [{ questionId: "not-a-real-question", answer: "x", via: "typed" as const }] };

    expect(() => recordAnswers(mockChapterCheck, submission)).toThrow(AnswerValidationError);
  });

  test("rejects a submission with no answers array", () => {
    expect(() => recordAnswers(mockChapterCheck, {} as never)).toThrow(AnswerValidationError);
  });

  test("rejects an empty answer", () => {
    const submission = { answers: [{ questionId: mockChapterCheck.questions[0].id, answer: "   ", via: "typed" as const }] };

    expect(() => recordAnswers(mockChapterCheck, submission)).toThrow(AnswerValidationError);
  });

  test("rejects a non-string answer", () => {
    const submission = { answers: [{ questionId: mockChapterCheck.questions[0].id, answer: null as never, via: "typed" as const }] };

    expect(() => recordAnswers(mockChapterCheck, submission)).toThrow(AnswerValidationError);
  });

  test("rejects a partial submission that doesn't cover every question", () => {
    const [first] = mockChapterCheck.questions;
    const submission = { answers: [{ questionId: first.id, answer: answerFor(first), via: "typed" as const }] };

    expect(() => recordAnswers(mockChapterCheck, submission)).toThrow(AnswerValidationError);
  });

  test("rejects free text for a multiple-choice question", () => {
    const mcQuestion = mockChapterCheck.questions.find((q) => q.choices);
    if (!mcQuestion) throw new Error("fixture has no multiple-choice question");
    const submission = {
      answers: mockChapterCheck.questions.map((q) => ({
        questionId: q.id,
        answer: q.id === mcQuestion.id ? "not one of the choices" : answerFor(q),
        via: "typed" as const,
      })),
    };

    expect(() => recordAnswers(mockChapterCheck, submission)).toThrow(AnswerValidationError);
  });

  test("keeps only the last answer when a question is answered twice", () => {
    const [first, ...rest] = mockChapterCheck.questions;
    const submission = {
      answers: [
        { questionId: first.id, answer: "first try", via: "typed" as const },
        { questionId: first.id, answer: "second try", via: "spoken" as const },
        ...rest.map((q) => ({ questionId: q.id, answer: answerFor(q), via: "typed" as const })),
      ],
    };

    const result = recordAnswers(mockChapterCheck, submission);

    expect(result.answers).toHaveLength(mockChapterCheck.questions.length);
    expect(result.answers.find((a) => a.questionId === first.id)?.answer).toBe("second try");
  });
});

import type { ChapterCheck, ChapterCheckAnswers } from "../types";

export class AnswerValidationError extends Error {}

/** Validates a Chapter Check submission. No grading here - that's ticket #10. */
export function recordAnswers(check: ChapterCheck, submission: ChapterCheckAnswers): ChapterCheckAnswers {
  if (!Array.isArray(submission?.answers)) {
    throw new AnswerValidationError("Submission must include an `answers` array");
  }

  const byId = new Map(check.questions.map((q) => [q.id, q]));
  const byQuestion = new Map<string, ChapterCheckAnswers["answers"][number]>();

  for (const answer of submission.answers) {
    if (!answer || typeof answer !== "object" || typeof answer.questionId !== "string") {
      throw new AnswerValidationError("Each answer must name a question");
    }
    const question = byId.get(answer.questionId);
    if (!question) {
      throw new AnswerValidationError(`"${answer.questionId}" is not a question on check "${check.id}"`);
    }
    if (typeof answer.answer !== "string" || !answer.answer.trim()) {
      throw new AnswerValidationError(`Empty answer for question "${answer.questionId}"`);
    }
    if (question.choices && !question.choices.includes(answer.answer)) {
      throw new AnswerValidationError(`"${answer.answer}" is not one of the choices for question "${answer.questionId}"`);
    }
    byQuestion.set(answer.questionId, answer); // re-answering a question keeps the latest try
  }

  if (byQuestion.size !== check.questions.length) {
    throw new AnswerValidationError(`Every question must be answered (got ${byQuestion.size} of ${check.questions.length})`);
  }

  return { answers: [...byQuestion.values()] };
}

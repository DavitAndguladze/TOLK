import type { ChapterCheck, ChapterCheckAnswers } from "../types";

export class AnswerValidationError extends Error {}

/** Validates a Chapter Check submission. No grading here - that's ticket #10. */
export function recordAnswers(check: ChapterCheck, submission: ChapterCheckAnswers): ChapterCheckAnswers {
  const validIds = new Set(check.questions.map((q) => q.id));
  const byQuestion = new Map<string, ChapterCheckAnswers["answers"][number]>();

  for (const answer of submission.answers) {
    if (!validIds.has(answer.questionId)) {
      throw new AnswerValidationError(`"${answer.questionId}" is not a question on check "${check.id}"`);
    }
    if (!answer.answer.trim()) {
      throw new AnswerValidationError(`Empty answer for question "${answer.questionId}"`);
    }
    byQuestion.set(answer.questionId, answer); // re-answering a question keeps the latest try
  }

  return { answers: [...byQuestion.values()] };
}

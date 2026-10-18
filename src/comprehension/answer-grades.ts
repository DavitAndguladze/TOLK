import type { AnswerGrade, KeyPointGradedBy } from "../types";
import type { KeyPointGrader } from "./grade-check";

/** One Key Point answer's grade, as the Reader saw it when they pressed Check (#97). */
export interface StoredAnswerGrade {
  grade: AnswerGrade;
  feedback: string;
  gradedBy: KeyPointGradedBy;
}

/** Which grade: this Reader's exact answer to this question of this Chapter Check. */
export interface AnswerGradeKey {
  readerId: string;
  checkId: string;
  questionId: string;
  answer: string;
}

export interface AnswerGradeStore {
  get(key: AnswerGradeKey): Promise<StoredAnswerGrade | null>;
  save(key: AnswerGradeKey, grade: StoredAnswerGrade): Promise<void>;
}

/** Dev/demo store; the MySQL one has the same interface. */
export function createInMemoryAnswerGradeStore(): AnswerGradeStore {
  const grades = new Map<string, StoredAnswerGrade>();
  const id = (key: AnswerGradeKey) => JSON.stringify([key.readerId, key.checkId, key.questionId, key.answer]);
  return {
    async get(key) {
      return grades.get(id(key)) ?? null;
    },
    async save(key, grade) {
      grades.set(id(key), grade);
    },
  };
}

/**
 * Grades each Key Point answer once: a grade already stored for this Reader's exact answer is reused,
 * so pressing Check again, and submitting the whole Chapter Check, give the grade the Reader saw.
 * A changed answer is graded afresh.
 */
export function rememberingKeyPointGrader(inner: KeyPointGrader, store: AnswerGradeStore, scope: { readerId: string; checkId: string }): KeyPointGrader {
  return async (input) => {
    const key = { ...scope, questionId: input.question.id, answer: input.answer };
    const stored = await store.get(key);
    if (stored) return stored;
    const graded = await inner(input);
    await store.save(key, graded);
    return graded;
  };
}

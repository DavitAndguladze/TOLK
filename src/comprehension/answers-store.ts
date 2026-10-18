import type { ChapterCheckAnswers } from "../types";

/** Keyed by Chapter Check id, which maps 1:1 to a Chapter Version via ChapterCheck.chapterVersionId. */
export interface AnswersStore {
  save(checkId: string, answers: ChapterCheckAnswers): Promise<void>;
  get(checkId: string): Promise<ChapterCheckAnswers | null>;
}

/** Dev/demo store. Swap for a MySQL-backed implementation once the MySQL HeatWave database lands (R6 #40) - same interface. */
export function createInMemoryAnswersStore(): AnswersStore {
  const store = new Map<string, ChapterCheckAnswers>();
  return {
    async save(checkId, answers) {
      store.set(checkId, answers);
    },
    async get(checkId) {
      return store.get(checkId) ?? null;
    },
  };
}

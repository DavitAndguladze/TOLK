import type { ReadAloudSummary } from "../types";

/** Keyed by Reader + Chapter Version: everyone at a Level shares a Chapter Version, so the Reader keeps attempts apart. */
export interface ReadAloudStore {
  save(readerId: string, summary: ReadAloudSummary): Promise<void>;
  get(readerId: string, chapterVersionId: string): Promise<ReadAloudSummary | null>;
  /**
   * Spends a summary once a completion has been graded with it, so a later silent reread of the same
   * Chapter Version gets null instead of the old reading (comms 0024). Only removes `summary` itself:
   * a newer save that landed while grading ran is kept for the next completion.
   */
  consume(readerId: string, summary: ReadAloudSummary): Promise<void>;
}

/** Dev/demo store. Swapped for a MySQL-backed one with sign-in (#7) - same interface. The latest save wins. */
export function createInMemoryReadAloudStore(): ReadAloudStore {
  const store = new Map<string, ReadAloudSummary>();
  const key = (readerId: string, chapterVersionId: string) => `${readerId}:${chapterVersionId}`;
  return {
    async save(readerId, summary) {
      store.set(key(readerId, summary.chapterVersionId), summary);
    },
    async get(readerId, chapterVersionId) {
      return store.get(key(readerId, chapterVersionId)) ?? null;
    },
    async consume(readerId, summary) {
      const k = key(readerId, summary.chapterVersionId);
      if (store.get(k) === summary) store.delete(k);
    },
  };
}

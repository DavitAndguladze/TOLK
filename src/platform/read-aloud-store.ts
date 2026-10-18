import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { readAloudSummaries as t } from "../db/schema";
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

/** Tests and database-less dev. The latest save wins. */
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

/** MySQL store, same rules. `db()` connects on first call, so importing this needs no database. */
export function createMySqlReadAloudStore(): ReadAloudStore {
  const row = (readerId: string, chapterVersionId: string) => and(eq(t.readerId, readerId), eq(t.chapterVersionId, chapterVersionId));
  return {
    async save(readerId, summary) {
      const now = new Date();
      await db().insert(t).values({ readerId, chapterVersionId: summary.chapterVersionId, data: summary, updatedAt: now })
        .onDuplicateKeyUpdate({ set: { data: summary, updatedAt: now } });
    },
    async get(readerId, chapterVersionId) {
      const [found] = await db().select({ data: t.data }).from(t).where(row(readerId, chapterVersionId));
      return found?.data ?? null;
    },
    async consume(readerId, summary) {
      // JSON equality: a newer save that landed while grading ran has other contents and survives.
      await db().delete(t).where(and(row(readerId, summary.chapterVersionId), sql`${t.data} = CAST(${JSON.stringify(summary)} AS JSON)`));
    },
  };
}

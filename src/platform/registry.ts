import type { ReadAloudSummary } from "../types";
import { createInMemoryReadAloudStore, createMySqlReadAloudStore, type ReadAloudStore } from "./read-aloud-store";

// MySQL wherever a database is configured (the VM, local dev); in memory otherwise. On globalThis so every
// route bundle and hot reload shares the in-memory one.
const hasDb = Boolean(process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL);
const shared = globalThis as typeof globalThis & { tolkReadAloudStore?: ReadAloudStore };
export const readAloudStore = (shared.tolkReadAloudStore ??= hasDb ? createMySqlReadAloudStore() : createInMemoryReadAloudStore());

/** The clean summary saved for this Reader's reading of this Chapter Version, or null if they didn't read aloud. */
export function getReadAloudSummary(readerId: string, chapterVersionId: string): Promise<ReadAloudSummary | null> {
  return readAloudStore.get(readerId, chapterVersionId);
}

/** Call after grading a completion with `summary`, so the next completion of this Version starts without it. */
export function consumeReadAloudSummary(readerId: string, summary: ReadAloudSummary): Promise<void> {
  return readAloudStore.consume(readerId, summary);
}

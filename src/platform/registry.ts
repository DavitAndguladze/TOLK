import type { ReadAloudSummary } from "../types";
import { createInMemoryReadAloudStore } from "./read-aloud-store";

// In memory until the database lands (#7). On globalThis so every route bundle and hot reload shares one store.
const shared = globalThis as typeof globalThis & { tolkReadAloudStore?: ReturnType<typeof createInMemoryReadAloudStore> };
export const readAloudStore = (shared.tolkReadAloudStore ??= createInMemoryReadAloudStore());

/** The clean summary saved for this Reader's reading of this Chapter Version, or null if they didn't read aloud. */
export function getReadAloudSummary(readerId: string, chapterVersionId: string): Promise<ReadAloudSummary | null> {
  return readAloudStore.get(readerId, chapterVersionId);
}

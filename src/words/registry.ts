import { LEVELS } from "../types";
import { mockChapterVersion } from "../mocks";
import { createFlagStore } from "./flags";

// In memory until the database lands. On globalThis so every route bundle and hot reload shares one store.
const shared = globalThis as typeof globalThis & { tolkFlagStore?: ReturnType<typeof createFlagStore> };
export const flagStore = (shared.tolkFlagStore ??= createFlagStore());

// Mock Chapter Versions until ingestion (#6) and next-Chapter generation (#14) land.
const versions = LEVELS.map((level) => mockChapterVersion(level));

export function findChapterVersion(id: string) {
  return versions.find((v) => v.id === id);
}

/** Per-browser Reader id the client sends until sign-in (#7), same header as the Chapter Check. */
export function readerIdOf(req: Request): string {
  return req.headers.get("x-reader-session") ?? "anonymous";
}

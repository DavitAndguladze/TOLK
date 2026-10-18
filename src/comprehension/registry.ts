import type { ChapterCheck } from "../types";
import { createInMemoryAnswersStore } from "./answers-store";

/**
 * Dev-only process-wide singletons so the two route handlers can find each other's state without
 * a database (until #05's Postgres lands). The tested modules (service.ts, answers-store.ts)
 * don't depend on this - it's only the glue the routes need.
 */
export const chapterCheckCache = new Map<string, ChapterCheck>(); // keyed by Chapter Version id
export const checksById = new Map<string, ChapterCheck>(); // keyed by Chapter Check id
export const answersStore = createInMemoryAnswersStore();

import type { Chapter, ChapterCheck, Grading, Level, LevelDecision, SessionResult, WordBankUpdate } from "../types";
import { LEVELS } from "../types";
import { mockChapter, mockChapterVersion } from "../mocks";
import { createInMemoryAnswersStore } from "./answers-store";
import { generateChapterCheck } from "./chapter-check-generator";
import type { KeyPointGrader } from "./grade-check";
import { mockKeyPointGrader } from "./key-point-grader";
import { getChapterCheckForVersion } from "./service";

/**
 * Dev-only process-wide singletons so the two route handlers (and the reading page) can find
 * each other's state without a database (until #05's Postgres lands). The tested modules
 * (service.ts, answers-store.ts, chapter-check-generator.ts) don't depend on this - it's only
 * the glue the routes need.
 */
export const chapterCheckCache = new Map<string, Promise<ChapterCheck>>(); // keyed by Chapter Version id
export const checksById = new Map<string, ChapterCheck>(); // keyed by Chapter Check id
export const answersStore = createInMemoryAnswersStore();
export const sessionResults = new Map<string, SessionResult>(); // keyed like answersStore: `${checkId}:${readerSessionId}`

// OCI Generative AI grading swaps in here (#12, next slice).
export const keyPointGrader: KeyPointGrader = mockKeyPointGrader;

/** Stand-in until R6's Level rules (#13): the next Chapter stays at this Level. */
export function holdLevel(level: Level, grading: Grading): LevelDecision {
  return {
    from: level,
    to: level,
    reason: grading.result === "struggled" ? "struggled-hold" : grading.result === "partly-understood" ? "partly-understood" : "barely-passed",
    explanation: "Your next Chapter stays at this Level.",
    reinforcement: "plain",
  };
}

/** Stand-in until the Word Bank (#13) lands. */
export const emptyWordBankUpdate: WordBankUpdate = { bank: [], graduatedThisChapter: [], wordsLearnedTotal: 0 };

// Mock Chapter Versions until #04/#05 land real Book ingestion and a Chapter Version store.
export const mockVersions = LEVELS.map((level) => mockChapterVersion(level));

export function findMockVersion(versionId: string) {
  return mockVersions.find((v) => v.id === versionId);
}

/** Generates (once, cached) and registers a Chapter Version's check so the answers route can recover it by id later. */
export async function ensureChapterCheck(versionId: string, chapter: Chapter = mockChapter): Promise<ChapterCheck | null> {
  const version = findMockVersion(versionId);
  if (!version) return null;
  const check = await getChapterCheckForVersion(chapter, version, { generate: generateChapterCheck, cache: chapterCheckCache });
  checksById.set(check.id, check);
  return check;
}

import type { Api, Chapter, ChapterCheck, Grading, Level, LevelDecision, SessionResult, WordBankEntry, WordBankUpdate } from "../types";
import { LEVELS } from "../types";
import { mockChapter, mockChapterVersion } from "../mocks";
import { type ChapterEvidence, updateWordBank } from "../words/word-bank";
import { createInMemoryAnswersStore } from "./answers-store";
import { generateChapterCheck, type ChapterCheckGenerator } from "./chapter-check-generator";
import type { KeyPointGrader } from "./grade-check";
import { mockKeyPointGrader } from "./key-point-grader";
import { createOciChapterCheckGenerator } from "./oci-chapter-check-generator";
import { createOciChat } from "./oci-chat";
import { createOciKeyPointGrader } from "./oci-key-point-grader";
import { getChapterCheckForVersion } from "./service";

type AnswersResponse = Api["POST /api/checks/[checkId]/answers"]["res"];

/**
 * Dev-only process-wide singletons so the two route handlers (and the reading page) can find
 * each other's state without a database (until the MySQL HeatWave store lands, R6 #40). The tested modules
 * (service.ts, answers-store.ts, chapter-check-generator.ts) don't depend on this - it's only
 * the glue the routes need.
 */
export const chapterCheckCache = new Map<string, Promise<ChapterCheck>>(); // keyed by Chapter Version id
export const checksById = new Map<string, ChapterCheck>(); // keyed by Chapter Check id
export const answersStore = createInMemoryAnswersStore();
export const sessionResults = new Map<string, SessionResult>(); // keyed like answersStore: `${checkId}:${readerSessionId}`
// The last answered completion per `${checkId}:${readerSessionId}`, so a retried submission gets the same
// result without grading, spending a reading, or touching the Word Bank again. On globalThis like the
// read-aloud store, so a hot reload can't lose it while the reading it spent stays spent.
const shared = globalThis as typeof globalThis & { tolkCompletedChecks?: Map<string, { key: string; res: AnswersResponse }> };
export const completedChecks = (shared.tolkCompletedChecks ??= new Map());
export const wordBanks = new Map<string, WordBankEntry[]>(); // keyed by Reader session id

// OCI Generative AI grades Key Point answers when .env.local configures it; the stand-in otherwise, and as its fallback.
const ociChat = createOciChat();
export const keyPointGrader: KeyPointGrader = ociChat
  ? createOciKeyPointGrader({ chat: ociChat, fallback: mockKeyPointGrader, timeoutMs: 10_000 })
  : mockKeyPointGrader;

// OCI Generative AI writes the Key Point questions the same way, falling back to the deterministic Check.
const chapterCheckGenerator: ChapterCheckGenerator = ociChat
  ? createOciChapterCheckGenerator({ chat: ociChat, fallback: generateChapterCheck, timeoutMs: 15_000 })
  : generateChapterCheck;

/** Stand-in until R6's Level rules (#13): the next Chapter stays at this Level. */
export function holdLevel(level: Level, grading: Grading): LevelDecision {
  return {
    from: level,
    to: level,
    reason:
      grading.result === "struggled" ? "struggled-hold"
      : grading.result === "partly-understood" ? "partly-understood"
      : grading.barelyPassed ? "barely-passed"
      : "fully-understood", // still held at this Level until #13; reason just names what actually happened
    explanation: "Your next Chapter stays at this Level.",
    reinforcement: "plain",
  };
}

/** Applies one Chapter's evidence to a Reader's Word Bank and persists the result. */
export function recordWordBank(readerId: string, evidence: ChapterEvidence): WordBankUpdate {
  const update = updateWordBank(wordBanks.get(readerId) ?? [], evidence);
  wordBanks.set(readerId, update.bank);
  return update;
}

// Mock Chapter Versions until #04/#05 land real Book ingestion and a Chapter Version store.
export const mockVersions = LEVELS.map((level) => mockChapterVersion(level));

export function findMockVersion(versionId: string) {
  return mockVersions.find((v) => v.id === versionId);
}

/** Generates (once, cached) and registers a Chapter Version's check so the answers route can recover it by id later. */
export async function ensureChapterCheck(versionId: string, chapter: Chapter = mockChapter): Promise<ChapterCheck | null> {
  const version = findMockVersion(versionId);
  if (!version) return null;
  const check = await getChapterCheckForVersion(chapter, version, { generate: chapterCheckGenerator, cache: chapterCheckCache });
  checksById.set(check.id, check);
  return check;
}

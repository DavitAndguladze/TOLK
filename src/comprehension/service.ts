import type { Chapter, ChapterCheck, ChapterCheckAnswers, ChapterVersion } from "../types";
import type { AnswersStore } from "./answers-store";
import type { ChapterCheckGenerator } from "./chapter-check-generator";
import { recordAnswers } from "./record-answers";

export interface ChapterCheckDeps {
  generate: ChapterCheckGenerator;
  /**
   * Keyed by Chapter Version id, holding the in-flight or resolved check. Caching the promise
   * (not just the resolved value) matters because Chapter 1's L1 version is shared across every
   * Reader (ADR-0008): two Readers requesting it before it's cached must not trigger two
   * generations.
   */
  cache: Map<string, Promise<ChapterCheck>>;
}

/** Generates a Chapter Version's check once and caches it - this is what makes "opens with no spinner" true. */
export async function getChapterCheckForVersion(
  chapter: Chapter,
  version: ChapterVersion,
  deps: ChapterCheckDeps,
): Promise<ChapterCheck> {
  const cached = deps.cache.get(version.id);
  if (cached) return cached;

  const pending = deps.generate(chapter, version).catch((err) => {
    deps.cache.delete(version.id); // let the next call retry instead of caching a permanent failure
    throw err;
  });
  deps.cache.set(version.id, pending);
  return pending;
}

/**
 * Validates and stores a Chapter Check submission. Deliberately returns only confirmation of
 * storage, not a full result - grading (#10), the Level decision (#11), and the next Chapter
 * Version (#12) are separate tickets that consume these stored answers.
 */
export async function submitCheckAnswers(
  check: ChapterCheck,
  submission: ChapterCheckAnswers,
  store: AnswersStore,
): Promise<{ stored: true }> {
  const answers = recordAnswers(check, submission);
  await store.save(check.id, answers);
  return { stored: true };
}

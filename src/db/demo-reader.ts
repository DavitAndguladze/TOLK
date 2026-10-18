// The presenter's returning Reader (#16, spec amendment r3-gatsby-progression: "Returning-reader demonstration"):
// Chapters 1 and 2 completed at L1 through the normal grading, Word Bank and Level rules, resuming at Chapter 3,
// so a strong live Chapter 3 result promotes to L2. Reset touches only that Reader's rows.
import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { combineGrading } from "../comprehension/grading";
import { decideNextLevel } from "../comprehension/level-rules";
import type { ChapterCheck, ChapterVersion, LevelDecision, QuestionGrade, ReadAloudSummary, SessionResult, WordBankUpdate } from "../types";
import { chapterEvidence, updateWordBank } from "../words/word-bank";
import { db, levelHistory, recordSessionResult, setBookProgress } from ".";
import {
  bookProgress, chapterArtifacts, chapterChecks, chapterCompletions, chapterGenerations, chapters, chapterVersions,
  flaggedWords, readAloudSummaries, readerWordBanks, sessionResults,
} from "./schema";

type Outcome = { session: SessionResult; decision: LevelDecision; wordBank: WordBankUpdate; nextVersionId: string | null };
const DAY = 24 * 60 * 60 * 1000;

/** Deletes everything this Reader did: progress, history, completions, Word Bank, flags, readings, own Versions. */
export async function resetDemoReader(readerId: string): Promise<void> {
  await db().transaction(async (tx) => {
    const own = (await tx.select({ id: chapterVersions.id }).from(chapterVersions).where(eq(chapterVersions.readerId, readerId))).map((v) => v.id);
    await tx.delete(chapterCompletions).where(eq(chapterCompletions.readerId, readerId));
    await tx.delete(flaggedWords).where(eq(flaggedWords.readerId, readerId));
    await tx.delete(readAloudSummaries).where(eq(readAloudSummaries.readerId, readerId));
    await tx.delete(sessionResults).where(eq(sessionResults.readerId, readerId));
    await tx.delete(bookProgress).where(eq(bookProgress.readerId, readerId));
    await tx.delete(readerWordBanks).where(eq(readerWordBanks.readerId, readerId));
    await tx.delete(chapterGenerations).where(eq(chapterGenerations.readerId, readerId));
    if (own.length) {
      await tx.delete(chapterArtifacts).where(inArray(chapterArtifacts.versionId, own));
      await tx.delete(chapterChecks).where(inArray(chapterChecks.chapterVersionId, own));
      await tx.delete(chapterVersions).where(inArray(chapterVersions.id, own));
    }
  });
}

/**
 * Resets the Reader, then completes Chapters 1 and 2 at L1 (two and one days ago) and resumes at Chapter 3, L1.
 * Chapter 1: every answer right, one Flagged Word, one stumble aloud. Chapter 2: one Key Point answer half right.
 * Returns the Chapter 3 score that promotes under the Level rules, for the presenter's rehearsal.
 */
export async function seedDemoReader(readerId: string, bookId: string, now = new Date()) {
  const shared: { version: ChapterVersion; check: ChapterCheck }[] = [];
  for (const number of [1, 2, 3]) {
    const [row] = await db().select({ version: chapterVersions.data, check: chapterChecks.data }).from(chapterVersions)
      .innerJoin(chapterChecks, eq(chapterChecks.chapterVersionId, chapterVersions.id))
      .where(and(eq(chapterVersions.bookId, bookId), eq(chapterVersions.chapterNumber, number), eq(chapterVersions.level, 1), isNull(chapterVersions.readerId)))
      .limit(1);
    if (!row || row.version.status !== "ready") throw new Error(`Book ${bookId} has no ready shared L1 Chapter ${number} with a Check`);
    shared.push(row);
  }
  const [{ id: chapterId } = { id: null }] = await db().select({ id: chapters.id }).from(chapters).where(and(eq(chapters.bookId, bookId), eq(chapters.number, 3)));
  if (!chapterId) throw new Error(`Book ${bookId} has no Chapter 3`);

  await resetDemoReader(readerId);
  let bank = (await db().select({ data: readerWordBanks.data }).from(readerWordBanks).where(eq(readerWordBanks.readerId, readerId)))[0]?.data ?? [];
  for (const [i, { version, check }] of shared.slice(0, 2).entries()) {
    const completedAt = new Date(now.getTime() - (2 - i) * DAY);
    const readAloud = reading(version, completedAt);
    const flagged = i === 0 ? [teachingWord(version)] : [];
    const grading = combineGrading({
      questionGrades: answers(check, version, i === 1), readAloud, flaggedWords: flagged.map((f) => f.word), complexWordMisses: [], gradedBy: "oci-generative-ai",
    });
    const session: SessionResult = {
      id: randomUUID(), readerId, chapterVersionId: version.id, chapterNumber: version.chapterNumber, level: 1,
      readAloudMisses: readAloud.misses, grading, completedAt: completedAt.toISOString(),
    };
    await recordSessionResult(session, bookId);
    const decision = decideNextLevel(1, grading, await levelHistory(readerId, bookId));
    const wordBank = updateWordBank(bank, chapterEvidence({ version, check, grading, readAloud }));
    bank = wordBank.bank;
    const next = shared[i + 1].version.id;
    for (const flag of flagged) {
      await db().insert(flaggedWords).values({ readerId, chapterVersionId: version.id, tokenIndex: flag.tokenIndex,
        data: { word: flag.word, tokenIndex: flag.tokenIndex, chapterVersionId: version.id, at: completedAt.toISOString() } });
    }
    const outcome: Outcome = { session, decision, wordBank, nextVersionId: next };
    await db().insert(chapterCompletions).values({ readerId, chapterVersionId: version.id, data: outcome });
  }
  await db().insert(readerWordBanks).values({ readerId, data: bank }).onDuplicateKeyUpdate({ set: { data: bank } });
  const resume = shared[2].version;
  await setBookProgress(readerId, { bookId, currentChapterNumber: 3, currentLevel: 1, currentVersionId: resume.id });

  const history = await levelHistory(readerId, bookId);
  const promotes = (score: number) => decideNextLevel(1, { ...history[1].grading, score },
    [...history, { ...history[1], id: "chapter-3", chapterNumber: 3, chapterVersionId: resume.id, grading: { ...history[1].grading, score } }]).to === 2;
  const minimumPromotingScore = Array.from({ length: 101 }, (_, score) => score).find(promotes) ?? null;
  return { resumeVersionId: resume.id, history: history.map((s) => ({ chapter: s.chapterNumber, score: s.grading.score })), minimumPromotingScore };
}

/** The demo Reader's saved Chapter outcomes, oldest first. */
export async function getSavedOutcomes(readerId: string): Promise<Outcome[]> {
  const rows = await db().select({ data: chapterCompletions.data }).from(chapterCompletions).where(eq(chapterCompletions.readerId, readerId));
  return rows.map((r) => r.data).sort((a, b) => a.session.completedAt.localeCompare(b.session.completedAt));
}

/** Every Key Point and Complex Word answered right; `halfOnOne` makes the first Key Point answer partly right. */
function answers(check: ChapterCheck, version: ChapterVersion, halfOnOne: boolean): QuestionGrade[] {
  const firstKeyPoint = check.questions.find((q) => q.kind === "key-point")?.id;
  return check.questions.map((q) => {
    const half = halfOnOne && q.id === firstKeyPoint;
    const sentence = version.sentences.find((s) => s.index === q.answerSentenceIndex)?.text ?? null;
    return { questionId: q.id, grade: half ? 1 : 2, feedback: half ? "Close. Reread the sentence that answers it." : "Yes.",
      rereadSentenceIndex: half ? q.answerSentenceIndex : null, rereadSentence: half ? sentence : null };
  });
}

/** A fluent reading aloud: every word right except one stumble on the Chapter's teaching word. */
function reading(version: ChapterVersion, endedAt: Date): ReadAloudSummary {
  const stumble = teachingWord(version);
  const wordResults = version.tokens.map((t) => ({ tokenIndex: t.index, outcome: t.index === stumble.tokenIndex ? "mispronounced" as const : "correct" as const, hesitationMs: 0 }));
  return {
    chapterVersionId: version.id, wordResults, misses: [{ word: stumble.word, tokenIndex: stumble.tokenIndex, kind: "mispronounced" }],
    accuracy: (wordResults.length - 1) / wordResults.length,
    startedAt: new Date(endedAt.getTime() - 10 * 60 * 1000).toISOString(), endedAt: endedAt.toISOString(),
  };
}

/** The longest word in the Version: a stand-in for the word a Reader would flag or stumble on. */
function teachingWord(version: ChapterVersion): { word: string; tokenIndex: number } {
  const token = version.tokens.reduce((a, b) => (b.normalized.length > a.normalized.length ? b : a));
  return { word: token.normalized, tokenIndex: token.index };
}

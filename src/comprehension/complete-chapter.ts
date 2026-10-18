import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, getBookProgress, getChapter, getChapterVersion, levelHistory, recordSessionResult, setBookProgress } from "../db";
import { resolveGeneration, startGeneration } from "../db/generation";
import { chapterChecks, chapterCompletions, chapters, chapterVersions, readerWordBanks, readAloudSummaries, user } from "../db/schema";
import type { Api, ChapterCheckAnswers, NextChapterInput } from "../types";
import { chapterEvidence, updateWordBank } from "../words/word-bank";
import { listFlags } from "../words/mysql-flags";
import { gradeChapterCheck } from "./grade-check";
import { decideNextLevel } from "./level-rules";
import { readAloudForAttempt } from "./read-aloud-attempt";
import { AnswerValidationError, recordAnswers } from "./record-answers";
import { runGeneration } from "../leveling/runtime";

export type ChapterCompletion = Api["POST /api/checks/[checkId]/answers"]["res"];
export class CompletionError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function getChapterCompletion(readerId: string, versionId: string): Promise<ChapterCompletion | null> {
  const [saved] = await db().select({ data: chapterCompletions.data }).from(chapterCompletions)
    .where(and(eq(chapterCompletions.readerId, readerId), eq(chapterCompletions.chapterVersionId, versionId)));
  return saved?.data ?? null;
}

export async function getReaderWordBank(readerId: string) {
  const [row] = await db().select({ data: readerWordBanks.data }).from(readerWordBanks).where(eq(readerWordBanks.readerId, readerId));
  return row?.data ?? [];
}

/** Retry handlers use this saved decision/bank, never a current bank or browser-supplied generation input. */
export async function getSavedGenerationInput(readerId: string, pendingId: string): Promise<NextChapterInput | null> {
  const pending = await resolveGeneration(readerId, pendingId);
  if (!pending) return null;
  const outcome = await getChapterCompletion(readerId, pending.baselineVersionId);
  if (!outcome || outcome.nextVersionId !== pendingId) return null;
  const baseline = await getChapterVersion(pending.baselineVersionId);
  const original = baseline && await getChapter(baseline.bookId, baseline.chapterNumber + 1);
  if (!baseline || !original) return null;
  return { baseline, original, readerId, decision: outcome.decision,
    wordBank: outcome.wordBank.bank.filter((word) => !word.graduated),
    graduatedWords: outcome.wordBank.bank.filter((word) => word.graduated).map((word) => word.word) };
}

/** Runs only after the outcome commits. A retry reuses the same generation identity and saved inputs. */
export async function generateCompletedChapter(outcome: ChapterCompletion, generate: typeof runGeneration = runGeneration): Promise<void> {
  if (!outcome.nextVersionId) return;
  const { session } = outcome;
  const pending = await resolveGeneration(session.readerId, outcome.nextVersionId);
  // Failed generation is retried only by R3's explicit bounded-retry flow, never by an answers replay.
  if (pending?.status !== "pending") return;
  const input = await getSavedGenerationInput(session.readerId, outcome.nextVersionId);
  if (!input) throw new Error("Missing saved Chapter generation input");
  const { baseline } = input;
  const result = await generate(outcome.nextVersionId, input);
  if (result?.status === "ready" && result.artifact) await db().transaction(async (tx) => {
    await tx.select({ id: user.id }).from(user).where(eq(user.id, session.readerId)).for("update");
    const progress = await getBookProgress(session.readerId, baseline.bookId, tx);
    if (progress?.currentVersionId !== outcome.nextVersionId) return;
    await setBookProgress(session.readerId, { bookId: baseline.bookId, currentChapterNumber: result.chapterNumber,
      currentLevel: result.level, currentVersionId: result.artifact!.version.id }, tx);
  });
}

/** One Reader lock protects both the cross-Book Word Bank and every completion effect. */
export async function completeChapter(readerId: string, checkId: string, submission: ChapterCheckAnswers,
  grading: Parameters<typeof gradeChapterCheck>[1]): Promise<ChapterCompletion> {
  return db().transaction(async (tx) => {
    const [reader] = await tx.select({ id: user.id }).from(user).where(eq(user.id, readerId)).for("update");
    if (!reader) throw new CompletionError("Sign in first", 401);
    const [storedCheck] = await tx.select({ data: chapterChecks.data }).from(chapterChecks).where(eq(chapterChecks.id, checkId));
    const check = storedCheck?.data;
    const [storedVersion] = check ? await tx.select({ data: chapterVersions.data }).from(chapterVersions).where(eq(chapterVersions.id, check.chapterVersionId)) : [];
    const version = storedVersion?.data;
    if (!check || !version || version.status !== "ready" || (version.readerId !== null && version.readerId !== readerId)) {
      throw new CompletionError("Chapter Check not found", 404);
    }
    const [done] = await tx.select({ data: chapterCompletions.data }).from(chapterCompletions)
      .where(and(eq(chapterCompletions.readerId, readerId), eq(chapterCompletions.chapterVersionId, version.id)));
    if (done) return done.data;
    const progress = await getBookProgress(readerId, version.bookId, tx);
    if (progress && progress.currentVersionId !== version.id) throw new CompletionError("Open your current Chapter before submitting its Check", 409);
    if (!progress && version.chapterNumber !== 1) throw new CompletionError("Open the first Chapter before continuing", 409);
    const [storedChapter] = await tx.select({ data: chapters.data }).from(chapters).where(eq(chapters.id, version.chapterId));
    const chapter = storedChapter?.data;
    if (!chapter || chapter.bookId !== version.bookId || chapter.number !== version.chapterNumber) throw new CompletionError("Chapter not found", 404);
    if (submission?.readAloudStartedAt != null && (typeof submission.readAloudStartedAt !== "string" || !Number.isFinite(Date.parse(submission.readAloudStartedAt)))) {
      throw new AnswerValidationError("Invalid read-aloud timestamp");
    }
    const answers = recordAnswers(check, submission);
    const flags = await listFlags(readerId, version.id, tx);
    const [savedReading] = await tx.select({ data: readAloudSummaries.data }).from(readAloudSummaries)
      .where(and(eq(readAloudSummaries.readerId, readerId), eq(readAloudSummaries.chapterVersionId, version.id)));
    const readAloud = readAloudForAttempt(submission.readAloudStartedAt, savedReading?.data ?? null);
    const session = await gradeChapterCheck({ check, chapter, version, answers, readAloud, readerId,
      flaggedWords: [...new Set(flags.map((flag) => flag.word))] }, grading);
    session.id = randomUUID();
    await recordSessionResult(session, version.bookId, tx);
    const decision = decideNextLevel(version.level, session.grading, await levelHistory(readerId, version.bookId, tx));
    const [savedBank] = await tx.select({ data: readerWordBanks.data }).from(readerWordBanks).where(eq(readerWordBanks.readerId, readerId));
    const wordBank = updateWordBank(savedBank?.data ?? [], chapterEvidence({ version, check, grading: session.grading, readAloud }));
    await tx.insert(readerWordBanks).values({ readerId, data: wordBank.bank }).onDuplicateKeyUpdate({ set: { data: wordBank.bank } });
    const [nextChapter] = await tx.select({ id: chapters.id }).from(chapters)
      .where(and(eq(chapters.bookId, version.bookId), eq(chapters.number, version.chapterNumber + 1)));
    const nextVersionId = nextChapter ? await startGeneration(readerId, version.bookId, version.chapterNumber + 1, decision.to, version.id, tx) : null;
    await setBookProgress(readerId, { bookId: version.bookId, currentChapterNumber: nextVersionId ? version.chapterNumber + 1 : version.chapterNumber,
      currentLevel: nextVersionId ? decision.to : version.level, currentVersionId: nextVersionId ?? version.id }, tx);
    const outcome = { session, decision, wordBank, nextVersionId };
    await tx.insert(chapterCompletions).values({ readerId, chapterVersionId: version.id, data: outcome });
    if (readAloud) await tx.delete(readAloudSummaries).where(and(eq(readAloudSummaries.readerId, readerId),
      eq(readAloudSummaries.chapterVersionId, version.id), sql`${readAloudSummaries.data} = CAST(${JSON.stringify(readAloud)} AS JSON)`));
    return outcome;
  });
}

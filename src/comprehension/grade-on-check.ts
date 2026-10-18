import { and, eq } from "drizzle-orm";
import { db, getBookProgress } from "../db";
import { chapterChecks, chapters, chapterVersions } from "../db/schema";
import type { Chapter, ChapterCheck, ChapterCheckAnswers, ChapterVersion, QuestionGrade } from "../types";
import { rememberingKeyPointGrader, type AnswerGradeStore } from "./answer-grades";
import { CompletionError } from "./complete-chapter";
import { gradeQuestion, type KeyPointGrader } from "./grade-check";
import { AnswerValidationError, recordAnswers } from "./record-answers";

/** Each Check may reach OCI, so one answer is capped; submitting the whole Check has no such limit. */
export const MAX_CHECKED_ANSWER_LENGTH = 1000;

type AnswerEntry = ChapterCheckAnswers["answers"][number];

/**
 * Grades one answer when the Reader presses Check (#97): validated exactly as the whole Check would
 * validate it, graded with gradeQuestion, and remembered so submitting the Check reuses this grade.
 */
export async function gradeAnswerOnCheck(
  input: { readerId: string; check: ChapterCheck; chapter: Chapter; version: ChapterVersion; questionId: string; entry: AnswerEntry },
  deps: { keyPointGrader: KeyPointGrader; store: AnswerGradeStore },
): Promise<QuestionGrade> {
  const { readerId, check, chapter, version, questionId, entry } = input;
  const question = check.questions.find((q) => q.id === questionId);
  if (!question) throw new AnswerValidationError(`"${questionId}" is not a question on check "${check.id}"`);
  if (entry?.questionId !== questionId) throw new AnswerValidationError("The answer must be for this question");
  if (typeof entry.answer === "string" && entry.answer.length > MAX_CHECKED_ANSWER_LENGTH) throw new AnswerValidationError("Answer is too long");
  const [answer] = recordAnswers({ ...check, questions: [question] }, { answers: [entry] }).answers;
  const keyPointGrader = rememberingKeyPointGrader(deps.keyPointGrader, deps.store, { readerId, checkId: check.id });
  return (await gradeQuestion({ question, chapter, version, answer: answer.answer }, { keyPointGrader })).grade;
}

/** The stored Check a signed-in Reader may grade answers on now: the same rules as completing it. */
export async function loadCheckForReader(readerId: string, checkId: string): Promise<{ check: ChapterCheck; chapter: Chapter; version: ChapterVersion }> {
  const [storedCheck] = await db().select({ data: chapterChecks.data }).from(chapterChecks).where(eq(chapterChecks.id, checkId));
  const check = storedCheck?.data;
  const [storedVersion] = check ? await db().select({ data: chapterVersions.data }).from(chapterVersions).where(eq(chapterVersions.id, check.chapterVersionId)) : [];
  const version = storedVersion?.data;
  if (!check || !version || version.status !== "ready" || (version.readerId !== null && version.readerId !== readerId)) {
    throw new CompletionError("Chapter Check not found", 404);
  }
  const progress = await getBookProgress(readerId, version.bookId);
  if (progress && progress.currentVersionId !== version.id) throw new CompletionError("Open your current Chapter before checking answers", 409);
  if (!progress && version.chapterNumber !== 1) throw new CompletionError("Open the first Chapter before continuing", 409);
  const [storedChapter] = await db().select({ data: chapters.data }).from(chapters)
    .where(and(eq(chapters.id, version.chapterId), eq(chapters.bookId, version.bookId)));
  const chapter = storedChapter?.data;
  if (!chapter || chapter.number !== version.chapterNumber) throw new CompletionError("Chapter not found", 404);
  return { check, chapter, version };
}

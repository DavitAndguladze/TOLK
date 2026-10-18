// Storage for Books, Chapter Versions, Checks and Reader progress (#7). API agreed in comms 0017.
import { and, asc, eq, gt, isNull, like, or, sql } from "drizzle-orm";
import type { Book, BookProgress, Chapter, ChapterCheck, ChapterVersion, SessionResult } from "../types";
import { db } from "./client";
import { bookProgress, books, chapterChecks, chapters, chapterVersions, sessionResults } from "./schema";

export { db } from "./client";
export type DatabaseConnection = Pick<ReturnType<typeof db>, "select" | "insert">;

export interface ContentBundle {
  books: Book[];
  chapters: Chapter[];
  versions: { version: ChapterVersion; check: ChapterCheck }[];
}

/** Idempotent: inserts what's missing, never rewrites an existing id (served content is immutable). */
export async function loadContent({ books: b, chapters: c, versions: v }: ContentBundle): Promise<void> {
  const d = db();
  if (b.length) await d.insert(books).ignore().values(b.map((data) => ({ id: data.id, title: data.title, author: data.author, data })));
  if (c.length) await d.insert(chapters).ignore().values(c.map((data) => ({ id: data.id, bookId: data.bookId, number: data.number, data })));
  if (v.length) {
    await d.insert(chapterVersions).ignore().values(
      v.map(({ version: data }) => ({ id: data.id, readerId: data.readerId, bookId: data.bookId, chapterNumber: data.chapterNumber, level: data.level, data })),
    );
    await d.insert(chapterChecks).ignore().values(v.map(({ check: data }) => ({ id: data.id, chapterVersionId: data.chapterVersionId, data })));
  }
}

export async function getBook(id: string): Promise<Book | null> {
  const [row] = await db().select({ data: books.data }).from(books).where(eq(books.id, id));
  return row?.data ?? null;
}

export async function getChapter(bookId: string, number: number): Promise<Chapter | null> {
  const [row] = await db().select({ data: chapters.data }).from(chapters).where(and(eq(chapters.bookId, bookId), eq(chapters.number, number)));
  return row?.data ?? null;
}

export async function getChapterVersion(id: string): Promise<ChapterVersion | null> {
  const [row] = await db().select({ data: chapterVersions.data }).from(chapterVersions).where(eq(chapterVersions.id, id));
  return row?.data ?? null;
}

export async function getChapterCheck(chapterVersionId: string): Promise<ChapterCheck | null> {
  const [row] = await db().select({ data: chapterChecks.data }).from(chapterChecks).where(eq(chapterChecks.chapterVersionId, chapterVersionId));
  return row?.data ?? null;
}

export async function getBookProgress(readerId: string, bookId: string, connection: DatabaseConnection = db()): Promise<BookProgress | null> {
  const [row] = await connection.select().from(bookProgress).where(and(eq(bookProgress.readerId, readerId), eq(bookProgress.bookId, bookId)));
  return row ? { bookId, currentChapterNumber: row.currentChapterNumber, currentLevel: row.currentLevel, currentVersionId: row.currentVersionId } : null;
}

/** Moves the Reader's place in a Book. An actual Level change restarts Level history (#41). */
export async function setBookProgress(readerId: string, progress: BookProgress, connection: DatabaseConnection = db()): Promise<void> {
  const before = await getBookProgress(readerId, progress.bookId, connection);
  const levelChanged = before !== null && before.currentLevel !== progress.currentLevel;
  const values = {
    currentChapterNumber: progress.currentChapterNumber,
    currentLevel: progress.currentLevel,
    currentVersionId: progress.currentVersionId,
    updatedAt: new Date(),
    ...(levelChanged && { levelChangedAt: new Date() }),
  };
  await connection.insert(bookProgress).values({ readerId, bookId: progress.bookId, ...values }).onDuplicateKeyUpdate({ set: values });
}

/** Saves a finished Chapter. A duplicate submit for the same Chapter Version returns the first result unchanged. */
export async function recordSessionResult(session: SessionResult, bookId: string, connection: DatabaseConnection = db()): Promise<SessionResult> {
  // A no-op update rather than INSERT IGNORE: IGNORE would also turn a too-long or invalid value into a
  // silent truncation, and the lookup below would then find nothing.
  await connection.insert(sessionResults).values({
    id: session.id,
    readerId: session.readerId,
    bookId,
    chapterVersionId: session.chapterVersionId,
    chapterNumber: session.chapterNumber,
    level: session.level,
    completedAt: new Date(session.completedAt),
    data: session,
  }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
  const [row] = await connection
    .select({ data: sessionResults.data })
    .from(sessionResults)
    .where(and(eq(sessionResults.readerId, session.readerId), eq(sessionResults.chapterVersionId, session.chapterVersionId)));
  if (!row) throw new Error(`Session Result ${session.id} was not saved for Chapter Version ${session.chapterVersionId}`);
  return row.data;
}

/**
 * Input for `decideNextLevel` (#60): this Reader's results in this Book since the last actual Level change,
 * one per Chapter (its latest), oldest first. Includes the just-recorded Chapter.
 */
export async function levelHistory(readerId: string, bookId: string, connection: DatabaseConnection = db()): Promise<SessionResult[]> {
  const [progress] = await connection.select({ since: bookProgress.levelChangedAt }).from(bookProgress).where(and(eq(bookProgress.readerId, readerId), eq(bookProgress.bookId, bookId)));
  const rows = await connection
    .select({ chapterNumber: sessionResults.chapterNumber, data: sessionResults.data })
    .from(sessionResults)
    .where(and(eq(sessionResults.readerId, readerId), eq(sessionResults.bookId, bookId), progress?.since ? gt(sessionResults.completedAt, progress.since) : undefined))
    .orderBy(asc(sessionResults.completedAt));
  const latest = new Map<number, SessionResult>();
  for (const { chapterNumber, data } of rows) {
    latest.delete(chapterNumber); // re-insert so a re-read Chapter sorts by its latest result
    latest.set(chapterNumber, data);
  }
  return [...latest.values()];
}

/** The Library: every Book matching `q` by title or author, with this Reader's place in it. */
export async function listLibrary(readerId: string, q = ""): Promise<(Book & { progress: BookProgress | null })[]> {
  const term = `%${q.trim()}%`;
  const rows = await db()
    .select({ data: books.data, progress: bookProgress })
    .from(books)
    .leftJoin(bookProgress, and(eq(bookProgress.bookId, books.id), eq(bookProgress.readerId, readerId)))
    .where(q.trim() ? or(like(books.title, term), like(books.author, term)) : undefined)
    .orderBy(books.title);
  return rows.map(({ data, progress: p }) => ({
    ...data,
    progress: p ? { bookId: data.id, currentChapterNumber: p.currentChapterNumber, currentLevel: p.currentLevel, currentVersionId: p.currentVersionId } : null,
  }));
}

/** Where this Reader resumes a Book: their current Chapter Version, or the shared Chapter 1 at L1 for a new Reader. */
export async function openBook(readerId: string, bookId: string): Promise<{ chapter: Pick<Chapter, "id" | "number" | "title">; version: ChapterVersion } | null> {
  const progress = await getBookProgress(readerId, bookId);
  let version = progress ? await getChapterVersion(progress.currentVersionId) : await sharedFirstChapter(bookId);
  if (!version && progress) version = await (await import("./generation")).getGenerationVersion(readerId, progress.currentVersionId);
  if (!version) return null;
  const chapter = await getChapter(bookId, version.chapterNumber);
  if (!chapter) return null;
  if (!progress) await setBookProgress(readerId, { bookId, currentChapterNumber: version.chapterNumber, currentLevel: version.level, currentVersionId: version.id });
  return { chapter: { id: chapter.id, number: chapter.number, title: chapter.title }, version };
}

async function sharedFirstChapter(bookId: string): Promise<ChapterVersion | null> {
  const [row] = await db()
    .select({ data: chapterVersions.data })
    .from(chapterVersions)
    .where(and(eq(chapterVersions.bookId, bookId), eq(chapterVersions.chapterNumber, 1), eq(chapterVersions.level, 1), isNull(chapterVersions.readerId)));
  return row?.data ?? null;
}

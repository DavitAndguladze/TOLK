// Storage for Books, Chapter Versions, Checks and Reader progress (#7). API agreed in comms 0017.
import { and, eq, isNull, like, or } from "drizzle-orm";
import type { Book, BookProgress, Chapter, ChapterCheck, ChapterVersion } from "../types";
import { db } from "./client";
import { bookProgress, books, chapterChecks, chapters, chapterVersions } from "./schema";

export { db } from "./client";

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

export async function getBookProgress(readerId: string, bookId: string): Promise<BookProgress | null> {
  const [row] = await db().select().from(bookProgress).where(and(eq(bookProgress.readerId, readerId), eq(bookProgress.bookId, bookId)));
  return row ? { bookId, currentChapterNumber: row.currentChapterNumber, currentLevel: row.currentLevel, currentVersionId: row.currentVersionId } : null;
}

export async function setBookProgress(readerId: string, progress: BookProgress): Promise<void> {
  const values = { currentChapterNumber: progress.currentChapterNumber, currentLevel: progress.currentLevel, currentVersionId: progress.currentVersionId };
  await db().insert(bookProgress).values({ readerId, bookId: progress.bookId, ...values }).onDuplicateKeyUpdate({ set: values });
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
  const version = progress ? await getChapterVersion(progress.currentVersionId) : await sharedFirstChapter(bookId);
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

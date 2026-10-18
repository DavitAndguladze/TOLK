import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { flaggedWords } from "../db/schema";
import type { ChapterVersion, FlaggedWord } from "../types";

export async function listFlags(readerId: string, versionId: string): Promise<FlaggedWord[]> {
  const rows = await db().select({ data: flaggedWords.data }).from(flaggedWords)
    .where(and(eq(flaggedWords.readerId, readerId), eq(flaggedWords.chapterVersionId, versionId)))
    .orderBy(flaggedWords.tokenIndex);
  return rows.map((row) => row.data);
}

/** Only server-loaded token data is persisted; repeating the same flag preserves its original time. */
export async function saveFlag(readerId: string, version: Pick<ChapterVersion, "id" | "tokens">, tokenIndex: number): Promise<FlaggedWord | null> {
  const token = Number.isSafeInteger(tokenIndex) ? version.tokens.find((item) => item.index === tokenIndex) : undefined;
  if (!token?.normalized) return null;
  const data: FlaggedWord = { word: token.normalized, chapterVersionId: version.id, tokenIndex, at: new Date().toISOString() };
  await db().insert(flaggedWords).ignore().values({ readerId, chapterVersionId: version.id, tokenIndex, data });
  const [saved] = await db().select({ data: flaggedWords.data }).from(flaggedWords)
    .where(and(eq(flaggedWords.readerId, readerId), eq(flaggedWords.chapterVersionId, version.id), eq(flaggedWords.tokenIndex, tokenIndex)));
  return saved?.data ?? null;
}

export async function removeFlag(readerId: string, versionId: string, tokenIndex: number): Promise<void> {
  await db().delete(flaggedWords)
    .where(and(eq(flaggedWords.readerId, readerId), eq(flaggedWords.chapterVersionId, versionId), eq(flaggedWords.tokenIndex, tokenIndex)));
}

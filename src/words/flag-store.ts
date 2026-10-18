import type { ChapterVersion, FlaggedWord } from "../types";

export function createFlagStore() {
  const byReaderAndVersion = new Map<string, Map<number, FlaggedWord>>();
  const keyOf = (readerId: string, chapterVersionId: string) => `${readerId}:${chapterVersionId}`;

  return {
    /** null when the token isn't in this Chapter Version. */
    flag(readerId: string, version: Pick<ChapterVersion, "id" | "tokens">, tokenIndex: number): FlaggedWord | null {
      const token = version.tokens.find((t) => t.index === tokenIndex);
      if (!token) return null;
      const flagged: FlaggedWord = { word: token.normalized, chapterVersionId: version.id, tokenIndex, at: new Date().toISOString() };
      const key = keyOf(readerId, version.id);
      byReaderAndVersion.set(key, (byReaderAndVersion.get(key) ?? new Map()).set(tokenIndex, flagged));
      return flagged;
    },

    unflag(readerId: string, chapterVersionId: string, tokenIndex: number): void {
      byReaderAndVersion.get(keyOf(readerId, chapterVersionId))?.delete(tokenIndex);
    },

    flaggedWords(readerId: string, chapterVersionId: string): string[] {
      const flags = byReaderAndVersion.get(keyOf(readerId, chapterVersionId))?.values() ?? [];
      return [...new Set([...flags].map((f) => f.word))];
    },
  };
}

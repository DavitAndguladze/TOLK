import type { ChapterVersion, FlaggedWord } from "../types";

export function createFlagStore() {
  const byReaderAndVersion = new Map<string, Map<number, FlaggedWord>>();
  const flagsOf = (readerId: string, chapterVersionId: string) => {
    const key = `${readerId}:${chapterVersionId}`;
    let flags = byReaderAndVersion.get(key);
    if (!flags) byReaderAndVersion.set(key, (flags = new Map()));
    return flags;
  };

  return {
    /** null when the token isn't in this Chapter Version. */
    flag(readerId: string, version: Pick<ChapterVersion, "id" | "tokens">, tokenIndex: number): FlaggedWord | null {
      const token = version.tokens.find((t) => t.index === tokenIndex);
      if (!token) return null;
      const flagged: FlaggedWord = { word: token.normalized, chapterVersionId: version.id, tokenIndex, at: new Date().toISOString() };
      flagsOf(readerId, version.id).set(tokenIndex, flagged);
      return flagged;
    },

    unflag(readerId: string, chapterVersionId: string, tokenIndex: number): void {
      flagsOf(readerId, chapterVersionId).delete(tokenIndex);
    },

    flaggedWords(readerId: string, chapterVersionId: string): string[] {
      return [...new Set([...flagsOf(readerId, chapterVersionId).values()].map((f) => f.word))];
    },
  };
}

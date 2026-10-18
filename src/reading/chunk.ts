import type { ChapterVersion, Sentence, Token } from "../types";

/** A short run of whole sentences shown on one screen and read aloud in one listening session. */
export interface Chunk {
  index: number;
  sentences: Sentence[];
  /** Keep their Chapter Version index, which is what listening reports results against. */
  tokens: Token[];
}

/** Resolve a reread link only within the served immutable Chapter Version. */
export function rereadChunk(chunks: readonly Chunk[], sentence: string | null): number {
  if (sentence === null || !/^\d+$/.test(sentence)) return -1;
  return chunks.findIndex(chunk => chunk.sentences.some(item => item.index === Number(sentence)));
}

/** Greedy: add whole sentences until the next one would pass `maxWords`. A longer sentence gets a chunk to itself. */
export function chunkChapterVersion(version: Pick<ChapterVersion, "sentences" | "tokens">, maxWords = 30): Chunk[] {
  const chunks: Chunk[] = [];
  const tokensBySentence = Map.groupBy(version.tokens, (t) => t.sentenceIndex);
  for (const sentence of version.sentences) {
    const tokens = tokensBySentence.get(sentence.index) ?? [];
    const last = chunks.at(-1);
    if (last && last.tokens.length + tokens.length <= maxWords) {
      last.sentences.push(sentence);
      last.tokens.push(...tokens);
    } else {
      chunks.push({ index: chunks.length, sentences: [sentence], tokens });
    }
  }
  return chunks;
}

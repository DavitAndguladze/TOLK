import { describe, expect, test } from "vitest";
import { LEVELS } from "../types";
import { mockChapterVersion } from "../mocks";
import { chunkChapterVersion, rereadChunk } from "./chunk";

const sentenceIndexes = (chunks: ReturnType<typeof chunkChapterVersion>) =>
  chunks.map((chunk) => chunk.sentences.map((s) => s.index));

describe("chunkChapterVersion", () => {
  test("opens the part containing the Check's actual sentence index", () => {
    const chunks = chunkChapterVersion(mockChapterVersion(1), 23);
    expect(rereadChunk(chunks, "3")).toBe(1);
    expect(rereadChunk(chunks, "0")).toBe(0);
  });
  test.each([null, "", "-1", "1.5", "999", "not-a-sentence", "0x0"])("ignores an absent or invalid reread target: %s", sentence => {
    expect(rereadChunk(chunkChapterVersion(mockChapterVersion(1)), sentence)).toBe(-1);
  });
  test("groups whole sentences into chunks that fit the word budget", () => {
    // L1 sentences are 9, 5, 9 and 10 words long: the first three fill a budget of 23 exactly.
    const chunks = chunkChapterVersion(mockChapterVersion(1), 23);

    expect(sentenceIndexes(chunks)).toEqual([[0, 1, 2], [3]]);
    expect(chunks[1].tokens.map((t) => t.index)).toEqual([23, 24, 25, 26, 27, 28, 29, 30, 31, 32]);
  });

  test("gives a sentence longer than the budget a chunk of its own instead of splitting it", () => {
    // The author's two sentences are 23 and 26 words long.
    const chunks = chunkChapterVersion(mockChapterVersion(5), 20);

    expect(sentenceIndexes(chunks)).toEqual([[0], [1]]);
    expect(chunks.map((c) => c.tokens.length)).toEqual([23, 26]);
  });

  test.each(LEVELS)("covers every token of the L%i version exactly once, in reading order", (level) => {
    const version = mockChapterVersion(level);

    const tokens = chunkChapterVersion(version).flatMap((c) => c.tokens);

    expect(tokens).toEqual(version.tokens);
  });
});

import { describe, expect, test } from "vitest";
import { mockChapter, mockChapterVersion } from "../mocks";
import { NO_MEANING, createWordMeaning, meaningOf } from "./meaning";

describe("meaning of a flagged word", () => {
  test("uses the Chapter's Complex Word meaning when the word is one", () => {
    expect(meaningOf("vulnerable", mockChapter)).toBe("easily hurt or affected");
  });

  test("falls back to a plain message for any other word", () => {
    expect(meaningOf("father", mockChapter)).toBe(NO_MEANING);
  });

  test("defines an ordinary tapped word using its actual Chapter Version sentence", async () => {
    const define = createWordMeaning(async (prompt, options) => {
      expect(prompt).toContain("When I was young, my father gave me advice.");
      expect(prompt).toContain('"word":"father"');
      expect(options?.json).toBe(true);
      return JSON.stringify({ meaning: "The narrator's male parent." });
    });
    expect(await define(mockChapterVersion(1), 5, mockChapter)).toEqual({
      meaning: "The narrator's male parent.", source: "oci-generative-ai",
    });
  });

  test("reports a failed or malformed live lookup honestly without losing a prepared meaning", async () => {
    const version = mockChapterVersion(5);
    const index = version.tokens.find((token) => token.normalized === "vulnerable")!.index;
    expect(await createWordMeaning(async () => '{"meaning": false}')(version, index, mockChapter)).toEqual({ meaning: "easily hurt or affected", source: "chapter" });
    expect(await createWordMeaning(async () => { throw new Error("offline"); })(mockChapterVersion(1), 5, mockChapter)).toEqual({ meaning: NO_MEANING, source: "unavailable" });
  });

  test("ends a stalled lookup and refuses a token outside the supplied Version", async () => {
    const define = createWordMeaning(() => new Promise(() => {}), 5);
    expect(await define(mockChapterVersion(1), 5, mockChapter)).toEqual({ meaning: NO_MEANING, source: "unavailable" });
    await expect(define(mockChapterVersion(1), -1, mockChapter)).rejects.toThrow("No such word");
  });
});

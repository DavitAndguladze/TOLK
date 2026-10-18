import { describe, expect, test, vi } from "vitest";
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

  test("reuses a successful meaning for repeated and concurrent taps on the same Version word", async () => {
    let finish!: (value: string) => void;
    const chat = vi.fn(() => new Promise<string>((resolve) => { finish = resolve; }));
    const define = createWordMeaning(chat);
    const version = mockChapterVersion(1);
    const first = define(version, 5, mockChapter);
    const second = define(version, 5, mockChapter);
    await vi.waitFor(() => expect(chat).toHaveBeenCalledOnce());
    finish('{"meaning":"The narrator\'s male parent."}');
    const expected = { meaning: "The narrator's male parent.", source: "oci-generative-ai" };
    expect(await first).toEqual(expected);
    expect(await second).toEqual(expected);
    chat.mockRejectedValue(new Error("provider unavailable now"));
    expect(await define(version, 5, mockChapter)).toEqual(expected);
    expect(chat).toHaveBeenCalledOnce();
  });

  test("reports a failed or malformed live lookup honestly without losing a prepared meaning", async () => {
    const version = mockChapterVersion(5);
    const index = version.tokens.find((token) => token.normalized === "vulnerable")!.index;
    expect(await createWordMeaning(async () => '{"meaning": false}')(version, index, mockChapter)).toEqual({ meaning: "easily hurt or affected", source: "chapter" });
    expect(await createWordMeaning(async () => { throw new Error("offline"); })(mockChapterVersion(1), 5, mockChapter)).toEqual({ meaning: NO_MEANING, source: "unavailable" });
  });

  test("keeps meanings separate by immutable Version and token, and retries prepared fallbacks", async () => {
    const version = mockChapterVersion(5);
    const index = version.tokens.find((token) => token.normalized === "vulnerable")!.index;
    const chat = vi.fn().mockResolvedValueOnce('{"meaning":false}').mockResolvedValue('{"meaning":"Easily hurt."}');
    const define = createWordMeaning(chat);
    expect((await define(version, index, mockChapter)).source).toBe("chapter");
    expect((await define(version, index, mockChapter)).source).toBe("oci-generative-ai");
    chat.mockResolvedValue('{"meaning":"A different context."}');
    expect((await define({ ...version, id: "another-version" }, index, mockChapter)).meaning).toBe("A different context.");
    expect((await define(version, version.tokens.find((token) => token.normalized !== "vulnerable")!.index, mockChapter)).meaning).toBe("A different context.");
    expect((await define(version, index, mockChapter)).meaning).toBe("Easily hurt.");
    expect(chat).toHaveBeenCalledTimes(4);
    await expect(define({ ...version, tokens: [] }, index, mockChapter)).rejects.toThrow("No such word");
  });

  test("retries unavailable meanings and releases old successful entries after the cache fills", async () => {
    const chat = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue('{"meaning":"A family member."}');
    const define = createWordMeaning(chat);
    const version = mockChapterVersion(1);
    expect((await define(version, 5, mockChapter)).source).toBe("unavailable");
    expect((await define(version, 5, mockChapter)).source).toBe("oci-generative-ai");
    for (let index = 0; index < 256; index++) await define({ ...version, id: `version-${index}` }, 5, mockChapter);
    chat.mockResolvedValue('{"meaning":"A freshly requested meaning."}');
    expect((await define(version, 5, mockChapter)).meaning).toBe("A freshly requested meaning.");
  });

  test("ends a stalled lookup and refuses a token outside the supplied Version", async () => {
    const define = createWordMeaning(() => new Promise(() => {}), 5);
    expect(await define(mockChapterVersion(1), 5, mockChapter)).toEqual({ meaning: NO_MEANING, source: "unavailable" });
    await expect(define(mockChapterVersion(1), -1, mockChapter)).rejects.toThrow("No such word");
  });
});

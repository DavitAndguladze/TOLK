import { describe, expect, it } from "vitest";
import { mockChapter } from "../mocks";
import { NO_MEANING, meaningOf } from "./meaning";

describe("meaning of a flagged word", () => {
  it("uses the Chapter's Complex Word meaning when the word is one", () => {
    expect(meaningOf("vulnerable", mockChapter)).toBe("easily hurt or affected");
  });

  it("falls back to a plain message for any other word", () => {
    expect(meaningOf("father", mockChapter)).toBe(NO_MEANING);
  });
});

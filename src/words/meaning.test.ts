import { describe, expect, test } from "vitest";
import { mockChapter } from "../mocks";
import { NO_MEANING, meaningOf } from "./meaning";

describe("meaning of a flagged word", () => {
  test("uses the Chapter's Complex Word meaning when the word is one", () => {
    expect(meaningOf("vulnerable", mockChapter)).toBe("easily hurt or affected");
  });

  test("falls back to a plain message for any other word", () => {
    expect(meaningOf("father", mockChapter)).toBe(NO_MEANING);
  });
});

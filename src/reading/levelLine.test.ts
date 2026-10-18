import { describe, expect, test } from "vitest";
import type { ProgressView } from "../types";
import { mockProgress } from "../mocks";
import { celebratesOriginal } from "./levelLine";

type LevelLine = ProgressView["levelLine"];

describe("celebratesOriginal", () => {
  test("celebrates the Chapter where the Reader first reaches L5", () => {
    const line: LevelLine = [
      { chapterNumber: 1, level: 3, result: "fully-understood" },
      { chapterNumber: 2, level: 4, result: "fully-understood" },
      { chapterNumber: 3, level: 5, result: null },
    ];

    expect(celebratesOriginal(line)).toBe(true);
  });

  test("does not celebrate again on later Chapters at L5", () => {
    const line: LevelLine = [
      { chapterNumber: 1, level: 4, result: "fully-understood" },
      { chapterNumber: 2, level: 5, result: "fully-understood" },
      { chapterNumber: 3, level: 5, result: null },
    ];

    expect(celebratesOriginal(line)).toBe(false);
  });

  test("does not celebrate before the Reader reaches L5", () => {
    expect(celebratesOriginal(mockProgress.levelLine)).toBe(false);
    expect(celebratesOriginal([])).toBe(false);
  });
});

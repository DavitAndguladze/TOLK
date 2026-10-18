import { expect, test } from "vitest";
import { mockChapterVersion } from "../mocks";
import type { ChapterVersion } from "../types";
import { levelChoices } from "./level-choices";

const shared = (level: 1 | 2 | 3 | 4 | 5): ChapterVersion => ({ ...mockChapterVersion(level), readerId: null });

test("offers one ready Version per Level, L1 to L5, with the assigned one holding its Level", () => {
  const assigned = shared(1);
  const choices = levelChoices([shared(5), shared(3), { ...shared(1), id: "other-L1" }, shared(2), shared(4)], assigned);
  expect(choices.map((v) => v.level)).toEqual([1, 2, 3, 4, 5]);
  expect(choices[0].id).toBe(assigned.id);
});

test("prefers the Reader's own Version over a shared one, and skips unready or other-Chapter Versions", () => {
  const own = { ...mockChapterVersion(2), readerId: "reader-a", id: "own-L2" };
  const choices = levelChoices([shared(2), own, { ...shared(3), status: "generating" }, { ...shared(4), chapterNumber: 2 }], shared(1));
  expect(choices.map((v) => [v.level, v.id])).toEqual([[1, "gatsby-ch1-L1"], [2, "own-L2"]]);
});

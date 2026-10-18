import { expect, test } from "vitest";
import type { Grading } from "../types";
import { mockGrading } from "../mocks";
import { resultHeadline } from "./result";

test.each([
  ["fully-understood", false, "You understood it."],
  ["fully-understood", true, "You understood it."],
  ["partly-understood", false, "You understood most of it."],
  ["struggled", false, "This Chapter was a tough one."],
] as const)("a %s result (barely passed: %s) reads “%s”, leaving the nuance to the Level explanation", (result, barelyPassed, headline) => {
  const grading: Grading = { ...mockGrading, result, barelyPassed };

  expect(resultHeadline(grading)).toBe(headline);
});

import { expect, test } from "vitest";
import type { Grading } from "../types";
import { mockGrading } from "../mocks";
import { nextChapterPoll, resultHeadline } from "./result";

test.each([
  ["fully-understood", false, "You understood it."],
  ["fully-understood", true, "You understood it."],
  ["partly-understood", false, "You understood most of it."],
  ["struggled", false, "This Chapter was a tough one."],
] as const)("a %s result (barely passed: %s) reads “%s”, leaving the nuance to the Level explanation", (result, barelyPassed, headline) => {
  const grading: Grading = { ...mockGrading, result, barelyPassed };

  expect(resultHeadline(grading)).toBe(headline);
});

test.each([
  [200, "ready", "ready"],
  [200, "generating", "wait"],
  [200, "failed", "stop"],
  [404, null, "stop"],
  [503, null, "wait"],
  [0, null, "wait"],
] as const)("polling the next Chapter Version: HTTP %s, status %s → %s", (httpStatus, status, step) => {
  expect(nextChapterPoll(httpStatus, status === null ? null : { status })).toBe(step);
});

import { expect, test } from "vitest";
import type { Grading } from "../types";
import { mockGrading } from "../mocks";
import { nextChapterPoll, nextChapterPollResponse, resultHeadline } from "./result";

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

test.each(["{", "{}", JSON.stringify({ status: "unexpected" })])(
  "stops polling when a successful response has no usable Chapter Version: %s",
  async (body) => {
    const response = new Response(body, { status: 200 });

    await expect(nextChapterPollResponse(response)).resolves.toBe("stop");
  },
);

test("keeps retrying a pending 503 response", async () => {
  await expect(nextChapterPollResponse(new Response("", { status: 503 }))).resolves.toBe("wait");
});

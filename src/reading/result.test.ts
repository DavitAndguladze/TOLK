import { expect, test } from "vitest";
import type { Grading } from "../types";
import { mockGrading } from "../mocks";
import { chapterCheckReview, nextChapterPoll, nextChapterPollResponse, resultHeadline } from "./result";
import { mockSession } from "../mocks";

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
  [401, null, "stop"],
  [403, null, "stop"],
  [429, null, "wait"],
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

test("reviews real answers by question id and counts only fully correct answers", () => {
  const session = { ...mockSession, grading: { ...mockGrading, questionGrades: [
    { questionId: "q2", grade: 1 as const, feedback: "Some of it.", rereadSentenceIndex: 2, rereadSentence: "He looked across the water." },
    { questionId: "q1", grade: 2 as const, feedback: "Got it.", rereadSentenceIndex: null, rereadSentence: null },
    { questionId: "q3", grade: 0 as const, feedback: "Look again.", rereadSentenceIndex: 3, rereadSentence: "The light was green." },
  ] } };
  const review = chapterCheckReview(session, {
    id: "check", chapterVersionId: session.chapterVersionId,
    questions: [
      { id: "q1", kind: "key-point", prompt: "Where?", answerSentenceIndex: 1 },
      { id: "q2", kind: "key-point", prompt: "What happened?", answerSentenceIndex: 2 },
      { id: "q3", kind: "complex-word", prompt: "What color?", answerSentenceIndex: 3 },
    ],
  }, { answers: [
    { questionId: "q3", answer: "Red", via: "typed" },
    { questionId: "q1", answer: "Across the water", via: "spoken" },
    { questionId: "q2", answer: "He looked", via: "typed" },
  ] });
  expect(review.fullyCorrect).toBe(1);
  expect(review.partlyCorrect).toBe(1);
  expect(review.total).toBe(3);
  expect(review.scorePercent).toBe(83); // Saved basis is 5/6 points, including partial credit.
  expect(review.questions[0]).toMatchObject({ questionId: "q2", prompt: "What happened?", answer: "He looked", grade: 1, feedback: "Some of it." });
  expect(review.questions[1]).toMatchObject({ questionId: "q1", prompt: "Where?", answer: "Across the water", grade: 2, rereadSentenceIndex: 1 });
});

test("does not attach another Chapter Version's questions or answers to a saved result", () => {
  const id = mockGrading.questionGrades[0].questionId;
  const review = chapterCheckReview(mockSession, {
    id: "another-check", chapterVersionId: "another-version",
    questions: [{ id, kind: "key-point", prompt: "Another Chapter's question", answerSentenceIndex: 0 }],
  }, { answers: [{ questionId: id, answer: "Another Chapter's answer", via: "typed" }] });
  expect(review.questions[0].prompt).toBeNull();
  expect(review.questions[0].answer).toBeNull();
  expect(review.questions[0].feedback).toBe(mockGrading.questionGrades[0].feedback);
});

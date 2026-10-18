import { describe, expect, test, vi } from "vitest";
import { mockChapter, mockChapterCheck, mockChapterVersion } from "../mocks";
import { createInMemoryAnswersStore } from "./answers-store";
import { getChapterCheckForVersion, submitCheckAnswers } from "./service";

describe("getChapterCheckForVersion", () => {
  test("generates a Chapter Version's check only once, caching it for every later call", async () => {
    const version = mockChapterVersion(1);
    const generate = vi.fn().mockResolvedValue(mockChapterCheck);
    const cache = new Map();

    const first = await getChapterCheckForVersion(mockChapter, version, { generate, cache });
    const second = await getChapterCheckForVersion(mockChapter, version, { generate, cache });

    expect(first).toBe(mockChapterCheck);
    expect(second).toBe(mockChapterCheck);
    expect(generate).toHaveBeenCalledTimes(1);
  });
});

describe("submitCheckAnswers", () => {
  test("stores a valid submission and confirms it", async () => {
    const store = createInMemoryAnswersStore();
    const submission = {
      answers: mockChapterCheck.questions.map((q) => ({ questionId: q.id, answer: "an answer", via: "typed" as const })),
    };

    const result = await submitCheckAnswers(mockChapterCheck, submission, store);

    expect(result).toEqual({ stored: true });
    expect(await store.get(mockChapterCheck.id)).toEqual(submission);
  });

  test("surfaces the validation error from an invalid submission instead of storing it", async () => {
    const store = createInMemoryAnswersStore();
    const submission = { answers: [{ questionId: "not-real", answer: "x", via: "typed" as const }] };

    await expect(submitCheckAnswers(mockChapterCheck, submission, store)).rejects.toThrow();
    expect(await store.get(mockChapterCheck.id)).toBeNull();
  });
});

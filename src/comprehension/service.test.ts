import { describe, expect, test, vi } from "vitest";
import { mockChapter, mockChapterCheck, mockChapterVersion } from "../mocks";
import { createInMemoryAnswersStore } from "./answers-store";
import { fallbackChecks } from "./chapter-check-generator";
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

  test("two concurrent first requests for the same version share one generation (no race)", async () => {
    // Regression for: Chapter 1's L1 version is shared across every Reader (ADR-0008), so two
    // Readers can request it before it's cached.
    const version = mockChapterVersion(1);
    const generate = vi.fn().mockResolvedValue(mockChapterCheck);
    const cache = new Map();

    const [first, second] = await Promise.all([
      getChapterCheckForVersion(mockChapter, version, { generate, cache }),
      getChapterCheckForVersion(mockChapter, version, { generate, cache }),
    ]);

    expect(first).toBe(mockChapterCheck);
    expect(second).toBe(mockChapterCheck);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  test("a fallback Check is returned but not cached, so the next call tries the AI again", async () => {
    const version = mockChapterVersion(1);
    const fallback = { ...mockChapterCheck, id: "fallback" };
    fallbackChecks.add(fallback);
    const generate = vi.fn().mockResolvedValueOnce(fallback).mockResolvedValueOnce(mockChapterCheck);
    const cache = new Map();

    const first = await getChapterCheckForVersion(mockChapter, version, { generate, cache });
    const second = await getChapterCheckForVersion(mockChapter, version, { generate, cache });
    const third = await getChapterCheckForVersion(mockChapter, version, { generate, cache });

    expect(first).toBe(fallback);
    expect(second).toBe(mockChapterCheck);
    expect(third).toBe(mockChapterCheck);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  test("a failed generation isn't cached, so the next call retries", async () => {
    const version = mockChapterVersion(1);
    const generate = vi.fn().mockRejectedValueOnce(new Error("AI gateway down")).mockResolvedValueOnce(mockChapterCheck);
    const cache = new Map();

    await expect(getChapterCheckForVersion(mockChapter, version, { generate, cache })).rejects.toThrow("AI gateway down");
    const retried = await getChapterCheckForVersion(mockChapter, version, { generate, cache });

    expect(retried).toBe(mockChapterCheck);
    expect(generate).toHaveBeenCalledTimes(2);
  });
});

const fullSubmission = () => ({
  answers: mockChapterCheck.questions.map((q) => ({ questionId: q.id, answer: q.choices?.[0] ?? "an answer", via: "typed" as const })),
});

describe("submitCheckAnswers", () => {
  test("stores a valid submission and confirms it", async () => {
    const store = createInMemoryAnswersStore();
    const submission = fullSubmission();

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

  test("stores under a caller-supplied key instead of the bare check id", async () => {
    // Chapter 1's L1 version (and its check) is shared across every Reader (ADR-0008) - without a
    // per-Reader key, Reader B's submission would overwrite Reader A's.
    const store = createInMemoryAnswersStore();
    const submission = fullSubmission();

    await submitCheckAnswers(mockChapterCheck, submission, store, `${mockChapterCheck.id}:reader-a`);

    expect(await store.get(mockChapterCheck.id)).toBeNull();
    expect(await store.get(`${mockChapterCheck.id}:reader-a`)).toEqual(submission);
  });
});

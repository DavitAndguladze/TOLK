import { describe, expect, it } from "vitest";
import { generateChapterCheck } from "../comprehension/chapter-check-generator.ts";
import { mockChapterVersion } from "../mocks/fixtures.ts";
import type { Chapter, NextChapterInput } from "../types";
import { createChapterGenerator, type FidelityInput, type FidelityReview } from "./generator.ts";

const chapter: Chapter = {
  id: "gatsby-ch2", bookId: "gatsby", number: 2, title: "Chapter 2",
  originalText: "Nick saw a green light. He went home. He felt hope.",
  keyPoints: [
    { id: "kp1", chapterId: "gatsby-ch2", text: "Nick saw a green light." },
    { id: "kp2", chapterId: "gatsby-ch2", text: "He went home." },
    { id: "kp3", chapterId: "gatsby-ch2", text: "He felt hope." },
  ],
  complexWords: [{ word: "hope", meaning: "a feeling that good things can happen" }],
};
const draft = {
  level: 1, levelScore: 20,
  sentences: [{ text: "Nick saw a green light.", originalSentenceIndex: 0 }, { text: "He went home.", originalSentenceIndex: 1 }, { text: "He felt hope.", originalSentenceIndex: 2 }],
  reinforcedWords: [],
};
const input = (): NextChapterInput => ({
  original: structuredClone(chapter), baseline: mockChapterVersion(1), readerId: "reader-1",
  decision: { from: 1, to: 1, reason: "barely-passed", explanation: "Keep this Level.", reinforcement: "context-clue" },
  wordBank: [], graduatedWords: [],
});
function review({ version, check, digest, chapter }: FidelityInput): FidelityReview {
  return {
    versionId: version.id, digest, plotPreserved: true, tonePreserved: true, checkAnswerable: true, reinforcementAppropriate: true,
    keyPointEvidence: chapter.keyPoints.map((point, sentenceIndex) => ({ keyPointId: point.id, sentenceIndex, quote: version.sentences[sentenceIndex].text })),
    checkEvidence: check.questions.map((question) => ({ questionId: question.id, sentenceIndex: question.answerSentenceIndex, quote: version.sentences[question.answerSentenceIndex].text })),
  };
}
const dependencies = () => ({
  generateText: async () => JSON.stringify(draft), generateCheck: generateChapterCheck,
  evaluateFidelity: async (value: FidelityInput) => review(value),
  policyForChapter: () => ({ requiredNames: ["Nick"], retainedWords: ["hope"], vocabulary: {
    source: "test frequency ranks", ranks: { saw: 1, a: 2, green: 3, light: 4, he: 5, went: 6, home: 7, felt: 8 },
  } }),
});

describe("ChapterGenerator", () => {
  it("returns a frozen, validated version with its matching Check and supplied Level decision", async () => {
    const result = await createChapterGenerator(dependencies()).generate(input());
    expect(result.version).toMatchObject({ status: "ready", level: 1, readerId: "reader-1", baselineVersionId: "gatsby-ch1-L1", text: chapter.originalText });
    expect(result.check.chapterVersionId).toBe(result.version.id);
    expect(result.provenance).toEqual({ source: "live", personalized: true, attempts: 1 });
    expect(Object.isFrozen(result.version.tokens[0])).toBe(true);
    expect(Object.isFrozen(result.check.questions)).toBe(true);
  });

  it("retries one invalid draft and records the successful attempt", async () => {
    let first = true;
    const result = await createChapterGenerator({ ...dependencies(), generateText: async () => {
      if (first) { first = false; return "{}"; }
      return JSON.stringify(draft);
    } }).generate(input());
    expect(result.version.status).toBe("ready");
    expect(result.provenance.attempts).toBe(2);
  });

  it("creates shared L1 Chapter 1 without inventing a preceding version", async () => {
    const first = { ...chapter, number: 1, id: "gatsby-ch1", keyPoints: chapter.keyPoints.map((point) => ({ ...point, chapterId: "gatsby-ch1" })) };
    const result = await createChapterGenerator(dependencies()).generateSharedChapterOne(first);
    const repeated = await createChapterGenerator(dependencies()).generateSharedChapterOne(first);
    expect(result.version).toMatchObject({ chapterNumber: 1, readerId: null, baselineVersionId: null, level: 1 });
    expect(result.provenance.personalized).toBe(false);
    expect(result.version.id).toBe(repeated.version.id);
  });

  it("serves exact L5 original without rewriting it", async () => {
    const next = input();
    next.baseline = mockChapterVersion(4);
    next.baseline.readerId = next.readerId;
    next.decision.from = 4;
    next.decision.to = 5;
    const result = await createChapterGenerator({ ...dependencies(), generateText: async () => { throw new Error("Rewrite should not run"); } }).generate(next);
    expect(result.version.text).toBe(chapter.originalText);
    expect(result.version.levelScore).toBe(100);
    expect(result.provenance.source).toBe("original");
  });

  it("assembles every source sentence using bounded passages and at most three concurrent calls", async () => {
    const next = input();
    next.original.originalText += " He went home.".repeat(400);
    let active = 0;
    let peak = 0;
    const result = await createChapterGenerator({ ...dependencies(), generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      const sentences = data.sentences as { text: string; originalSentenceIndex: number }[];
      if (sentences.flatMap((row) => row.text.split(/\s+/)).length > 400) throw new Error("Provider output budget exceeded");
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return JSON.stringify({ level: 1, levelScore: 20, sentences, reinforcedWords: [] });
    } }).generate(next);
    expect(result.version.sentences).toHaveLength(403);
    expect(result.version.text).toBe(next.original.originalText);
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(1);
  });

  it("maps passage reinforcement to the final Chapter sentence index", async () => {
    const next = input();
    next.original.originalText += " He went home.".repeat(400) + " He felt hope.";
    next.wordBank = [{ word: "hope", source: "wrong", timesSeen: 1, graduated: false, addedInChapter: 1, graduatedInChapter: null }];
    const result = await createChapterGenerator({ ...dependencies(), generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      const sentences = data.sentences as { text: string; originalSentenceIndex: number }[];
      const sentenceIndex = sentences.findIndex((row) => row.originalSentenceIndex === 403);
      return JSON.stringify({ level: 1, levelScore: 100, sentences,
        reinforcedWords: sentenceIndex < 0 ? [] : [{ word: "hope", reinforcement: "context-clue", sentenceIndex }],
      });
    } }).generate(next);
    expect(result.version.reinforcedWords).toEqual([{ word: "hope", reinforcement: "context-clue", sentenceIndex: 403 }]);
    expect(result.version.levelScore).toBe(100);
  });

  it("uses a matching pre-generated artifact after timeout without inventing personalization", async () => {
    const fallback = await createChapterGenerator(dependencies()).generatePreGenerated(chapter, 1);
    const next = input();
    next.wordBank = [{ word: "hope", source: "flagged", timesSeen: 1, graduated: false, addedInChapter: 1, graduatedInChapter: null }];
    const before = structuredClone(next);
    const result = await createChapterGenerator({ ...dependencies(), budgetMs: 100,
      generateText: () => new Promise(() => {}), fallback: async () => fallback,
    }).generate(next);
    expect(result.version.id).toBe(fallback.version.id);
    expect(result.version.reinforcedWords).toEqual([]);
    expect(result.check).toEqual(fallback.check);
    expect(result.provenance).toEqual({ source: "pre-generated", personalized: false, attempts: 1, fallbackReason: "timeout" });
    expect(next).toEqual(before);
  });

  it("stops after one retry and uses the fallback's own Check", async () => {
    const fallback = await createChapterGenerator(dependencies()).generatePreGenerated(chapter, 1);
    const result = await createChapterGenerator({ ...dependencies(), generateText: async () => "{}", fallback: async () => fallback }).generate(input());
    expect(result.provenance).toMatchObject({ source: "pre-generated", attempts: 2, fallbackReason: "generation-failed" });
    expect(result.check.chapterVersionId).toBe(fallback.version.id);
  });

  it("reports a safe retry state when no valid fallback exists", async () => {
    const fallback = await createChapterGenerator(dependencies()).generatePreGenerated(chapter, 1);
    const wrong = structuredClone(fallback);
    wrong.version.level = 2;
    await expect(createChapterGenerator({ ...dependencies(), generateText: async () => "{}", fallback: async () => wrong }).generate(input()))
      .rejects.toMatchObject({ code: "CHAPTER_GENERATION_UNAVAILABLE" });
  });

  it("bounds a stalled fallback lookup within the same total budget", async () => {
    const start = Date.now();
    await expect(createChapterGenerator({ ...dependencies(), budgetMs: 60, generateText: async () => "{}",
      fallback: () => new Promise(() => {}),
    }).generate(input())).rejects.toMatchObject({ code: "CHAPTER_GENERATION_UNAVAILABLE" });
    expect(Date.now() - start).toBeLessThan(500);
  });

  it("honors caller cancellation even when the Check provider ignores it", async () => {
    const controller = new AbortController();
    const pending = createChapterGenerator({ ...dependencies(), generateCheck: () => new Promise(() => {}) }).generate(input(), { signal: controller.signal });
    setTimeout(() => controller.abort(new Error("cancelled")), 5);
    await expect(pending).rejects.toThrow("cancelled");
  });

  it.each(["plotPreserved", "tonePreserved", "checkAnswerable", "reinforcementAppropriate"] as const)("gates readiness on separate %s evidence", async (field) => {
    await expect(createChapterGenerator({ ...dependencies(), evaluateFidelity: async (value) => ({ ...review(value), [field]: false }) }).generate(input()))
      .rejects.toMatchObject({ code: "CHAPTER_GENERATION_UNAVAILABLE" });
  });

  it("rejects fidelity evidence copied from a different version", async () => {
    await expect(createChapterGenerator({ ...dependencies(), evaluateFidelity: async (value) => ({ ...review(value), digest: "wrong-version" }) }).generate(input()))
      .rejects.toMatchObject({ code: "CHAPTER_GENERATION_UNAVAILABLE" });
  });

  it("rejects partial Chapters even when the model says they are valid", async () => {
    await expect(createChapterGenerator({ ...dependencies(), generateText: async () => JSON.stringify({ ...draft, valid: true, sentences: draft.sentences.slice(0, 2) }) }).generate(input()))
      .rejects.toMatchObject({ code: "CHAPTER_GENERATION_UNAVAILABLE" });
  });

  it("uses the default independent evaluator and validates the resulting citations", async () => {
    const settings = dependencies();
    const result = await createChapterGenerator({ ...settings, evaluateFidelity: undefined, generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      return JSON.stringify(data.digest ? review(data) : draft);
    } }).generate(input());
    expect(result.fidelity.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(result.version.status).toBe("ready");
  });

  it("bounds a stalled fidelity evaluation within the generation budget", async () => {
    await expect(createChapterGenerator({ ...dependencies(), budgetMs: 60, evaluateFidelity: () => new Promise(() => {}) }).generate(input()))
      .rejects.toMatchObject({ code: "CHAPTER_GENERATION_UNAVAILABLE" });
  });

  it("rejects a supplied two-Level jump instead of recalculating it", async () => {
    const next = input();
    next.decision.to = 3;
    await expect(createChapterGenerator(dependencies()).generate(next)).rejects.toThrow("supplied Level decision");
  });

  it("rejects a baseline belonging to another Reader even if a valid fallback exists", async () => {
    const fallback = await createChapterGenerator(dependencies()).generatePreGenerated(chapter, 1);
    const next = input();
    next.baseline.readerId = "another-reader";
    await expect(createChapterGenerator({ ...dependencies(), fallback: async () => fallback }).generate(next))
      .rejects.toThrow("baseline");
  });
});

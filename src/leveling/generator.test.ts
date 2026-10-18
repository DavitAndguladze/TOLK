import { describe, expect, it, vi } from "vitest";
import { generateChapterCheck } from "../comprehension/chapter-check-generator.ts";
import { mockChapterVersion } from "../mocks/fixtures.ts";
import vocabulary from "../data/vocabulary/english-2018.json" with { type: "json" };
import type { Chapter, NextChapterInput } from "../types";
import { createChapterGenerator, verifyChapterArtifact, type FidelityInput, type FidelityReview } from "./generator.ts";

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
  it("verifies stored artifacts after JSON object keys are reordered but rejects changed values", async () => {
    const settings = dependencies();
    const artifact = await createChapterGenerator(settings).generatePreGenerated(chapter, 1);
    const stored = JSON.parse(JSON.stringify({ chapter, artifact }), (_key, value) =>
      value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).reverse()) : value);
    const context = { original: stored.chapter, level: 1 as const, readerId: null, wordBank: [], graduatedWords: [], reinforcement: "plain" as const };
    expect(() => verifyChapterArtifact(stored.artifact, context, settings.policyForChapter())).not.toThrow();
    stored.artifact.version.sentences[0].text = "Nick saw a red light.";
    expect(() => verifyChapterArtifact(stored.artifact, context, settings.policyForChapter())).toThrow("Separate fidelity review");
  });

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

  it("retains the exact rejected passage, source and policy for offline diagnosis", async () => {
    const rejected = { ...draft, sentences: draft.sentences.map((sentence, index) => index === 0
      ? { ...sentence, text: "Nick saw a green light and went to his house with his dog." } : sentence) };
    let error: (Error & { code?: string; cause?: Error & { diagnostics?: unknown } }) | undefined;
    try {
      await createChapterGenerator({ ...dependencies(), maxAttempts: 1,
        generateText: async () => JSON.stringify(rejected) }).generatePreGenerated(chapter, 1);
    } catch (cause) {
      error = cause as Error & { code?: string; cause?: Error & { diagnostics?: unknown } };
    }
    expect(error?.code).toBe("CHAPTER_GENERATION_UNAVAILABLE");
    expect(error?.cause?.diagnostics).toMatchObject({
        chapterId: chapter.id,
        policy: { requiredNames: ["Nick"], retainedWords: ["hope"] },
        failedPassages: [expect.objectContaining({
          passageIndex: 0,
          sourceSentences: expect.arrayContaining([expect.objectContaining({ text: "Nick saw a green light." })]),
          rejectedDraft: JSON.stringify(rejected),
          validationMessages: expect.stringContaining("sentence-length"),
        })],
    });
  });

  it("clears model-invented reinforcement when the Chapter has no active Word Bank", async () => {
    const result = await createChapterGenerator({ ...dependencies(), generateText: async () => JSON.stringify({
      ...draft, reinforcedWords: [{ word: "hope", reinforcement: "plain", sentenceIndex: 2 }],
    }) }).generatePreGenerated(chapter, 1);
    expect(result.version.reinforcedWords).toEqual([]);
  });

  it("corrects a missing source sentence using validation feedback in its single retry", async () => {
    const result = await createChapterGenerator({ ...dependencies(), generateText: async (prompt) => {
      const corrected = prompt.includes("Sentence mappings must cover the full original Chapter");
      return JSON.stringify({ ...draft, sentences: corrected ? draft.sentences : draft.sentences.slice(0, 2) });
    } }).generate(input());
    expect(result.version.text).toBe(chapter.originalText);
    expect(result.provenance.attempts).toBe(2);
  });

  it("keeps valid passages while correcting vocabulary and sentence length before generating the Check", async () => {
    const next = input();
    next.original.originalText += " He went home.".repeat(120);
    const completed = new Set<number>();
    const result = await createChapterGenerator({ ...dependencies(), generateText: async (prompt) => {
      const { sentences } = JSON.parse(prompt.split("DATA:\n")[1]);
      const first = sentences[0].originalSentenceIndex;
      if (completed.has(first)) throw new Error("A successful passage is not available for regeneration");
      const corrected = first > 0 || (prompt.includes("sentence-length:") && prompt.includes("vocabulary:"));
      if (corrected) completed.add(first);
      return JSON.stringify({ ...draft, sentences: corrected ? sentences : [
        { ...sentences[0], text: "Nick saw a green light and went home with boundless hope." }, ...sentences.slice(1),
      ] });
    }, generateCheck: (original, version) => {
      expect(version.text).not.toContain("boundless");
      return generateChapterCheck(original, version);
    } }).generate(next);
    expect(result.version.text).toBe(next.original.originalText);
    expect(result.provenance.attempts).toBe(2);
  });

  it("allows an active Word Bank word beyond L1's frequency target when correctly reinforced", async () => {
    const next = input();
    next.original.originalText = "Nick felt vulnerable and could be hurt. He went home. He felt hope.";
    next.original.keyPoints[0].text = "Nick felt vulnerable and could be hurt.";
    next.wordBank = [{ word: "vulnerable", source: "wrong", timesSeen: 1, graduated: false, addedInChapter: 1, graduatedInChapter: null }];
    const supported = { ...draft,
      sentences: [{ text: "Nick felt vulnerable and could be hurt.", originalSentenceIndex: 0 }, ...draft.sentences.slice(1)],
      reinforcedWords: [{ word: "vulnerable", reinforcement: "context-clue", sentenceIndex: 0 }],
    };
    const settings = dependencies();
    const result = await createChapterGenerator({ ...settings,
      policyForChapter: () => ({ ...settings.policyForChapter(), vocabulary }),
      generateText: async () => JSON.stringify(supported),
    }).generate(next);
    expect(vocabulary.ranks.vulnerable).toBe(4491);
    expect(result.version.level).toBe(1);
    expect(result.version.reinforcedWords).toEqual(supported.reinforcedWords);
    expect(result.fidelity.reinforcementAppropriate).toBe(true);
  });

  it("creates shared L1 Chapter 1 without inventing a preceding version", async () => {
    const first = { ...chapter, number: 1, id: "gatsby-ch1", keyPoints: chapter.keyPoints.map((point) => ({ ...point, chapterId: "gatsby-ch1" })) };
    const result = await createChapterGenerator(dependencies()).generateSharedChapterOne(first);
    const repeated = await createChapterGenerator(dependencies()).generateSharedChapterOne(first);
    expect(result.version).toMatchObject({ chapterNumber: 1, readerId: null, baselineVersionId: null, level: 1 });
    expect(result.provenance.personalized).toBe(false);
    expect(result.version.id).toBe(repeated.version.id);
    expect(result.check).toEqual(repeated.check);
    expect(result.fidelity.versionId).toBe(result.version.id);
    expect(result.fidelity.checkEvidence.map((evidence) => evidence.questionId)).toEqual(result.check.questions.map((question) => question.id));
  });

  it.each(["prompt", "choices"] as const)("gives a different immutable shared identity when Check %s change", async (field) => {
    const first = await createChapterGenerator(dependencies()).generatePreGenerated(chapter, 1);
    const originalArtifact = structuredClone(first);
    const second = await createChapterGenerator({ ...dependencies(), generateCheck: async (original, version) => {
      const check = await generateChapterCheck(original, version);
      if (field === "prompt") check.questions[0].prompt = "What color was the light Nick saw?";
      else check.questions.at(-1)!.choices!.reverse();
      return check;
    } }).generatePreGenerated(chapter, 1);
    expect(second.version.text).toBe(first.version.text);
    expect(second.version.id).not.toBe(first.version.id);
    expect(second.check.id).not.toBe(first.check.id);
    expect(second.check.chapterVersionId).toBe(second.version.id);
    expect(second.check.questions.every((question) => !first.check.questions.some((old) => old.id === question.id))).toBe(true);
    expect(second.fidelity.versionId).toBe(second.version.id);
    expect(second.fidelity.checkEvidence.map((evidence) => evidence.questionId)).toEqual(second.check.questions.map((question) => question.id));
    expect(first).toEqual(originalArtifact);
  });

  it("keeps live version identities distinct for identical text and Check content", async () => {
    const generator = createChapterGenerator(dependencies());
    const first = await generator.generate(input());
    const second = await generator.generate(input());
    expect(first.version.id).not.toBe(second.version.id);
    expect(first.check.id).not.toBe(second.check.id);
  });

  it.each(["version", "check", "question"] as const)("does not repair invalid %s identities while assigning shared IDs", async (field) => {
    await expect(createChapterGenerator({ ...dependencies(), generateCheck: async (original, version) => {
      const check = await generateChapterCheck(original, version);
      if (field === "version") check.chapterVersionId = "unrelated-version";
      else if (field === "check") check.id = "";
      else check.questions[1].id = check.questions[0].id;
      return check;
    } }).generatePreGenerated(chapter, 1)).rejects.toMatchObject({ code: "CHAPTER_GENERATION_UNAVAILABLE" });
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

  it("carries documented exceptions into later passages and verifies their global source citations", async () => {
    const next = input();
    next.original.originalText += " He went home.".repeat(400) + " He felt vulnerable.";
    const settings = dependencies();
    const evidence = { word: "vulnerable", originalSentenceIndex: 403, quote: "He felt vulnerable.",
      reason: "Preserves his exposure to harm, which feeling bad would lose." };
    let suppliedEvidence = false;
    const generator = createChapterGenerator({ ...settings,
      policyForChapter: () => ({ ...settings.policyForChapter(), retainedWords: ["hope", "vulnerable"], retainedWordEvidence: [evidence] }),
      generateText: async (prompt) => {
        const data = JSON.parse(prompt.split("DATA:\n")[1]);
        if (data.sentences.some((row: { originalSentenceIndex: number }) => row.originalSentenceIndex === 403)) {
          suppliedEvidence = data.retainedWordEvidence?.some((row: { word: string; reason: string }) => row.word === "vulnerable" && row.reason === evidence.reason);
        }
        return JSON.stringify({ level: 1, levelScore: 20, sentences: data.sentences, reinforcedWords: [] });
      },
    });
    const result = await generator.generate(next);
    expect(result.version.text).toBe(next.original.originalText);
    expect(suppliedEvidence).toBe(true);
    expect(() => verifyChapterArtifact(result, { ...next, level: 1, reinforcement: "context-clue" },
      { ...settings.policyForChapter(), retainedWords: ["hope", "vulnerable"], retainedWordEvidence: [evidence] })).not.toThrow();
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
    vi.useFakeTimers();
    // Native AbortSignal.timeout bypasses fake timers; control this clock boundary too.
    const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation((milliseconds) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(new DOMException("Timed out", "TimeoutError")), milliseconds);
      return controller.signal;
    });
    try {
      const pending = createChapterGenerator({ ...dependencies(), budgetMs: 100,
        generateText: () => new Promise(() => {}), fallback: async () => fallback,
      }).generate(next);
      await vi.advanceTimersByTimeAsync(90);
      const result = await pending;
      expect(result.version.id).toBe(fallback.version.id);
      expect(result.version.reinforcedWords).toEqual([]);
      expect(result.check).toEqual(fallback.check);
      expect(result.provenance).toEqual({ source: "pre-generated", personalized: false, attempts: 1, fallbackReason: "timeout" });
      expect(next).toEqual(before);
    } finally {
      timeout.mockRestore();
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it("stops after one retry and uses the fallback's own Check", async () => {
    const fallback = await createChapterGenerator(dependencies()).generatePreGenerated(chapter, 1);
    const result = await createChapterGenerator({ ...dependencies(), generateText: async () => "{}", fallback: async () => fallback }).generate(input());
    expect(result.provenance).toMatchObject({ source: "pre-generated", attempts: 2, fallbackReason: "generation-failed" });
  });

  it("allows five offline attempts for a shared artifact", async () => {
    let failures = 4;
    const result = await createChapterGenerator({ ...dependencies(), maxAttempts: 5,
      generateText: async () => {
        if (failures-- > 0) throw new Error("Transient test provider failure");
        return JSON.stringify(draft);
      } }).generatePreGenerated(chapter, 1);
    expect(result.provenance).toMatchObject({ source: "pre-generated", personalized: false, attempts: 5 });
    expect(result.check.chapterVersionId).toBe(result.version.id);
  });

  it("keeps live Reader generation to two attempts even with the offline allowance", async () => {
    const fallback = await createChapterGenerator(dependencies()).generatePreGenerated(chapter, 1);
    const result = await createChapterGenerator({ ...dependencies(), maxAttempts: 5,
      generateText: async () => "{}", fallback: async () => fallback }).generate(input());
    expect(result.provenance).toMatchObject({ source: "pre-generated", attempts: 2, fallbackReason: "generation-failed" });
  });

  it.each([0, -1, 1.5, Infinity, 6])("rejects an invalid offline attempt bound %s", (maxAttempts) => {
    expect(() => createChapterGenerator({ ...dependencies(), maxAttempts })).toThrow("attempt");
  });

  it("allows five offline attempts for a shared artifact", async () => {
    let failures = 4;
    const result = await createChapterGenerator({ ...dependencies(), maxAttempts: 5,
      generateText: async () => {
        if (failures-- > 0) throw new Error("Transient test provider failure");
        return JSON.stringify(draft);
      } }).generatePreGenerated(chapter, 1);
    expect(result.provenance).toMatchObject({ source: "pre-generated", personalized: false, attempts: 5 });
    expect(result.check.chapterVersionId).toBe(result.version.id);
  });

  it("keeps live Reader generation to two attempts with the offline allowance configured", async () => {
    const fallback = await createChapterGenerator(dependencies()).generatePreGenerated(chapter, 1);
    const result = await createChapterGenerator({ ...dependencies(), maxAttempts: 5,
      generateText: async () => "{}", fallback: async () => fallback }).generate(input());
    expect(result.provenance).toMatchObject({ source: "pre-generated", attempts: 2, fallbackReason: "generation-failed" });
  });

  it.each([0, -1, 1.5, Infinity, 6])("rejects an invalid offline attempt bound %s", (maxAttempts) => {
    expect(() => createChapterGenerator({ ...dependencies(), maxAttempts })).toThrow("attempt");
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

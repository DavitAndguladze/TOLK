import { describe, expect, it, vi } from "vitest";
import { generateChapterCheck } from "../comprehension/chapter-check-generator";
import type { Chat } from "../comprehension/oci-key-point-grader";
import vocabulary from "../data/vocabulary/english-2018.json" with { type: "json" };
import type { GenerationDescriptor } from "../db/generation";
import { mockChapterVersion } from "../mocks/fixtures";
import type { NextChapterInput } from "../types";
import { createChapterGenerator, type GeneratedChapter } from "./generator";
import { createGenerationRuntime, type GenerationStore } from "./runtime";

const input = (): NextChapterInput => ({ readerId: "reader-1", baseline: mockChapterVersion(1),
  original: { id: "gatsby-ch2", bookId: "gatsby", number: 2, title: "Chapter 2", originalText: "Nick saw a light. He went home. He felt hope.",
    keyPoints: ["Nick saw a light.", "He went home.", "He felt hope."].map((text, index) => ({ id: `kp${index}`, chapterId: "gatsby-ch2", text })), complexWords: [{ word: "hope", meaning: "a feeling that good things can happen" }] },
  decision: { from: 1, to: 1, reason: "barely-passed", explanation: "Keep this Level.", reinforcement: "context-clue" }, wordBank: [], graduatedWords: [] });
const policy = { requiredNames: ["Nick"], retainedWords: ["hope"], originalEvidence: { keyPoints: [], complexWords: [] } };

function fixture() {
  const next = input();
  let state: GenerationDescriptor = { id: "pending-test", readerId: next.readerId, bookId: "gatsby", chapterNumber: 2, level: 1, baselineVersionId: next.baseline.id, status: "pending", artifact: null };
  let claimed = false, saves = 0, failures = 0;
  let fallback: GeneratedChapter | null = null;
  const store: GenerationStore = {
    resolveGeneration: async (reader, id) => reader === state.readerId && id === state.id ? structuredClone(state) : null,
    claimGeneration: async (reader, id) => {
      if (reader !== state.readerId || id !== state.id || claimed || state.status === "ready") return null;
      claimed = true; state.status = "pending"; return "claim-test";
    },
    saveGeneratedChapter: async (id, artifact, token, originalInput) => {
      expect(id).toBe(state.id); expect(token).toBe("claim-test"); expect(originalInput).toEqual(next);
      saves++; state = { ...state, status: "ready", artifact }; return true;
    },
    failGeneration: async (id, token) => {
      expect(id).toBe(state.id); expect(token).toBe("claim-test"); failures++; state.status = "failed"; claimed = false; return true;
    },
    getChapter: async () => structuredClone(next.original), getChapterVersion: async () => structuredClone(next.baseline),
    getChapterPolicy: async () => structuredClone(policy), getFallbackArtifact: async () => fallback,
  };
  return { next, store, setFallback: (value: GeneratedChapter) => { fallback = value; }, counts: () => ({ saves, failures }) };
}
function chatFor(next: NextChapterInput, calls: string[] = []): Chat {
  return async (prompt, options) => {
    expect(options?.json).toBe(true);
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    calls.push(prompt);
    if (prompt.startsWith("Rewrite")) {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      return JSON.stringify({ level: data.level, levelScore: 20, sentences: data.sentences, reinforcedWords: [] });
    }
    if (prompt.startsWith("You write comprehension")) return JSON.stringify({ questions: next.original.keyPoints.slice(0, 2).map((point, index) => ({ keyPointId: point.id, question: `What happened in part ${index + 1}?`, sentenceIndex: index, quote: point.text })) });
    const { version, check, digest, chapter } = JSON.parse(prompt.split("DATA:\n")[1]);
    return JSON.stringify({ versionId: version.id, digest, plotPreserved: true, tonePreserved: true, checkAnswerable: true, reinforcementAppropriate: true,
      keyPointEvidence: chapter.keyPoints.map((point: { id: string }, sentenceIndex: number) => ({ keyPointId: point.id, sentenceIndex, quote: version.sentences[sentenceIndex].text })),
      checkEvidence: check.questions.map((question: { id: string; answerSentenceIndex: number }) => ({ questionId: question.id, sentenceIndex: question.answerSentenceIndex, quote: version.sentences[question.answerSentenceIndex].text })) });
  };
}
async function fallbackFor(next: NextChapterInput) {
  return createChapterGenerator({ generateText: async () => JSON.stringify({ level: 1, levelScore: 20, sentences: next.original.keyPoints.map((point, originalSentenceIndex) => ({ text: point.text, originalSentenceIndex })), reinforcedWords: [] }),
    generateCheck: generateChapterCheck, policyForChapter: () => ({ ...policy, vocabulary }), evaluateFidelity: async ({ version, check, digest, chapter }) => ({ versionId: version.id, digest,
      plotPreserved: true, tonePreserved: true, checkAnswerable: true, reinforcementAppropriate: true,
      keyPointEvidence: chapter.keyPoints.map((point, sentenceIndex) => ({ keyPointId: point.id, sentenceIndex, quote: version.sentences[sentenceIndex].text })),
      checkEvidence: check.questions.map((question) => ({ questionId: question.id, sentenceIndex: question.answerSentenceIndex, quote: version.sentences[question.answerSentenceIndex].text })) }) }).generatePreGenerated(next.original, 1);
}

describe("web generation runtime", () => {
  it("runs the real generator through JSON Chat and OCI Check, saving its complete artifact", async () => {
    const { next, store, counts } = fixture(), calls: string[] = [];
    const result = await createGenerationRuntime({ store, chat: chatFor(next, calls) }).run("pending-test", next);
    expect(result?.status).toBe("ready");
    expect(result?.artifact?.version).toMatchObject({ readerId: next.readerId, baselineVersionId: next.baseline.id, status: "ready" });
    expect(result?.artifact?.provenance).toEqual({ source: "live", personalized: true, attempts: 1 });
    expect(calls.some((prompt) => prompt.startsWith("You write comprehension"))).toBe(true);
    expect(result?.artifact?.check.questions[0].prompt).toBe("What happened in part 1?");
    expect(counts()).toEqual({ saves: 1, failures: 0 });
  });

  it("uses the validated stored fallback when OCI is unconfigured, preserving its immutable identity", async () => {
    const { next, store, setFallback } = fixture();
    const fallback = await fallbackFor(next); setFallback(fallback);
    const result = await createGenerationRuntime({ store, chat: null }).run("pending-test", next);
    expect(result?.artifact?.version).toEqual(fallback.version);
    expect(result?.artifact?.fidelity).toEqual(fallback.fidelity);
    expect(result?.artifact?.provenance).toMatchObject({ source: "pre-generated", personalized: false, fallbackReason: "generation-failed" });
  });

  it("bounds a stuck provider and still uses the stored fallback within the total budget", async () => {
    const { next, store, setFallback, counts } = fixture();
    const fallback = await fallbackFor(next); setFallback(fallback);
    // Native AbortSignal.timeout bypasses fake timers, so bridge only the clock boundary.
    const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation((milliseconds) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(new DOMException("The operation was aborted due to timeout", "TimeoutError")), milliseconds);
      return controller.signal;
    });
    try {
      vi.useFakeTimers();
      const cancelled = vi.fn();
      const chat: Chat = (_, options) => {
        options?.signal?.addEventListener("abort", cancelled, { once: true });
        return new Promise(() => {});
      };
      const started = Date.now();
      let completedAt = Infinity;
      const running = createGenerationRuntime({ store, chat, budgetMs: 100 }).run("pending-test", next)
        .then((result) => { completedAt = Date.now(); return result; });
      await vi.advanceTimersByTimeAsync(89);
      expect(counts()).toEqual({ saves: 0, failures: 0 });
      expect(cancelled).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(10);
      expect(completedAt - started).toBeLessThan(100);
      const result = await running;
      expect(result?.status).toBe("ready");
      expect(result?.artifact?.version).toEqual(fallback.version);
      expect(result?.artifact?.fidelity).toEqual(fallback.fidelity);
      expect(result?.artifact?.provenance).toEqual({ source: "pre-generated", personalized: false, attempts: 1, fallbackReason: "timeout" });
      expect(cancelled).toHaveBeenCalledOnce();
      expect(counts()).toEqual({ saves: 1, failures: 0 });
    } finally {
      timeout.mockRestore();
      vi.useRealTimers();
    }
  });

  it("records failure when neither generation nor a valid stored fallback is available", async () => {
    const { next, store, setFallback, counts } = fixture();
    const fallback = structuredClone(await fallbackFor(next)); fallback.fidelity.plotPreserved = false; setFallback(fallback);
    const before = structuredClone(next);
    const result = await createGenerationRuntime({ store, chat: null }).run("pending-test", next);
    expect(result).toMatchObject({ status: "failed", artifact: null });
    expect(counts()).toEqual({ saves: 0, failures: 1 });
    expect(next).toEqual(before);
  });

  it("does not run a second attempt for concurrent callbacks or a ready pending ID", async () => {
    const { next, store, counts } = fixture();
    const runtime = createGenerationRuntime({ store, chat: chatFor(next) });
    await Promise.all([runtime.run("pending-test", next), runtime.run("pending-test", next)]);
    await runtime.run("pending-test", next);
    expect(counts()).toEqual({ saves: 1, failures: 0 });
  });

  it("rejects another Reader or a mismatched target without claiming the saved generation", async () => {
    const { next, store, counts } = fixture();
    const runtime = createGenerationRuntime({ store, chat: null });
    await expect(runtime.run("pending-test", { ...next, readerId: "other-reader" })).rejects.toThrow(/generation/i);
    await expect(runtime.run("pending-test", { ...next, decision: { ...next.decision, to: 2 } })).rejects.toThrow(/generation/i);
    expect(counts()).toEqual({ saves: 0, failures: 0 });
  });
});

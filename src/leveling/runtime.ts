import { isDeepStrictEqual } from "node:util";
import { generateChapterCheck } from "../comprehension/chapter-check-generator";
import { createOciChat } from "../comprehension/oci-chat";
import { createOciChapterCheckGenerator } from "../comprehension/oci-chapter-check-generator";
import type { Chat } from "../comprehension/oci-key-point-grader";
import vocabulary from "../data/vocabulary/english-2018.json" with { type: "json" };
import * as database from "../db/generation";
import type { NextChapterInput } from "../types";
import { createChapterGenerator } from "./generator";
import { deadline } from "./prompts";

export type GenerationStore = Pick<typeof database, "resolveGeneration" | "claimGeneration" | "saveGeneratedChapter" | "failGeneration"
  | "getChapter" | "getChapterVersion" | "getChapterPolicy" | "getFallbackArtifact">;

/** Called after the completion transaction commits; generation cannot undo its saved outcome. */
export function createGenerationRuntime(options: { store?: GenerationStore; chat?: Chat | null; budgetMs?: number } = {}) {
  const store = options.store ?? database;
  const budgetMs = Math.min(options.budgetMs ?? 20_000, 20_000);
  return {
    async run(pendingId: string, input: NextChapterInput): Promise<database.GenerationDescriptor | null> {
      const pending = await store.resolveGeneration(input.readerId, pendingId);
      if (!pending || pending.bookId !== input.original.bookId || pending.chapterNumber !== input.original.number
        || pending.level !== input.decision.to || pending.baselineVersionId !== input.baseline.id) throw new Error("Generation does not match the supplied Reader and target");
      if (pending.status === "ready") return pending;
      const token = await store.claimGeneration(input.readerId, pendingId);
      if (!token) return store.resolveGeneration(input.readerId, pendingId);
      const controller = new AbortController();
      try {
        const [original, baseline] = await Promise.all([store.getChapter(pending.bookId, pending.chapterNumber), store.getChapterVersion(pending.baselineVersionId)]);
        if (!original || !baseline || !isDeepStrictEqual(original, input.original) || !isDeepStrictEqual(baseline, input.baseline)) throw new Error("Generation input differs from stored content");
        const policy = await store.getChapterPolicy(original.id);
        if (!policy) throw new Error("Missing stored source policy");
        const signal = deadline(budgetMs, controller.signal);
        let provider = options.chat;
        if (provider === undefined) {
          try { provider = createOciChat(); }
          catch { provider = null; }
        }
        const chat: Chat = async (prompt, callOptions) => {
          if (!provider) throw new Error("Chapter generation provider unavailable");
          // R4's Check has its own shorter deadline; both must respect this run's total budget.
          return provider(prompt, { ...callOptions, json: true, signal: callOptions?.signal ? AbortSignal.any([signal, callOptions.signal]) : signal });
        };
        const generator = createChapterGenerator({
          generateText: async (prompt, callOptions) => {
            try { return await chat(prompt, { ...callOptions, json: true, maxTokens: 4_000 }); }
            catch { throw new Error("Chapter generation provider unavailable"); }
          },
          generateCheck: createOciChapterCheckGenerator({ chat, fallback: generateChapterCheck, timeoutMs: Math.min(15_000, budgetMs) }),
          policyForChapter: () => ({ ...policy, vocabulary }), budgetMs,
          fallback: () => store.getFallbackArtifact(pending.bookId, pending.chapterNumber, pending.level),
        });
        const artifact = await generator.generate(input, { signal });
        await store.saveGeneratedChapter(pendingId, artifact, token, input);
      } catch {
        await store.failGeneration(pendingId, token);
      } finally {
        controller.abort();
      }
      return store.resolveGeneration(input.readerId, pendingId);
    },
  };
}

/** Lazy provider setup keeps importing routes independent of local OCI credentials. */
export async function runGeneration(pendingId: string, input: NextChapterInput): Promise<database.GenerationDescriptor | null> {
  return createGenerationRuntime().run(pendingId, input);
}

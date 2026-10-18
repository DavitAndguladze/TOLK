import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { generateChapterCheck } from "../comprehension/chapter-check-generator";
import vocabulary from "../data/vocabulary/english-2018.json" with { type: "json" };
import gatsbySource from "../data/gatsby/content.json" with { type: "json" };
import { mockBook, mockChapter, mockChapterCheck, mockChapterVersion } from "../mocks";
import { chapterArtifactDigest, createChapterGenerator, type FidelityInput, type FidelityReview } from "../leveling/generator";
import { generateGatsbySeed } from "../leveling/seed";
import type { Chapter, NextChapterInput } from "../types";

const testDatabase = process.env.TOLK_TEST_DATABASE_URL;
const sentences = ["Nick saw a light.", "He went home.", "He felt hope."];
function review({ version, check, digest, chapter }: FidelityInput): FidelityReview {
  return { versionId: version.id, digest, plotPreserved: true, tonePreserved: true, checkAnswerable: true, reinforcementAppropriate: true,
    keyPointEvidence: chapter.keyPoints.map((point, sentenceIndex) => ({ keyPointId: point.id, sentenceIndex, quote: version.sentences[sentenceIndex].text })),
    checkEvidence: check.questions.map((question) => ({ questionId: question.id, sentenceIndex: question.answerSentenceIndex, quote: version.sentences[question.answerSentenceIndex].text })) };
}
const generator = (levelScore?: number) => createChapterGenerator({ generateText: async (prompt) => {
  const data = JSON.parse(prompt.split("DATA:\n")[1]);
  return JSON.stringify({ level: data.level, levelScore: levelScore ?? data.level * 20, sentences: data.sentences, reinforcedWords: [] });
}, generateCheck: generateChapterCheck, evaluateFidelity: async (input) => review(input),
policyForChapter: () => ({ requiredNames: ["Nick"], retainedWords: ["hope"], vocabulary }) });

async function fixture(levelScore?: number) {
  const readerId = randomUUID(), bookId = randomUUID();
  const chapters: Chapter[] = [1, 2, 3, 4].map((number) => ({ id: `${bookId}-ch${number}`, bookId, number, title: `Chapter ${number}`,
    originalText: sentences.join(" "), keyPoints: sentences.map((text, index) => ({ id: `${bookId}-ch${number}-kp${index}`, chapterId: `${bookId}-ch${number}`, text })),
    complexWords: [{ word: "hope", meaning: "a feeling that good things can happen" }] }));
  const policies = Object.fromEntries(chapters.map((chapter) => [chapter.id, { requiredNames: ["Nick"], retainedWords: ["hope"], originalEvidence: {
    keyPoints: chapter.keyPoints.map((point, originalSentenceIndex) => ({ keyPointId: point.id, originalSentenceIndex, quote: sentences[originalSentenceIndex] })),
    complexWords: [{ word: "hope", originalSentenceIndex: 2, quote: sentences[2] }],
  } }]));
  const seed = await generateGatsbySeed({ book: { id: bookId, title: "Test Book", author: "Test", sourceUrl: "https://example.com/fixture", chapterCount: 4 }, chapters, policies }, generator(levelScore));
  const input: NextChapterInput = { original: chapters[1], baseline: seed.sharedChapterOne.version, readerId,
    decision: { from: 1, to: 1, reason: "barely-passed", explanation: "Keep this Level.", reinforcement: "context-clue" }, wordBank: [], graduatedWords: [] };
  return { readerId, bookId, seed, input };
}

describe.skipIf(!testDatabase)("persisted Chapter generation", () => {
  const owned: { readerId: string; bookId: string }[] = [];
  let store: typeof import("./generation");
  let content: typeof import(".");
  let schema: typeof import("./schema");
  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabase!;
    content = await import(".");
    store = await import("./generation");
    schema = await import("./schema");
  });
  afterAll(async () => {
    for (const { readerId, bookId } of owned) await content.db().transaction(async (tx) => {
      await tx.delete(schema.chapterGenerations).where(eq(schema.chapterGenerations.readerId, readerId));
      await tx.delete(schema.sessionResults).where(eq(schema.sessionResults.readerId, readerId));
      const versions = await tx.select({ id: schema.chapterVersions.id }).from(schema.chapterVersions).where(eq(schema.chapterVersions.bookId, bookId));
      if (versions.length) {
        await tx.delete(schema.chapterArtifacts).where(inArray(schema.chapterArtifacts.versionId, versions.map((row) => row.id)));
        await tx.delete(schema.chapterChecks).where(inArray(schema.chapterChecks.chapterVersionId, versions.map((row) => row.id)));
      }
      await tx.delete(schema.chapterVersions).where(eq(schema.chapterVersions.bookId, bookId));
      const chapters = await tx.select({ id: schema.chapters.id }).from(schema.chapters).where(eq(schema.chapters.bookId, bookId));
      if (chapters.length) await tx.delete(schema.chapterPolicies).where(inArray(schema.chapterPolicies.chapterId, chapters.map((row) => row.id)));
      await tx.delete(schema.chapters).where(eq(schema.chapters.bookId, bookId));
      await tx.delete(schema.books).where(eq(schema.books.id, bookId));
      await tx.delete(schema.user).where(eq(schema.user.id, readerId));
    });
  });
  async function setup() {
    const data = await fixture();
    owned.push({ readerId: data.readerId, bookId: data.bookId });
    await content.db().insert(schema.user).values({ id: data.readerId, name: "Generation test", email: `${data.readerId}@example.com` });
    await store.loadGatsbySeed(data.seed);
    const id = await store.startGeneration(data.readerId, data.bookId, 2, 1, data.input.baseline.id);
    return { ...data, id };
  }

  it("loads full source metadata beside the served sample without publishing ready content", async () => {
    await content.loadContent({ books: [mockBook], chapters: [mockChapter], versions: [{ version: mockChapterVersion(1), check: mockChapterCheck }] });
    const sample = async () => Promise.all([
      content.getBook(mockBook.id), content.getChapter(mockBook.id, 1),
      content.getChapterVersion(mockChapterVersion(1).id), content.getChapterCheck(mockChapterVersion(1).id),
    ]);
    const before = await sample();
    const existingFull = await content.getBook("gatsby-full");
    if (!existingFull) owned.push({ readerId: randomUUID(), bookId: "gatsby-full" });
    await store.loadGatsbySource();
    await store.loadGatsbySource();
    expect(await sample()).toEqual(before);
    expect(await content.getBook("gatsby-full")).toEqual(gatsbySource.book);
    for (const chapter of gatsbySource.chapters) {
      expect(await content.getChapter("gatsby-full", chapter.number)).toEqual(chapter);
      expect(await store.getChapterPolicy(chapter.id)).toEqual(gatsbySource.policies[chapter.id as keyof typeof gatsbySource.policies]);
    }
    expect(await content.db().select().from(schema.chapterVersions).where(eq(schema.chapterVersions.bookId, "gatsby-full"))).toEqual([]);
  });

  it("persists a generated fractional Level Score without breaking immutable identity", async () => {
    const { readerId, id, input } = await setup();
    const token = (await store.claimGeneration(readerId, id))!;
    const artifact = await generator(99.99999999999999).generate(input);
    expect(await store.saveGeneratedChapter(id, artifact, token, input)).toBe(true);
    expect((await store.resolveGeneration(readerId, id))?.artifact).toEqual(artifact);
  });

  it("loads a generated fractional Level Score seed with its original fidelity digest", async () => {
    const { seed, bookId, readerId } = await fixture(99.99999999999999);
    owned.push({ readerId, bookId });
    await store.loadGatsbySeed(seed);
    await store.loadGatsbySeed(seed);
    expect(await content.getChapterVersion(seed.sharedChapterOne.version.id)).toEqual(seed.sharedChapterOne.version);
    expect(await store.getFallbackArtifact(bookId, 2, 1)).toEqual(seed.fallbacks[0]);
  });

  it("returns one stable pending ID under concurrent starts and scopes resolution to its Reader", async () => {
    const { readerId, bookId, input, id } = await setup();
    expect(await Promise.all([1, 2, 3].map(() => store.startGeneration(readerId, bookId, 2, 1, input.baseline.id)))).toEqual([id, id, id]);
    expect(await store.resolveGeneration(readerId, id)).toMatchObject({ id, status: "pending", bookId, chapterNumber: 2, level: 1, artifact: null });
    expect(await store.resolveGeneration("another-reader", id)).toBeNull();
    await expect(store.startGeneration(readerId, bookId, 2, 2, input.baseline.id)).rejects.toThrow(/conflicting/i);
  });

  it("preserves complete seeded artifacts and source policies across a JSON database roundtrip", async () => {
    const { seed, bookId, readerId } = await setup();
    await store.loadGatsbySeed(seed);
    expect(await store.getChapterPolicy(seed.content.chapters[1].id)).toEqual(seed.content.policies[seed.content.chapters[1].id]);
    expect(await store.getFallbackArtifact(bookId, 2, 1)).toEqual(seed.fallbacks[0]);
    expect(await content.getBookProgress(readerId, bookId)).toBeNull();
  });

  it("keeps the first validated metadata when the same shared content is generated and loaded again", async () => {
    const { seed, bookId } = await setup();
    const repeated = structuredClone(await generateGatsbySeed(seed.content, generator()));
    expect(repeated.fallbacks[0].version.id).toBe(seed.fallbacks[0].version.id);
    expect(repeated.fallbacks[0].version.generatedAt).not.toBe(seed.fallbacks[0].version.generatedAt);
    expect(repeated.fallbacks[0].fidelity.digest).not.toBe(seed.fallbacks[0].fidelity.digest);
    repeated.fallbacks[0].provenance.attempts = 2;
    await store.loadGatsbySeed(repeated);
    expect(await store.getFallbackArtifact(bookId, 2, 1)).toEqual(seed.fallbacks[0]);
    expect(await content.getChapterVersion(seed.sharedChapterOne.version.id)).toEqual(seed.sharedChapterOne.version);
    expect(await content.getChapterCheck(seed.sharedChapterOne.version.id)).toEqual(seed.sharedChapterOne.check);
  });

  it("rejects a changed Check under the same identity and atomically rolls back new seed content", async () => {
    const { seed } = await setup();
    const incoming = structuredClone(seed);
    // A new shared identity is valid, but must not become visible if a later artifact collides.
    const first = incoming.sharedChapterOne;
    first.version.id = `shared-${randomUUID()}`;
    first.check.id = `check-${first.version.id}`;
    first.check.chapterVersionId = first.version.id;
    first.fidelity.versionId = first.version.id;
    first.fidelity.digest = chapterArtifactDigest(incoming.content.chapters[0], first.version, first.check);
    const changed = incoming.fallbacks[0];
    changed.check.questions[0].prompt = "What did Nick see?";
    changed.fidelity.digest = chapterArtifactDigest(incoming.content.chapters[1], changed.version, changed.check);
    await expect(store.loadGatsbySeed(incoming)).rejects.toThrow(/immutable/i);
    expect(await content.getChapterVersion(first.version.id)).toBeNull();
    expect(await content.getChapterCheck(first.version.id)).toBeNull();
    expect(await store.getFallbackArtifact(changed.version.bookId, 2, 1)).toEqual(seed.fallbacks[0]);
  });

  it("does not reuse an existing artifact whose independent fidelity review is invalid", async () => {
    const { seed } = await setup();
    const stored = structuredClone(seed.fallbacks[0]);
    stored.fidelity.plotPreserved = false;
    await content.db().update(schema.chapterArtifacts).set({ data: stored }).where(eq(schema.chapterArtifacts.versionId, stored.version.id));
    const repeated = await generateGatsbySeed(seed.content, generator());
    await expect(store.loadGatsbySeed(repeated)).rejects.toThrow(/fidelity/i);
    expect(await store.getFallbackArtifact(stored.version.bookId, 2, 1)).toEqual(stored);
  });

  it("stores fallback delivery provenance without rewriting its shared immutable artifact", async () => {
    const { id, readerId, seed, input } = await setup();
    const { createGenerationRuntime } = await import("../leveling/runtime");
    const fallback = seed.fallbacks[0];
    const delivered = { ...fallback, provenance: { ...fallback.provenance, attempts: 2, fallbackReason: "generation-failed" as const } };
    expect((await createGenerationRuntime({ store, chat: null }).run(id, input))?.status).toBe("ready");
    expect((await store.resolveGeneration(readerId, id))?.artifact).toEqual(delivered);
    expect(await store.getFallbackArtifact(fallback.version.bookId, 2, 1)).toEqual(fallback);
  });

  it("claims once, permits a failed retry, and rejects stale save/fail tokens without orphan Versions", async () => {
    const { readerId, id, input } = await setup();
    const claims = await Promise.all([store.claimGeneration(readerId, id), store.claimGeneration(readerId, id)]);
    const token = claims.find(Boolean)!;
    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(await store.claimGeneration("another-reader", id)).toBeNull();
    expect(await store.failGeneration(id, token)).toBe(true);
    const retry = (await store.claimGeneration(readerId, id))!;
    expect(retry).not.toBe(token);
    const artifact = await generator().generate(input);
    expect(await store.saveGeneratedChapter(id, artifact, token, input)).toBe(false);
    expect(await store.failGeneration(id, token)).toBe(false);
    expect(await content.getChapterVersion(artifact.version.id)).toBeNull();
    expect(await store.saveGeneratedChapter(id, artifact, retry, input)).toBe(true);
    expect(await store.resolveGeneration(readerId, id)).toMatchObject({ status: "ready", artifact });
    expect(await store.failGeneration(id, retry)).toBe(false);
    expect(await store.claimGeneration(readerId, id)).toBeNull();
    const late = await generator().generate(input);
    expect(await store.saveGeneratedChapter(id, late, retry, input)).toBe(false);
    expect(await content.getChapterVersion(late.version.id)).toBeNull();
  });

  it("reclaims an abandoned attempt and preserves its baseline and saved completion on failure", async () => {
    const { readerId, bookId, id, input } = await setup();
    const completedAt = new Date();
    const result = { id: randomUUID(), readerId, chapterVersionId: input.baseline.id, chapterNumber: 1, level: 1 as const, readAloudMisses: [],
      grading: { result: "struggled" as const, score: 0, barelyPassed: false, questionGrades: [], missedWords: [],
        basis: { readAloudAccuracy: null, checkScore: 0, checkMax: 0, flaggedCount: 0, gradedBy: "stand-in" as const } }, completedAt: completedAt.toISOString() };
    // The completion table is independent of a generation attempt; use its JSON fixture verbatim.
    await content.db().insert(schema.sessionResults).values({ id: result.id, readerId, bookId, chapterVersionId: input.baseline.id, chapterNumber: 1, level: 1, completedAt, data: result });
    const old = await store.claimGeneration(readerId, id);
    await content.db().update(schema.chapterGenerations).set({ updatedAt: new Date(Date.now() - 31_000) }).where(eq(schema.chapterGenerations.id, id));
    const current = await store.claimGeneration(readerId, id);
    expect(current).not.toBe(old);
    expect(await store.failGeneration(id, current!)).toBe(true);
    expect(await store.resolveGeneration(readerId, id)).toMatchObject({ status: "failed", artifact: null, baselineVersionId: input.baseline.id });
    const [saved] = await content.db().select().from(schema.sessionResults).where(and(eq(schema.sessionResults.readerId, readerId), eq(schema.sessionResults.chapterVersionId, input.baseline.id)));
    expect(saved.data).toEqual(result);
    expect(await content.getChapterVersion(input.baseline.id)).toEqual(input.baseline);
  });

  it("rolls back immutable collisions without exposing a ready link or a new Check", async () => {
    const { id, readerId, input } = await setup();
    const token = (await store.claimGeneration(readerId, id))!;
    const artifact = await generator().generate(input);
    const changed = { ...artifact.version, text: "Conflicting immutable text" };
    await content.loadContent({ books: [], chapters: [], versions: [{ version: changed, check: artifact.check }] });
    await expect(store.saveGeneratedChapter(id, artifact, token, input)).rejects.toThrow(/immutable/i);
    expect(await store.resolveGeneration(readerId, id)).toMatchObject({ status: "pending", artifact: null });
    const artifacts = await content.db().select().from(schema.chapterArtifacts).where(eq(schema.chapterArtifacts.versionId, artifact.version.id));
    expect(artifacts).toHaveLength(0);
    expect(await content.getChapterVersion(artifact.version.id)).toEqual(changed);
  });

  it("rejects an incomplete or invalid seed before publishing content", async () => {
    const { seed, bookId } = await fixture();
    await expect(store.loadGatsbySeed({ ...seed, fallbacks: [] })).rejects.toThrow(/incomplete/i);
    expect(await content.getBook(bookId)).toBeNull();
    const changed = structuredClone(seed);
    changed.fallbacks[0].fidelity.plotPreserved = false;
    await expect(store.loadGatsbySeed(changed)).rejects.toThrow(/fidelity/i);
    expect(await content.getBook(bookId)).toBeNull();
  });
});

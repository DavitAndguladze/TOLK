import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, test } from "vitest";
import { mockBook, mockChapter, mockChapterVersion, mockSession } from "../mocks";
import type { ChapterCheckAnswers, ReadAloudSummary } from "../types";
import { generateChapterCheck } from "./chapter-check-generator";
import { completeChapter, generateCompletedChapter, getChapterCompletion, getReaderWordBank } from "./complete-chapter";

describe.skipIf(!process.env.TOLK_TEST_DATABASE_URL)("persisted Chapter completion", () => {
  let database: typeof import("../db");
  let schema: typeof import("../db/schema");
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TOLK_TEST_DATABASE_URL!;
    database = await import("../db");
    schema = await import("../db/schema");
    const { migrate } = await import("drizzle-orm/mysql2/migrator");
    await migrate(database.db(), { migrationsFolder: "drizzle" });
  });

  async function fixture(chapterNumber = 1) {
    const readerId = randomUUID(), bookId = randomUUID();
    await database.db().insert(schema.user).values({ id: readerId, name: "Completion test", email: `${readerId}@example.com` });
    const chapters = [1, 2, 3, 4].map((number) => ({ ...mockChapter, id: `${bookId}-ch${number}`, bookId, number }));
    const versions = await Promise.all(chapters.map(async (chapter) => {
      const version = { ...mockChapterVersion(4), id: `${chapter.id}-L1`, bookId, chapterId: chapter.id,
        readerId: null, level: 1 as const, chapterNumber: chapter.number };
      return { version, check: await generateChapterCheck(chapter, version) };
    }));
    await database.loadContent({ books: [{ ...mockBook, id: bookId, chapterCount: 4 }], chapters, versions });
    const current = versions[chapterNumber - 1];
    await database.setBookProgress(readerId, { bookId, currentChapterNumber: chapterNumber, currentLevel: 1, currentVersionId: current.version.id });
    const answers: ChapterCheckAnswers = { answers: current.check.questions.map((q) => ({ questionId: q.id, via: "typed",
      answer: q.kind === "complex-word" ? mockChapter.complexWords.find((word) => word.word === q.word)!.meaning : "His father gave advice." })) };
    return { readerId, bookId, versions, current, answers };
  }
  const grading = { keyPointGrader: async () => ({ grade: 2 as const, feedback: "Yes.", gradedBy: "stand-in" as const }), now: () => new Date() };

  test("saves a complete outcome and returns that exact outcome after a lost-response retry", async () => {
    const f = await fixture();
    const first = await completeChapter(f.readerId, f.current.check.id, f.answers, grading);
    expect(first.session.grading.score).toBe(100);
    expect(first.decision.reason).toBe("insufficient-history");
    expect(first.nextVersionId).toMatch(/^pending-/);
    expect((await database.openBook(f.readerId, f.bookId))?.version).toMatchObject({ id: first.nextVersionId, status: "generating" });
    expect(await getChapterCompletion(f.readerId, f.current.version.id)).toEqual(first);
    const retry = await completeChapter(f.readerId, f.current.check.id, f.answers, {
      ...grading, keyPointGrader: async () => { throw new Error("A saved completion must not call AI again"); },
    });
    expect(retry).toEqual(first);
    expect((await database.levelHistory(f.readerId, f.bookId)).map((s) => s.id)).toEqual([first.session.id]);
  });

  test("submitting reuses each Key Point grade from Check and saves the rest inside the completion (#97)", async () => {
    const f = await fixture();
    const { createMySqlAnswerGradeStore } = await import("./mysql-answer-grades");
    const store = createMySqlAnswerGradeStore();
    const [checked, ...unchecked] = f.current.check.questions.filter((q) => q.kind === "key-point");
    const key = (questionId: string) => ({ readerId: f.readerId, checkId: f.current.check.id, questionId, answer: "His father gave advice." });
    await store.save(key(checked.id), { grade: 1, feedback: "Seen on Check.", gradedBy: "stand-in" });
    const graded: string[] = [];
    const outcome = await completeChapter(f.readerId, f.current.check.id, f.answers, {
      ...grading, keyPointGrader: async ({ question }) => { graded.push(question.id); return grading.keyPointGrader(); },
    });
    expect(graded.sort()).toEqual(unchecked.map((q) => q.id).sort());
    expect(outcome.session.grading.questionGrades.find((g) => g.questionId === checked.id)?.feedback).toBe("Seen on Check.");
    expect(await store.get(key(unchecked[0].id))).toEqual({ grade: 2, feedback: "Yes.", gradedBy: "stand-in" });
  });

  test("concurrent submissions apply the durable flagged word and completion only once", async () => {
    const f = await fixture();
    const { saveFlag } = await import("../words/mysql-flags");
    const token = f.current.version.tokens.find((t) => t.normalized === "vulnerable")!;
    await saveFlag(f.readerId, f.current.version, token.index);
    const [first, again] = await Promise.all([completeChapter(f.readerId, f.current.check.id, f.answers, grading),
      completeChapter(f.readerId, f.current.check.id, f.answers, grading)]);
    expect(again).toEqual(first);
    expect(first.session.grading.basis.flaggedCount).toBe(1);
    expect(first.wordBank.bank).toContainEqual({ word: "vulnerable", source: "flagged", timesSeen: 1,
      graduated: false, addedInChapter: 1, graduatedInChapter: null });
    expect(await database.levelHistory(f.readerId, f.bookId)).toHaveLength(1);
  });

  test("the third strong distinct Chapter promotes once and resets the saved Level window", async () => {
    const f = await fixture(3);
    for (const number of [1, 2]) await database.recordSessionResult({ ...mockSession, id: randomUUID(), readerId: f.readerId,
      chapterVersionId: f.versions[number - 1].version.id, chapterNumber: number, level: 1,
      grading: { ...mockSession.grading, score: 90 }, completedAt: new Date(Date.now() - (3 - number) * 10_000).toISOString() }, f.bookId);
    const outcome = await completeChapter(f.readerId, f.current.check.id, f.answers, grading);
    expect(outcome.decision).toMatchObject({ from: 1, to: 2, reason: "sustained-understanding" });
    expect(await database.getBookProgress(f.readerId, f.bookId)).toMatchObject({ currentChapterNumber: 4, currentLevel: 2,
      currentVersionId: outcome.nextVersionId });
    expect(await database.levelHistory(f.readerId, f.bookId)).toEqual([]);
    expect(await completeChapter(f.readerId, f.current.check.id, f.answers, grading)).toEqual(outcome);
  });

  const reading = (versionId: string, startedAt = "2026-10-18T01:00:00.000Z"): ReadAloudSummary => ({
    chapterVersionId: versionId, startedAt, endedAt: "2026-10-18T01:05:00.000Z", accuracy: 0.5, wordResults: [], misses: [],
  });

  test("a silent completion ignores an abandoned reading, and a named reading is consumed only after saving", async () => {
    const { createMySqlReadAloudStore } = await import("../platform/read-aloud-store");
    const store = createMySqlReadAloudStore();
    const silent = await fixture();
    await store.save(silent.readerId, reading(silent.current.version.id));
    const first = await completeChapter(silent.readerId, silent.current.check.id, { ...silent.answers, readAloudStartedAt: null }, grading);
    expect(first.session.grading.basis.readAloudAccuracy).toBeNull();
    expect(await store.get(silent.readerId, silent.current.version.id)).not.toBeNull();
    const spoken = await fixture();
    const saved = reading(spoken.current.version.id);
    await store.save(spoken.readerId, saved);
    const outcome = await completeChapter(spoken.readerId, spoken.current.check.id, { ...spoken.answers, readAloudStartedAt: saved.startedAt }, grading);
    expect(outcome.session.grading.basis.readAloudAccuracy).toBe(0.5);
    expect(await store.get(spoken.readerId, spoken.current.version.id)).toBeNull();
    expect(await completeChapter(spoken.readerId, spoken.current.check.id, spoken.answers, grading)).toEqual(outcome);
  });

  test("a newer read-aloud save survives while the previous named reading is graded", async () => {
    const f = await fixture();
    const { createMySqlReadAloudStore } = await import("../platform/read-aloud-store");
    const store = createMySqlReadAloudStore(), first = reading(f.current.version.id);
    const newer = { ...reading(f.current.version.id, "2026-10-18T01:03:00.000Z"), accuracy: 1 };
    await store.save(f.readerId, first);
    let replaced = false;
    const outcome = await completeChapter(f.readerId, f.current.check.id, { ...f.answers, readAloudStartedAt: first.startedAt }, {
      ...grading, keyPointGrader: async () => {
        if (!replaced) { replaced = true; await store.save(f.readerId, newer); }
        return { grade: 2, feedback: "Yes.", gradedBy: "stand-in" };
      },
    });
    expect(outcome.session.grading.basis.readAloudAccuracy).toBe(0.5);
    expect(await store.get(f.readerId, f.current.version.id)).toEqual(newer);
  });

  test("a failure reserving the next Chapter rolls back result, bank, progress and reading consumption", async () => {
    const f = await fixture();
    const { startGeneration } = await import("../db/generation");
    const { saveFlag } = await import("../words/mysql-flags");
    const { createMySqlReadAloudStore } = await import("../platform/read-aloud-store");
    await startGeneration(f.readerId, f.bookId, 2, 2, f.current.version.id);
    await saveFlag(f.readerId, f.current.version, f.current.version.tokens.find((t) => t.normalized === "vulnerable")!.index);
    const store = createMySqlReadAloudStore(), saved = reading(f.current.version.id);
    await store.save(f.readerId, saved);
    await expect(completeChapter(f.readerId, f.current.check.id, { ...f.answers, readAloudStartedAt: saved.startedAt }, grading)).rejects.toThrow(/Conflicting generation/);
    expect(await getChapterCompletion(f.readerId, f.current.version.id)).toBeNull();
    expect(await getReaderWordBank(f.readerId)).toEqual([]);
    expect(await database.levelHistory(f.readerId, f.bookId)).toEqual([]);
    expect((await database.getBookProgress(f.readerId, f.bookId))?.currentVersionId).toBe(f.current.version.id);
    expect(await store.get(f.readerId, f.current.version.id)).toEqual(saved);
  });

  test("another Reader cannot complete a private Version or see its saved outcome", async () => {
    const owner = await fixture(), other = await fixture();
    const privateVersion = { ...owner.current.version, readerId: owner.readerId };
    await database.db().update(schema.chapterVersions).set({ readerId: owner.readerId, data: privateVersion })
      .where(eq(schema.chapterVersions.id, privateVersion.id));
    const outcome = await completeChapter(owner.readerId, owner.current.check.id, owner.answers, grading);
    await expect(completeChapter(other.readerId, owner.current.check.id, owner.answers, grading)).rejects.toMatchObject({ status: 404 });
    expect(await getChapterCompletion(other.readerId, privateVersion.id)).toBeNull();
    expect(await getChapterCompletion(owner.readerId, privateVersion.id)).toEqual(outcome);
  });

  test("a correct contextual answer graduates a persisted word in the next Chapter, once", async () => {
    const f = await fixture();
    const { saveFlag } = await import("../words/mysql-flags");
    await saveFlag(f.readerId, f.current.version, f.current.version.tokens.find((t) => t.normalized === "vulnerable")!.index);
    await completeChapter(f.readerId, f.current.check.id, f.answers, grading);
    const next = f.versions[1];
    await database.setBookProgress(f.readerId, { bookId: f.bookId, currentChapterNumber: 2, currentLevel: 1, currentVersionId: next.version.id });
    const answers = { answers: next.check.questions.map((q) => ({ questionId: q.id, via: "typed" as const,
      answer: q.kind === "complex-word" ? mockChapter.complexWords.find((w) => w.word === q.word)!.meaning : "His father gave advice." })) };
    const outcome = await completeChapter(f.readerId, next.check.id, answers, grading);
    expect(outcome.wordBank.graduatedThisChapter).toContain("vulnerable");
    expect((await getReaderWordBank(f.readerId)).find((w) => w.word === "vulnerable")).toMatchObject({ timesSeen: 2, graduated: true, graduatedInChapter: 2 });
    expect(await completeChapter(f.readerId, next.check.id, answers, grading)).toEqual(outcome);
    expect((await getReaderWordBank(f.readerId)).find((w) => w.word === "vulnerable")?.timesSeen).toBe(2);
  });

  test("a failed generation leaves the exact saved completion and its retry identity intact", async () => {
    const f = await fixture();
    const { createGenerationRuntime } = await import("../leveling/runtime");
    const { getGenerationVersion } = await import("../db/generation");
    const outcome = await completeChapter(f.readerId, f.current.check.id, f.answers, grading);
    await generateCompletedChapter(outcome, createGenerationRuntime({ chat: null }).run);
    expect((await getGenerationVersion(f.readerId, outcome.nextVersionId!))?.status).toBe("failed");
    expect(await getChapterCompletion(f.readerId, f.current.version.id)).toEqual(outcome);
    expect(await completeChapter(f.readerId, f.current.check.id, f.answers, grading)).toEqual(outcome);
    expect((await database.openBook(f.readerId, f.bookId))?.version.status).toBe("failed");
  });

  test("post-commit generation links a validated fallback and the Library resumes its exact Version and Check", async () => {
    const { createChapterGenerator } = await import("../leveling/generator");
    const { generateGatsbySeed } = await import("../leveling/seed");
    const { createGenerationRuntime } = await import("../leveling/runtime");
    const { loadGatsbySeed, getGenerationVersion } = await import("../db/generation");
    const vocabulary = (await import("../data/vocabulary/english-2018.json")).default;
    const readerId = randomUUID(), bookId = randomUUID();
    await database.db().insert(schema.user).values({ id: readerId, name: "Fallback test", email: `${readerId}@example.com` });
    const sentences = ["Nick saw a light.", "He went home.", "He felt hope."];
    const chapters = [1, 2, 3, 4].map((number) => ({ id: `${bookId}-ch${number}`, bookId, number, title: `Chapter ${number}`,
      originalText: sentences.join(" "), keyPoints: sentences.map((text, index) => ({ id: `${bookId}-ch${number}-kp${index}`, chapterId: `${bookId}-ch${number}`, text })),
      complexWords: [{ word: "hope", meaning: "a feeling that good things can happen" }] }));
    const policies = Object.fromEntries(chapters.map((chapter) => [chapter.id, { requiredNames: ["Nick"], retainedWords: ["hope"], originalEvidence: {
      keyPoints: chapter.keyPoints.map((point, originalSentenceIndex) => ({ keyPointId: point.id, originalSentenceIndex, quote: sentences[originalSentenceIndex] })),
      complexWords: [{ word: "hope", originalSentenceIndex: 2, quote: sentences[2] }],
    } }]));
    const generator = createChapterGenerator({ generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      return JSON.stringify({ level: data.level, levelScore: data.level * 20, sentences: data.sentences, reinforcedWords: [] });
    }, generateCheck: generateChapterCheck, policyForChapter: () => ({ requiredNames: ["Nick"], retainedWords: ["hope"], vocabulary }),
    evaluateFidelity: async ({ version, check, digest, chapter }) => ({ versionId: version.id, digest, plotPreserved: true, tonePreserved: true,
      checkAnswerable: true, reinforcementAppropriate: true,
      keyPointEvidence: chapter.keyPoints.map((point, sentenceIndex) => ({ keyPointId: point.id, sentenceIndex, quote: version.sentences[sentenceIndex].text })),
      checkEvidence: check.questions.map((q) => ({ questionId: q.id, sentenceIndex: q.answerSentenceIndex, quote: version.sentences[q.answerSentenceIndex].text })),
    }) });
    const seed = await generateGatsbySeed({ book: { ...mockBook, id: bookId, chapterCount: 4 }, chapters, policies }, generator);
    await loadGatsbySeed(seed);
    const baseline = seed.sharedChapterOne;
    await database.setBookProgress(readerId, { bookId, currentChapterNumber: 1, currentLevel: 1, currentVersionId: baseline.version.id });
    const answers: ChapterCheckAnswers = { answers: baseline.check.questions.map((q) => ({ questionId: q.id, via: "typed",
      answer: q.kind === "complex-word" ? chapters[0].complexWords[0].meaning : "Nick saw a light." })) };
    const outcome = await completeChapter(readerId, baseline.check.id, answers, grading);
    await generateCompletedChapter(outcome, createGenerationRuntime({ chat: null }).run);
    const ready = await getGenerationVersion(readerId, outcome.nextVersionId!);
    expect(ready?.status).toBe("ready");
    expect(ready?.chapterNumber).toBe(2);
    expect((await database.openBook(readerId, bookId))?.version).toEqual(ready);
    expect((await database.getChapterCheck(ready!.id))?.chapterVersionId).toBe(ready!.id);
    expect(await getChapterCompletion(readerId, baseline.version.id)).toEqual(outcome);
  });

  test("an explicit retry that bypasses generateCompletedChapter still promotes progress once the generation is ready", async () => {
    const { createChapterGenerator } = await import("../leveling/generator");
    const { generateGatsbySeed } = await import("../leveling/seed");
    const { createGenerationRuntime } = await import("../leveling/runtime");
    const { loadGatsbySeed, getGenerationVersion } = await import("../db/generation");
    const { promotePendingProgress, getSavedGenerationInput } = await import("./complete-chapter");
    const vocabulary = (await import("../data/vocabulary/english-2018.json")).default;
    const readerId = randomUUID(), bookId = randomUUID();
    await database.db().insert(schema.user).values({ id: readerId, name: "Retry promotion test", email: `${readerId}@example.com` });
    const sentences = ["Nick saw a light.", "He went home.", "He felt hope."];
    const chapters = [1, 2, 3, 4].map((number) => ({ id: `${bookId}-ch${number}`, bookId, number, title: `Chapter ${number}`,
      originalText: sentences.join(" "), keyPoints: sentences.map((text, index) => ({ id: `${bookId}-ch${number}-kp${index}`, chapterId: `${bookId}-ch${number}`, text })),
      complexWords: [{ word: "hope", meaning: "a feeling that good things can happen" }] }));
    const policies = Object.fromEntries(chapters.map((chapter) => [chapter.id, { requiredNames: ["Nick"], retainedWords: ["hope"], originalEvidence: {
      keyPoints: chapter.keyPoints.map((point, originalSentenceIndex) => ({ keyPointId: point.id, originalSentenceIndex, quote: sentences[originalSentenceIndex] })),
      complexWords: [{ word: "hope", originalSentenceIndex: 2, quote: sentences[2] }],
    } }]));
    const generator = createChapterGenerator({ generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      return JSON.stringify({ level: data.level, levelScore: data.level * 20, sentences: data.sentences, reinforcedWords: [] });
    }, generateCheck: generateChapterCheck, policyForChapter: () => ({ requiredNames: ["Nick"], retainedWords: ["hope"], vocabulary }),
    evaluateFidelity: async ({ version, check, digest, chapter }) => ({ versionId: version.id, digest, plotPreserved: true, tonePreserved: true,
      checkAnswerable: true, reinforcementAppropriate: true,
      keyPointEvidence: chapter.keyPoints.map((point, sentenceIndex) => ({ keyPointId: point.id, sentenceIndex, quote: version.sentences[sentenceIndex].text })),
      checkEvidence: check.questions.map((q) => ({ questionId: q.id, sentenceIndex: q.answerSentenceIndex, quote: version.sentences[q.answerSentenceIndex].text })),
    }) });
    const seed = await generateGatsbySeed({ book: { ...mockBook, id: bookId, chapterCount: 4 }, chapters, policies }, generator);
    await loadGatsbySeed(seed);
    const baseline = seed.sharedChapterOne;
    await database.setBookProgress(readerId, { bookId, currentChapterNumber: 1, currentLevel: 1, currentVersionId: baseline.version.id });
    const answers: ChapterCheckAnswers = { answers: baseline.check.questions.map((q) => ({ questionId: q.id, via: "typed",
      answer: q.kind === "complex-word" ? chapters[0].complexWords[0].meaning : "Nick saw a light." })) };
    const outcome = await completeChapter(readerId, baseline.check.id, answers, grading);
    const pendingId = outcome.nextVersionId!;

    // Simulates R3's retry endpoint: calls runGeneration directly, bypassing generateCompletedChapter's promotion.
    const input = await getSavedGenerationInput(readerId, pendingId);
    await createGenerationRuntime({ chat: null }).run(pendingId, input!);
    const ready = await getGenerationVersion(readerId, pendingId);
    expect(ready?.status).toBe("ready");
    expect((await database.getBookProgress(readerId, bookId))?.currentVersionId).toBe(pendingId); // still stuck

    await promotePendingProgress(readerId, pendingId);
    expect((await database.getBookProgress(readerId, bookId))?.currentVersionId).toBe(ready!.id);
    expect((await database.openBook(readerId, bookId))?.version).toEqual(ready);

    // Idempotent: calling again (e.g. a second retry, or recovery after a crash) does not error or move progress again.
    await promotePendingProgress(readerId, pendingId);
    expect((await database.getBookProgress(readerId, bookId))?.currentVersionId).toBe(ready!.id);
  });
});

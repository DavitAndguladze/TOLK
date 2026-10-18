import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { and, asc, eq, isNull } from "drizzle-orm";
import vocabulary from "../data/vocabulary/english-2018.json" with { type: "json" };
import gatsbySource from "../data/gatsby/content.json" with { type: "json" };
import { MAX_OFFLINE_GENERATION_ATTEMPTS, verifyChapterArtifact, type GeneratedChapter } from "../leveling/generator";
import type { GatsbySeed } from "../leveling/seed";
import type { IngestedChapterPolicy } from "../leveling/ingestion";
import type { ChapterVersion, Level, NextChapterInput } from "../types";
import { db, getBook, getChapter, getChapterVersion, loadContent, type DatabaseConnection } from ".";
import { books, chapterArtifacts, chapterChecks, chapterGenerations, chapterPolicies, chapterVersions, chapters } from "./schema";

export { getChapter, getChapterVersion } from ".";

export interface GenerationDescriptor {
  id: string;
  readerId: string;
  bookId: string;
  chapterNumber: number;
  level: Level;
  baselineVersionId: string;
  status: "pending" | "ready" | "failed";
  artifact: GeneratedChapter | null;
}

/** One saved completion has one stable pending identity, including failed retries. */
export async function startGeneration(readerId: string, bookId: string, chapterNumber: number, level: Level, baselineVersionId: string, connection: DatabaseConnection = db()): Promise<string> {
  const [preceding] = await connection.select({ data: chapterVersions.data }).from(chapterVersions).where(eq(chapterVersions.id, baselineVersionId));
  const [original] = await connection.select({ data: chapters.data }).from(chapters).where(and(eq(chapters.bookId, bookId), eq(chapters.number, chapterNumber)));
  const baseline = preceding?.data, chapter = original?.data;
  if (!readerId.trim() || !chapter || !baseline || baseline.status !== "ready" || baseline.bookId !== bookId
    || baseline.chapterNumber + 1 !== chapterNumber || (baseline.readerId !== null && baseline.readerId !== readerId)
    || ![1, 2, 3, 4, 5].includes(level) || Math.abs(level - baseline.level) > 1) {
    throw new Error("Invalid generation target or preceding baseline");
  }
  await connection.insert(chapterGenerations).ignore().values({ id: `pending-${randomUUID()}`, readerId, bookId, chapterNumber, level, baselineVersionId });
  const [row] = await connection.select().from(chapterGenerations).where(and(eq(chapterGenerations.readerId, readerId), eq(chapterGenerations.baselineVersionId, baselineVersionId)));
  if (!row || row.bookId !== bookId || row.chapterNumber !== chapterNumber || row.level !== level) throw new Error("Conflicting generation for this saved baseline");
  return row.id;
}

export async function resolveGeneration(readerId: string, pendingId: string): Promise<GenerationDescriptor | null> {
  const [row] = await db().select().from(chapterGenerations).where(and(eq(chapterGenerations.id, pendingId), eq(chapterGenerations.readerId, readerId)));
  if (!row) return null;
  let artifact: GeneratedChapter | null = null;
  if (row.status === "ready" && row.artifactVersionId) {
    const [saved] = await db().select().from(chapterArtifacts).where(eq(chapterArtifacts.versionId, row.artifactVersionId));
    artifact = saved?.data ?? null;
    if (artifact && row.provenance) artifact = { ...artifact, provenance: row.provenance };
  }
  return { id: row.id, readerId, bookId: row.bookId, chapterNumber: row.chapterNumber, level: row.level,
    baselineVersionId: row.baselineVersionId, status: row.status, artifact };
}

/** The stable pending identity resolves to the exact immutable artifact when ready. */
export async function getGenerationVersion(readerId: string, pendingId: string): Promise<ChapterVersion | null> {
  const pending = await resolveGeneration(readerId, pendingId);
  if (!pending) return null;
  if (pending.artifact) return pending.artifact.version;
  const [original, baseline] = await Promise.all([getChapter(pending.bookId, pending.chapterNumber), getChapterVersion(pending.baselineVersionId)]);
  if (!original || !baseline) return null;
  return { ...baseline, id: pending.id, readerId, chapterId: original.id, chapterNumber: original.number,
    level: pending.level, status: pending.status === "failed" ? "failed" : "generating", text: "", sentences: [], tokens: [],
    reinforcedWords: [], baselineVersionId: baseline.id };
}

/** The 20-second generator can be reclaimed after 30 seconds if its server process died. */
export async function claimGeneration(readerId: string, pendingId: string): Promise<string | null> {
  return db().transaction(async (tx) => {
    const [row] = await tx.select().from(chapterGenerations).where(and(eq(chapterGenerations.id, pendingId), eq(chapterGenerations.readerId, readerId))).for("update");
    if (!row || row.status === "ready" || (row.status === "pending" && row.claimToken && Date.now() - row.updatedAt.getTime() < 30_000)) return null;
    const claimToken = randomUUID();
    await tx.update(chapterGenerations).set({ status: "pending", claimToken, updatedAt: new Date() }).where(eq(chapterGenerations.id, pendingId));
    return claimToken;
  });
}

export async function getChapterPolicy(chapterId: string): Promise<IngestedChapterPolicy | null> {
  const [row] = await db().select().from(chapterPolicies).where(eq(chapterPolicies.chapterId, chapterId));
  return row?.data ?? null;
}

export async function getFallbackArtifact(bookId: string, chapterNumber: number, level: Level): Promise<GeneratedChapter | null> {
  const [row] = await db().select({ data: chapterArtifacts.data }).from(chapterArtifacts)
    .innerJoin(chapterVersions, eq(chapterVersions.id, chapterArtifacts.versionId))
    .where(and(eq(chapterVersions.bookId, bookId), eq(chapterVersions.chapterNumber, chapterNumber), eq(chapterVersions.level, level), isNull(chapterVersions.readerId)))
    .orderBy(asc(chapterArtifacts.versionId)).limit(1);
  return row?.data ?? null;
}

function same(left: unknown, right: unknown): boolean {
  if (left === undefined || right === undefined) return left === right;
  return isDeepStrictEqual(JSON.parse(JSON.stringify(left)), JSON.parse(JSON.stringify(right)));
}

function assertSame(left: unknown, right: unknown, identity = "content identity"): void {
  if (!same(left, right)) throw new Error(`Immutable ${identity} already contains different data; use a new reviewed Book/Chapter namespace instead of replacing served content`);
}

function verifyProvenance({ version, provenance }: GeneratedChapter, maxAttempts = 2): void {
  if (!provenance || !Number.isInteger(provenance.attempts) || provenance.attempts < 1 || provenance.attempts > maxAttempts
    || !["live", "pre-generated", "original"].includes(provenance.source)
    || provenance.personalized !== (version.readerId !== null && version.level !== 5)
    || (provenance.source === "live" && (version.readerId === null || version.level === 5))
    || (provenance.source === "original" && version.level !== 5)
    || (provenance.source === "pre-generated" && version.readerId !== null)
    || (provenance.fallbackReason !== undefined && (provenance.source !== "pre-generated" || !["timeout", "generation-failed"].includes(provenance.fallbackReason)))) {
    throw new Error("Invalid Chapter artifact provenance");
  }
}

/** Ready linkage, Version, Check and full fidelity artifact commit together. Late attempts write nothing. */
export async function saveGeneratedChapter(pendingId: string, artifact: GeneratedChapter, claimToken: string, input?: NextChapterInput): Promise<boolean> {
  return db().transaction(async (tx) => {
    const [row] = await tx.select().from(chapterGenerations).where(eq(chapterGenerations.id, pendingId)).for("update");
    if (!row || row.status !== "pending" || !claimToken || row.claimToken !== claimToken) return false;
    verifyProvenance(artifact);
    const { version, check } = artifact;
    const [source] = await tx.select().from(chapters).where(and(eq(chapters.bookId, row.bookId), eq(chapters.number, row.chapterNumber)));
    const [rules] = await tx.select().from(chapterPolicies).where(eq(chapterPolicies.chapterId, version.chapterId));
    const [preceding] = await tx.select().from(chapterVersions).where(eq(chapterVersions.id, row.baselineVersionId));
    const original = source?.data, policy = rules?.data, baseline = preceding?.data;
    if (!original || !policy || !baseline || version.status !== "ready" || version.bookId !== row.bookId || version.chapterNumber !== row.chapterNumber || version.level !== row.level) throw new Error("Artifact does not match its pending generation");
    if (version.readerId !== null && (!input || input.readerId !== row.readerId || input.baseline.id !== row.baselineVersionId || input.decision.to !== row.level)) throw new Error("Live artifact requires its generation input");
    if (version.readerId === null && (version.reinforcedWords.length || artifact.provenance.personalized)) throw new Error("Shared fallback cannot contain personalization");
    verifyChapterArtifact(artifact, { original, level: row.level, readerId: version.readerId === null ? null : row.readerId,
      baseline: version.readerId === null ? undefined : baseline, wordBank: version.readerId === null ? [] : input!.wordBank,
      graduatedWords: version.readerId === null ? [] : input!.graduatedWords, reinforcement: version.readerId === null ? "plain" : input!.decision.reinforcement }, { ...policy, vocabulary });
    await tx.insert(chapterVersions).ignore().values({ id: version.id, readerId: version.readerId, bookId: version.bookId, chapterNumber: version.chapterNumber, level: version.level, data: version });
    await tx.insert(chapterChecks).ignore().values({ id: check.id, chapterVersionId: version.id, data: check });
    await tx.insert(chapterArtifacts).ignore().values({ versionId: version.id, data: artifact });
    const [savedVersion] = await tx.select().from(chapterVersions).where(eq(chapterVersions.id, version.id));
    const [savedCheck] = await tx.select().from(chapterChecks).where(eq(chapterChecks.chapterVersionId, version.id));
    const [savedArtifact] = await tx.select().from(chapterArtifacts).where(eq(chapterArtifacts.versionId, version.id));
    assertSame(savedVersion?.data, version);
    assertSame(savedCheck?.data, check);
    assertSame({ ...savedArtifact?.data, provenance: undefined }, { ...artifact, provenance: undefined });
    await tx.update(chapterGenerations).set({ status: "ready", artifactVersionId: version.id, provenance: artifact.provenance, claimToken: null, updatedAt: new Date() }).where(eq(chapterGenerations.id, pendingId));
    return true;
  });
}

export async function failGeneration(pendingId: string, claimToken: string): Promise<boolean> {
  const [result] = await db().update(chapterGenerations).set({ status: "failed", claimToken: null, updatedAt: new Date() })
    .where(and(eq(chapterGenerations.id, pendingId), eq(chapterGenerations.status, "pending"), eq(chapterGenerations.claimToken, claimToken)));
  return result.affectedRows === 1;
}

/** Loads only the checked-in, source-reviewed metadata. No ready Versions or Checks are created. */
export async function loadGatsbySource(): Promise<void> {
  const existingBook = await getBook(gatsbySource.book.id);
  if (existingBook) assertSame(existingBook, gatsbySource.book, `Book ${gatsbySource.book.id}`);
  for (const chapter of gatsbySource.chapters) {
    const existing = await getChapter(chapter.bookId, chapter.number);
    if (existing) assertSame(existing, chapter, `Chapter ${chapter.id}`);
  }
  await loadContent({ books: [gatsbySource.book], chapters: gatsbySource.chapters, versions: [] });
  await db().transaction(async (tx) => {
    for (const chapter of gatsbySource.chapters) {
      const data = (gatsbySource.policies as Record<string, IngestedChapterPolicy>)[chapter.id];
      await tx.insert(chapterPolicies).ignore().values({ chapterId: chapter.id, data });
      const [stored] = await tx.select().from(chapterPolicies).where(eq(chapterPolicies.chapterId, chapter.id));
      assertSame(stored?.data, data);
    }
  });
}

/** Validate both attestations, retain the first identical shared artifact, and publish the entire seed atomically. */
export async function loadGatsbySeed(seed: GatsbySeed): Promise<void> {
  const artifacts = [seed.sharedChapterOne, ...seed.fallbacks];
  const expected = ["1:1", ...[2, 3].flatMap((chapter) => [1, 2, 3, 4, 5].map((level) => `${chapter}:${level}`)), "4:1", "4:2"];
  if (artifacts.length !== expected.length || new Set(artifacts.map(({ version }) => `${version.chapterNumber}:${version.level}`)).size !== expected.length
    || artifacts.some(({ version }) => !expected.includes(`${version.chapterNumber}:${version.level}`))
    || seed.sharedChapterOne.version.chapterNumber !== 1 || seed.sharedChapterOne.version.level !== 1) throw new Error("Incomplete Gatsby seed artifacts");
  function validateShared(artifact: GeneratedChapter): void {
    verifyProvenance(artifact, MAX_OFFLINE_GENERATION_ATTEMPTS);
    const { version } = artifact;
    const chapter = seed.content.chapters.find((candidate) => candidate.id === version.chapterId);
    const policy = seed.content.policies[version.chapterId];
    if (!chapter || !policy || chapter.bookId !== seed.content.book.id || version.status !== "ready" || version.readerId !== null || version.reinforcedWords.length || artifact.provenance.personalized) throw new Error("Invalid shared seed artifact");
    verifyChapterArtifact(artifact, { original: chapter, level: version.level, readerId: null, wordBank: [], graduatedWords: [], reinforcement: "plain" }, { ...policy, vocabulary });
  }
  artifacts.forEach(validateShared);
  await db().transaction(async (tx) => {
    // These content inserts share the artifact transaction: a later collision must publish nothing.
    const book = seed.content.book;
    await tx.insert(books).ignore().values({ id: book.id, title: book.title, author: book.author, data: book });
    const [storedBook] = await tx.select().from(books).where(eq(books.id, book.id));
    assertSame(storedBook?.data, book, `Book ${book.id}`);
    for (const chapter of seed.content.chapters) {
      await tx.insert(chapters).ignore().values({ id: chapter.id, bookId: chapter.bookId, number: chapter.number, data: chapter });
      const [storedChapter] = await tx.select().from(chapters).where(and(eq(chapters.bookId, chapter.bookId), eq(chapters.number, chapter.number)));
      assertSame(storedChapter?.data, chapter, `Chapter ${chapter.id}`);
      const data = seed.content.policies[chapter.id];
      if (!data) throw new Error("Missing stored Chapter policy");
      await tx.insert(chapterPolicies).ignore().values({ chapterId: chapter.id, data });
      const [stored] = await tx.select().from(chapterPolicies).where(eq(chapterPolicies.chapterId, chapter.id));
      assertSame(stored?.data, data);
    }
    for (const artifact of artifacts) {
      const { version, check } = artifact;
      await tx.insert(chapterVersions).ignore().values({ id: version.id, readerId: version.readerId, bookId: version.bookId, chapterNumber: version.chapterNumber, level: version.level, data: version });
      await tx.insert(chapterChecks).ignore().values({ id: check.id, chapterVersionId: version.id, data: check });
      await tx.insert(chapterArtifacts).ignore().values({ versionId: version.id, data: artifact });
      const [stored] = await tx.select().from(chapterArtifacts).where(eq(chapterArtifacts.versionId, version.id));
      validateShared(stored.data);
      // A regenerated shared identity may have a new timestamp and a new valid attestation.
      // Only that timestamp is excluded from reading equality; the whole Check must match.
      assertSame({ ...stored.data.version, generatedAt: undefined }, { ...version, generatedAt: undefined });
      assertSame(stored.data.check, check);
      const [storedVersion] = await tx.select().from(chapterVersions).where(eq(chapterVersions.id, version.id));
      const [storedCheck] = await tx.select().from(chapterChecks).where(eq(chapterChecks.chapterVersionId, version.id));
      assertSame(storedVersion?.data, stored.data.version);
      assertSame(storedCheck?.data, stored.data.check);
    }
  });
}

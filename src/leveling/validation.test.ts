import { expect, test } from "vitest";
import type { Chapter, ChapterCheck, ChapterVersion, NextChapterInput } from "../types";
import { buildChapterVersion } from "./content.ts";
import { tokenize } from "../mocks/fixtures.ts";
import { validateChapterCheck, validateChapterVersion, type ChapterCheckEvidence, type ContentValidationPolicy } from "./validation.ts";

const chapter: Chapter = {
  id: "gatsby-ch2", bookId: "gatsby", number: 2, title: "Chapter 2",
  originalText: "Nick felt vulnerable at Tom's house. Tom gave Nick advice. Nick kept that advice.",
  keyPoints: [
    { id: "kp1", chapterId: "gatsby-ch2", text: "Nick felt vulnerable at Tom's house." },
    { id: "kp2", chapterId: "gatsby-ch2", text: "Tom gave Nick advice." },
    { id: "kp3", chapterId: "gatsby-ch2", text: "Nick kept that advice." },
  ],
  complexWords: [{ word: "vulnerable", meaning: "easily hurt" }],
};

function setup() {
  const version = buildChapterVersion(chapter, {
    level: 1, levelScore: 10,
    sentences: [
      { text: "Nick felt vulnerable at Tom's house.", originalSentenceIndex: 0 },
      { text: "Tom gave Nick advice.", originalSentenceIndex: 1 },
      { text: "Nick kept that advice.", originalSentenceIndex: 2 },
    ],
    reinforcedWords: [{ word: "advice", reinforcement: "plain", sentenceIndex: 1 }],
  }, { id: "version-2", readerId: "reader-1", level: 1, baselineVersionId: "version-1", generatedAt: "2026-10-18T00:00:00Z" });
  const input: NextChapterInput = {
    original: chapter,
    baseline: { ...version, id: "version-1", chapterId: "gatsby-ch1", chapterNumber: 1, status: "ready", baselineVersionId: null },
    decision: { from: 1, to: 1, reason: "barely-passed", explanation: "Hold", reinforcement: "plain" },
    readerId: "reader-1", graduatedWords: ["vulnerable"],
    wordBank: [{ word: "advice", source: "flagged", timesSeen: 1, graduated: false, addedInChapter: 1, graduatedInChapter: null }],
  };
  const policy: ContentValidationPolicy = {
    vocabulary: { source: "test-only ranked vocabulary", ranks: { felt: 100, at: 10, house: 200, gave: 300, advice: 400, kept: 500, that: 20 } },
    requiredNames: ["Nick", "Tom"], retainedWords: [],
    keyPointEvidence: { source: "independent test fixture review", points: [
      { keyPointId: "kp1", sentenceIndex: 0, quote: "Nick felt vulnerable" },
      { keyPointId: "kp2", sentenceIndex: 1, quote: "Tom gave Nick advice" },
      { keyPointId: "kp3", sentenceIndex: 2, quote: "Nick kept that advice" },
    ] },
  };
  return { version, input, policy };
}

test("accepts a mapped requested-Level version without claiming semantic fidelity", () => {
  const { version, input, policy } = setup();
  expect(validateChapterVersion(version, input, policy)).toEqual({ valid: true, issues: [], semanticReviewRequired: true });
});

test.each([
  ["bookId", "wrong-book"], ["chapterId", "wrong-chapter"], ["chapterNumber", 3],
  ["readerId", "other-reader"], ["baselineVersionId", "other-version"], ["level", 2],
  ["levelScore", Infinity], ["generatedAt", "yesterday"], ["status", "failed"],
] as const)("rejects mismatched or invalid %s", (field, value) => {
  const { version, input, policy } = setup();
  expect(validateChapterVersion({ ...version, [field]: value }, input, policy).valid).toBe(false);
});

test.each([null, {}, { sentences: [null] }, { tokens: "words" }])("rejects malformed untrusted versions: %j", (version) => {
  const { input, policy } = setup();
  expect(validateChapterVersion(version, input, policy).valid).toBe(false);
});

test.each([
  (version: ChapterVersion) => { version.tokens[0].index = 99; },
  (version: ChapterVersion) => { version.tokens[0].normalized = "tom"; },
  (version: ChapterVersion) => { version.tokens[0].sentenceIndex = 2; },
  (version: ChapterVersion) => { version.tokens.pop(); },
  (version: ChapterVersion) => { version.sentences[0].index = 5; },
  (version: ChapterVersion) => { version.sentences[0].originalText = "Invented original."; },
  (version: ChapterVersion) => { version.sentences[1].originalText = version.sentences[0].originalText; },
  (version: ChapterVersion) => { version.text += " Added plot."; },
])("rejects broken tokens, original mappings, or text without repairing served indexes", (corrupt) => {
  const { version, input, policy } = setup();
  corrupt(version);
  const before = JSON.stringify(version);
  expect(validateChapterVersion(version, input, policy).valid).toBe(false);
  expect(JSON.stringify(version)).toBe(before);
});

test("rejects a two-Level jump even when it matches the supplied target", () => {
  const { version, input, policy } = setup();
  input.decision.to = 3;
  version.level = 3;
  expect(validateChapterVersion(version, input, policy).issues).toContainEqual(expect.objectContaining({ code: "level" }));
});

test("rejects a baseline from another Book or Reader, or a nonpreceding Chapter", () => {
  for (const change of [{ bookId: "other-book" }, { readerId: "other-reader" }, { chapterNumber: 2 }]) {
    const { version, input, policy } = setup();
    Object.assign(input.baseline, change);
    expect(validateChapterVersion(version, input, policy).valid).toBe(false);
  }
});

test("validates a shared first Chapter without inventing a baseline", () => {
  const { version, policy } = setup();
  const original = { ...chapter, number: 1 };
  Object.assign(version, { chapterNumber: 1, readerId: null, baselineVersionId: null, reinforcedWords: [] });
  expect(validateChapterVersion(version, {
    original, level: 1, readerId: null, graduatedWords: ["vulnerable"], wordBank: [], reinforcement: "plain",
  }, policy).valid).toBe(true);
});

function replaceSentence(version: ChapterVersion, index: number, text: string) {
  version.sentences[index].text = text;
  version.text = version.sentences.map((row) => row.text).join(" ");
  version.tokens = tokenize(version.sentences.map((row) => row.text));
}

test.each([
  ["unknown word", undefined], ["rank beyond L1", 1001], ["invalid rank", -1],
] as const)("rejects vocabulary with %s", (_, rank) => {
  const { version, input, policy } = setup();
  policy.vocabulary.ranks = { ...policy.vocabulary.ranks, ...(rank === undefined ? {} : { kept: rank }) };
  if (rank === undefined) delete (policy.vocabulary.ranks as Record<string, number>).kept;
  expect(validateChapterVersion(version, input, policy).issues).toContainEqual(expect.objectContaining({ code: "vocabulary" }));
});

test("requires an explicit frequency source instead of silently waiving vocabulary validation", () => {
  const { version, input, policy } = setup();
  policy.vocabulary.source = "";
  expect(validateChapterVersion(version, input, policy).issues).toContainEqual(expect.objectContaining({ code: "vocabulary" }));
});

test.each([
  { reinforcedWords: [] },
  { reinforcedWords: [{ word: "vulnerable", reinforcement: "inline-definition", sentenceIndex: 0 }] },
  { reinforcedWords: [{ word: "vulnerable", reinforcement: "plain", sentenceIndex: 1 }] },
])("does not exempt an unreinforced or incorrectly referenced bank word: %j", ({ reinforcedWords }) => {
  const { version, input, policy } = setup();
  input.graduatedWords = [];
  input.wordBank = [{ word: "vulnerable", source: "flagged", timesSeen: 1, graduated: false, addedInChapter: 1, graduatedInChapter: null }];
  policy.vocabulary.ranks = { ...policy.vocabulary.ranks, vulnerable: 4491 };
  expect(validateChapterVersion({ ...version, reinforcedWords }, input, policy).issues)
    .toContainEqual(expect.objectContaining({ code: "vocabulary" }));
});

test("does not exempt an unrelated unknown word alongside supported reinforcement", () => {
  const { version, input, policy } = setup();
  replaceSentence(version, 1, "Tom gave Nick advice mystifyingly.");
  expect(validateChapterVersion(version, input, policy).issues)
    .toContainEqual(expect.objectContaining({ code: "vocabulary", message: expect.stringContaining("mystifyingly") }));
});

test("uses the LevelSpec sentence limit, including exactly ten words at L1", () => {
  const { version, input, policy } = setup();
  replaceSentence(version, 2, "Nick kept that advice that Nick kept that advice that.");
  expect(validateChapterVersion(version, input, policy).valid).toBe(true);
  replaceSentence(version, 2, "Nick kept that advice that Nick kept that advice that Nick.");
  expect(validateChapterVersion(version, input, policy).issues).toContainEqual(expect.objectContaining({ code: "sentence-length" }));
});

test("rejects changed proper names even when the model claims fidelity", () => {
  const { version, input, policy } = setup();
  version.sentences.forEach((row, index) => replaceSentence(version, index, row.text.replaceAll("Nick", "Jack")));
  expect(validateChapterVersion({ ...version, namesPreserved: true }, input, policy).issues)
    .toContainEqual(expect.objectContaining({ code: "names" }));
});

test("retains Graduated Words in their mapped original passages, not merely elsewhere in the Chapter", () => {
  const { version, input, policy } = setup();
  replaceSentence(version, 0, "Nick felt sad at Tom's house.");
  replaceSentence(version, 2, "Nick kept that advice and felt vulnerable.");
  expect(validateChapterVersion(version, input, policy).issues).toContainEqual(expect.objectContaining({ code: "graduated-word" }));
});

test("requires cited served-text evidence for every Key Point", () => {
  for (const change of ["missing", "absent-quote", "invalid-index", "no-source"] as const) {
    const { version, input, policy } = setup();
    if (change === "missing") policy.keyPointEvidence.points = policy.keyPointEvidence.points.slice(1);
    if (change === "absent-quote") policy.keyPointEvidence.points[0].quote = "This is not in the served text";
    if (change === "invalid-index") policy.keyPointEvidence.points[0].sentenceIndex = 20;
    if (change === "no-source") policy.keyPointEvidence.source = "";
    expect(validateChapterVersion(version, input, policy).issues).toContainEqual(expect.objectContaining({ code: "key-point-evidence" }));
  }
});

test("rejects a rewritten L5 even when its tokens and mappings agree", () => {
  const { input, policy } = setup();
  input.baseline.level = 4;
  input.decision = { ...input.decision, from: 4, to: 5 };
  const version = buildChapterVersion(chapter, null, {
    id: "version-2", readerId: "reader-1", level: 5, baselineVersionId: "version-1", generatedAt: "2026-10-18T00:00:00Z",
  });
  expect(validateChapterVersion(version, input, policy).valid).toBe(true);
  replaceSentence(version, 0, "Nick felt vulnerable at Tom's home.");
  expect(validateChapterVersion(version, input, policy).issues).toContainEqual(expect.objectContaining({ code: "original" }));
});

test.each([
  { word: "absent", reinforcement: "plain", sentenceIndex: 1 },
  { word: "vulnerable", reinforcement: "plain", sentenceIndex: 0 },
  { word: "advice", reinforcement: "inline-definition", sentenceIndex: 1 },
  { word: "advice", reinforcement: "plain", sentenceIndex: 0 },
  { word: "advice", reinforcement: "plain", sentenceIndex: -1 },
])("rejects unsupported reinforcement metadata: %j", (reinforcedWord) => {
  const { version, input, policy } = setup();
  expect(validateChapterVersion({ ...version, reinforcedWords: [reinforcedWord] }, input, policy).issues)
    .toContainEqual(expect.objectContaining({ code: "reinforcement" }));
});

function matchingCheck(): { check: ChapterCheck; evidence: ChapterCheckEvidence } {
  return {
    check: { id: "check-2", chapterVersionId: "version-2", questions: [
      { id: "q1", kind: "key-point", keyPointId: "kp1", prompt: "How did Nick feel?", answerSentenceIndex: 0 },
      { id: "q2", kind: "key-point", keyPointId: "kp2", prompt: "What did Tom give Nick?", answerSentenceIndex: 1 },
      { id: "q3", kind: "complex-word", word: "vulnerable", prompt: "What does vulnerable mean here?", choices: ["easily hurt", "very tall", "angry"], answerSentenceIndex: 0 },
    ] },
    evidence: { source: "independent test fixture review", questions: [
      { questionId: "q1", sentenceIndex: 0, quote: "Nick felt vulnerable" },
      { questionId: "q2", sentenceIndex: 1, quote: "Tom gave Nick advice" },
      { questionId: "q3", sentenceIndex: 0, quote: "Nick felt vulnerable" },
    ] },
  };
}

test("accepts a matching Check with answer evidence in the served version", () => {
  const { version } = setup();
  const { check, evidence } = matchingCheck();
  expect(validateChapterCheck(check, chapter, version, evidence)).toEqual({ valid: true, issues: [], semanticReviewRequired: true });
});

test.each([
  (check: ChapterCheck) => { check.chapterVersionId = "wrong-version"; },
  (check: ChapterCheck) => { check.questions[0].id = "q2"; },
  (check: ChapterCheck) => { check.questions[0].answerSentenceIndex = 10; },
  (check: ChapterCheck) => { check.questions[0].keyPointId = "missing-point"; },
  (check: ChapterCheck) => { check.questions[0].prompt = " "; },
  (check: ChapterCheck) => { check.questions[2].word = "unknown"; },
  (check: ChapterCheck) => { check.questions[2].answerSentenceIndex = 1; },
  (check: ChapterCheck) => { check.questions[2].choices = ["wrong", "also wrong"]; },
  (check: ChapterCheck) => { check.questions[2].choices = ["easily hurt", "easily hurt"]; },
  (check: ChapterCheck) => { check.questions.pop(); },
  (check: ChapterCheck) => { check.questions.shift(); },
])("rejects a Check with inconsistent identities, questions, or evidence", (corrupt) => {
  const { version } = setup();
  const { check, evidence } = matchingCheck();
  corrupt(check);
  expect(validateChapterCheck(check, chapter, version, evidence).valid).toBe(false);
});

test("does not accept a word that exists only in the original-sentence mapping", () => {
  const { version } = setup();
  const { check, evidence } = matchingCheck();
  replaceSentence(version, 0, "Nick felt sad at Tom's house.");
  evidence.questions[0].quote = "Nick felt sad";
  evidence.questions[2].quote = "Nick felt sad";
  expect(validateChapterCheck(check, chapter, version, evidence).issues).toContainEqual(expect.objectContaining({ code: "question-word" }));
});

test.each([null, {}, { id: "check", chapterVersionId: "version-2", questions: [null] }])("rejects malformed untrusted Checks: %j", (check) => {
  const { version } = setup();
  const { evidence } = matchingCheck();
  expect(validateChapterCheck(check, chapter, version, evidence).valid).toBe(false);
});

test("requires independent Check evidence matching each question's actual answer sentence", () => {
  const { version } = setup();
  for (const change of ["missing", "wrong-quote", "wrong-sentence", "no-source"] as const) {
    const { check, evidence } = matchingCheck();
    if (change === "missing") evidence.questions = evidence.questions.slice(1);
    if (change === "wrong-quote") evidence.questions[0].quote = "Not in the text";
    if (change === "wrong-sentence") evidence.questions[0].sentenceIndex = 1;
    if (change === "no-source") evidence.source = "";
    expect(validateChapterCheck(check, chapter, version, evidence).issues).toContainEqual(expect.objectContaining({ code: "question-evidence" }));
  }
});

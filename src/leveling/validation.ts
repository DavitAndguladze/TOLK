import { LEVEL_SPECS, tokenize } from "../mocks/fixtures.ts";
import type { Chapter, ChapterCheck, ChapterVersion, Level, NextChapterInput, Reinforcement, WordBankEntry } from "../types";
import { splitOriginalSentences } from "./content.ts";

export interface ChapterVersionContext {
  original: Chapter;
  level: Level;
  readerId: string | null;
  baseline?: ChapterVersion;
  graduatedWords: readonly string[];
  wordBank: readonly WordBankEntry[];
  reinforcement: Reinforcement;
}

export interface ContentValidationPolicy {
  /** Pinned frequency ranks; numeric quantities/dates are not English vocabulary words. */
  vocabulary: { source: string; ranks: Readonly<Record<string, number>> };
  requiredNames: readonly string[];
  /** Explicit vocabulary exemptions, alongside proper names and Graduated Words. */
  retainedWords: readonly string[];
  /** Separately supplied evidence, never the generator's self-reported validity flag. */
  keyPointEvidence: {
    source: string;
    points: readonly { keyPointId: string; sentenceIndex: number; quote: string }[];
  };
}

export interface ValidationResult {
  /** Structural and evidence consistency only. A separate fidelity review gates readiness. */
  valid: boolean;
  issues: { code: string; message: string }[];
  semanticReviewRequired: true;
}

export interface ChapterCheckEvidence {
  source: string;
  questions: readonly { questionId: string; sentenceIndex: number; quote: string }[];
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function words(text: string): string[] {
  return tokenize([text]).map((token) => token.normalized).filter(Boolean);
}

function wordCount(text: string, word: string): number {
  const target = words(word);
  const haystack = words(text);
  return target.length ? haystack.filter((_, index) => target.every((part, offset) => haystack[index + offset] === part)).length : 0;
}

function hasName(text: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "u").test(text);
}

function versionShape(value: unknown): value is ChapterVersion {
  if (!record(value)) return false;
  return nonempty(value.id) && nonempty(value.bookId) && nonempty(value.chapterId)
    && (value.readerId === null || nonempty(value.readerId))
    && (value.baselineVersionId === null || nonempty(value.baselineVersionId))
    && typeof value.level === "number" && [1, 2, 3, 4, 5].includes(value.level)
    && typeof value.levelScore === "number" && Number.isFinite(value.levelScore) && value.levelScore >= 0 && value.levelScore <= 100
    && Number.isInteger(value.chapterNumber) && Number(value.chapterNumber) > 0
    && (value.status === "ready" || value.status === "generating")
    && nonempty(value.generatedAt) && Number.isFinite(Date.parse(value.generatedAt)) && nonempty(value.text)
    && Array.isArray(value.sentences) && value.sentences.length > 0 && value.sentences.every((row) => record(row)
      && Number.isInteger(row.index) && nonempty(row.text) && nonempty(row.originalText))
    && Array.isArray(value.tokens) && value.tokens.length > 0 && value.tokens.every((row) => record(row)
      && Number.isInteger(row.index) && nonempty(row.text) && typeof row.normalized === "string" && Number.isInteger(row.sentenceIndex))
    && Array.isArray(value.reinforcedWords) && value.reinforcedWords.every((row) => record(row)
      && nonempty(row.word) && (row.reinforcement === "plain" || row.reinforcement === "context-clue" || row.reinforcement === "inline-definition")
      && Number.isInteger(row.sentenceIndex));
}

export function validateChapterVersion(
  value: unknown,
  input: NextChapterInput | ChapterVersionContext,
  policy: ContentValidationPolicy,
): ValidationResult {
  const issues: ValidationResult["issues"] = [];
  const issue = (code: string, message: string) => { issues.push({ code, message }); };
  if (!versionShape(value)) return { valid: false, issues: [{ code: "structure", message: "Malformed Chapter Version" }], semanticReviewRequired: true };
  const context: ChapterVersionContext = "decision" in input
    ? { ...input, level: input.decision.to, reinforcement: input.decision.reinforcement }
    : input;
  const { original, baseline } = context;
  if (value.bookId !== original.bookId || value.chapterId !== original.id || value.chapterNumber !== original.number
    || value.readerId !== context.readerId || value.baselineVersionId !== (baseline?.id ?? null)) {
    issue("identity", "Chapter Version identity does not match the requested Chapter, Reader, or baseline");
  }
  if (value.level !== context.level) issue("level", "Chapter Version does not match the requested Level");
  if (baseline && (Math.abs(value.level - baseline.level) > 1
    || ("decision" in input && input.decision.from !== baseline.level))) {
    issue("level", "Level decision must start at the baseline and move at most one Level");
  }
  if (baseline && (baseline.bookId !== original.bookId || baseline.chapterNumber !== original.number - 1
    || baseline.chapterId === original.id || baseline.status !== "ready"
    || (baseline.readerId !== null && baseline.readerId !== context.readerId))) {
    issue("baseline", "Baseline must be the preceding ready Chapter for the same Book and Reader");
  }
  const sourceSentences = splitOriginalSentences(original.originalText);
  // shortcut: shared Sentence stores source text, so identical source spans remain ambiguous until source indexes join that contract.
  let sourceIndex = -1;
  for (const [index, sentence] of value.sentences.entries()) {
    if (sentence.index !== index) issue("sentences", "Sentence indexes must be contiguous and stable");
    if (sentence.originalText === sourceSentences[sourceIndex + 1]) sourceIndex += 1;
    else if (sentence.originalText !== sourceSentences[sourceIndex]) issue("mapping", "Original sentence mappings must cover the Chapter in order");
  }
  if (!sourceSentences.length || sourceIndex !== sourceSentences.length - 1) issue("mapping", "Original sentence mappings omit part of the Chapter");
  if (value.text.replace(/\s+/g, " ").trim() !== value.sentences.map((sentence) => sentence.text).join(" ").replace(/\s+/g, " ").trim()) {
    issue("text", "Served text does not match the Chapter sentences");
  }
  const expectedTokens = tokenize(value.sentences.map((sentence) => sentence.text));
  if (value.tokens.length !== expectedTokens.length || expectedTokens.some((token, index) => {
    const actual = value.tokens[index];
    return !actual || actual.index !== token.index || actual.text !== token.text
      || actual.normalized !== token.normalized || actual.sentenceIndex !== token.sentenceIndex;
  })) issue("tokens", "Tokens must match served sentences with unchanged global indexes");
  const reinforced = new Set<string>();
  for (const word of value.reinforcedWords) {
    const normalized = words(word.word).join(" ");
    const sentence = value.sentences[word.sentenceIndex];
    if (!normalized || reinforced.has(normalized) || !sentence || !wordCount(sentence.text, word.word)
      || !context.wordBank.some((entry) => !entry.graduated && words(entry.word).join(" ") === normalized)
      || context.graduatedWords.some((entry) => words(entry).join(" ") === normalized)
      || word.reinforcement !== context.reinforcement) {
      issue("reinforcement", "Reinforcement must cite an active Word Bank word in its served sentence and match the requested support");
    } else {
      reinforced.add(normalized);
    }
  }
  const spec = LEVEL_SPECS[value.level];
  if (spec.maxSentenceWords !== null && value.sentences.some((sentence) => words(sentence.text).length > spec.maxSentenceWords!)) {
    issue("sentence-length", `Sentences exceed L${value.level}'s ${spec.maxSentenceWords}-word limit`);
  }
  if (spec.maxWordRank !== null) {
    if (!nonempty(policy.vocabulary?.source) || !record(policy.vocabulary?.ranks)) issue("vocabulary", "A named word-frequency source and its ranks are required");
    else {
      const exemptions = new Set([
        ...policy.requiredNames.flatMap((name) => words(`${name} ${name}'s ${name}’s`)),
        ...context.graduatedWords.flatMap(words), ...policy.retainedWords.flatMap(words),
        ...[...reinforced].flatMap(words),
      ]);
      const outsideTarget = [...new Set(expectedTokens.filter((token) =>
        !/^\d+(?:,\d{3})*(?:\.\d+)?$/.test(token.text.replace(/^["'“‘(]+|["'”’).,!?;:]+$/gu, "")))
        .map((token) => token.normalized).filter(Boolean))].filter((word) => {
        const rank = policy.vocabulary.ranks[word];
        return !exemptions.has(word) && (!Number.isInteger(rank) || rank < 1 || rank > spec.maxWordRank!);
      });
      if (outsideTarget.length) issue("vocabulary", `Words missing or outside the frequency target: ${outsideTarget.join(", ")}`);
    }
  }
  if (value.level === 5 && (value.text !== original.originalText || value.levelScore !== 100
    || value.sentences.length !== sourceSentences.length
    || value.sentences.some((sentence, index) => sentence.text !== sourceSentences[index]))) {
    issue("original", "L5 must serve the author's original text and sentences unchanged");
  }
  for (const source of new Set(sourceSentences)) {
    const rewritten = value.sentences.filter((sentence) => sentence.originalText === source).map((sentence) => sentence.text).join(" ");
    for (const name of policy.requiredNames) {
      if (hasName(source, name) && !hasName(rewritten, name)) issue("names", `Required name changed or omitted: ${name}`);
    }
    const occurrences = sourceSentences.filter((sentence) => sentence === source).length;
    for (const word of context.graduatedWords) {
      if (wordCount(rewritten, word) < wordCount(source, word) * occurrences) issue("graduated-word", `Graduated Word must remain in its original passage: ${word}`);
    }
  }
  const evidence = policy.keyPointEvidence;
  if (!nonempty(evidence?.source) || !Array.isArray(evidence?.points)) issue("key-point-evidence", "Key Point evidence must have a separate named source");
  else {
    const seen = new Set<string>();
    for (const point of evidence.points) {
      if (!point || !original.keyPoints.some((keyPoint) => keyPoint.id === point.keyPointId && keyPoint.chapterId === original.id)
        || seen.has(point.keyPointId) || !Number.isInteger(point.sentenceIndex) || !nonempty(point.quote)
        || !value.sentences[point.sentenceIndex]?.text.includes(point.quote)) {
        issue("key-point-evidence", "Key Point evidence must cite a real, unique Key Point and a quote in its served sentence");
      }
      if (point) seen.add(point.keyPointId);
    }
    if (original.keyPoints.some((keyPoint) => !seen.has(keyPoint.id))) issue("key-point-evidence", "Every Key Point needs served-text evidence");
  }
  return { valid: issues.length === 0, issues, semanticReviewRequired: true };
}

function checkShape(value: unknown): value is ChapterCheck {
  return record(value) && nonempty(value.id) && nonempty(value.chapterVersionId) && Array.isArray(value.questions)
    && value.questions.every((question) => record(question) && nonempty(question.id) && nonempty(question.prompt)
      && (question.kind === "key-point" || question.kind === "complex-word") && Number.isInteger(question.answerSentenceIndex)
      && (question.keyPointId === undefined || nonempty(question.keyPointId))
      && (question.word === undefined || nonempty(question.word))
      && (question.choices === undefined || (Array.isArray(question.choices) && question.choices.every(nonempty))));
}

/** Evidence quotes prove presence and reference consistency, not question answerability. */
export function validateChapterCheck(
  value: unknown,
  chapter: Chapter,
  version: ChapterVersion,
  evidence: ChapterCheckEvidence,
): ValidationResult {
  const issues: ValidationResult["issues"] = [];
  const issue = (code: string, message: string) => { issues.push({ code, message }); };
  if (!checkShape(value) || !versionShape(version)) {
    return { valid: false, issues: [{ code: "structure", message: "Malformed Chapter Check or Chapter Version" }], semanticReviewRequired: true };
  }
  if (value.chapterVersionId !== version.id || chapter.id !== version.chapterId || chapter.bookId !== version.bookId
    || chapter.number !== version.chapterNumber) issue("identity", "Chapter Check does not match the served Chapter Version");
  const keyPointQuestions = value.questions.filter((question) => question.kind === "key-point");
  const wordQuestions = value.questions.filter((question) => question.kind === "complex-word");
  if (keyPointQuestions.length < 2 || keyPointQuestions.length > 3 || wordQuestions.length < 1 || wordQuestions.length > 2) {
    issue("question-count", "Chapter Check needs 2-3 Key Point and 1-2 contextual vocabulary questions");
  }
  const ids = new Set<string>();
  const targets = new Set<string>();
  for (const question of value.questions) {
    if (ids.has(question.id)) issue("question-id", "Question ids must be unique");
    ids.add(question.id);
    const sentence = version.sentences.find((row) => row.index === question.answerSentenceIndex);
    if (!sentence) issue("question-reference", "Answer sentence must exist in the served Chapter Version");
    const target = `${question.kind}:${question.keyPointId ?? words(question.word ?? "").join(" ")}`;
    if (targets.has(target)) issue("question-target", "Questions must assess distinct Key Points and words");
    targets.add(target);
    if (question.kind === "key-point") {
      if (question.word !== undefined || !chapter.keyPoints.some((point) => point.id === question.keyPointId && point.chapterId === chapter.id)) {
        issue("question-key-point", "Question must reference a Key Point belonging to this Chapter");
      }
    } else {
      const complexWord = chapter.complexWords.find((word) => words(word.word).join(" ") === words(question.word ?? "").join(" "));
      if (!complexWord || question.keyPointId !== undefined || !sentence || !wordCount(sentence.text, question.word ?? "")) {
        issue("question-word", "Vocabulary question must target a Chapter Complex Word present in its served answer sentence");
      }
      if (!Array.isArray(question.choices) || question.choices.length < 2
        || new Set(question.choices.map((choice) => choice.trim().toLowerCase())).size !== question.choices.length
        || !complexWord || !question.choices.some((choice) => choice.trim() === complexWord.meaning.trim())) {
        issue("question-choices", "Vocabulary choices need the contextual meaning and distinct alternatives");
      }
    }
  }
  if (!nonempty(evidence?.source) || !Array.isArray(evidence?.questions)) issue("question-evidence", "Check evidence must have a separate named source");
  else {
    const seen = new Set<string>();
    for (const row of evidence.questions) {
      const question = row && value.questions.find((entry) => entry.id === row.questionId);
      if (!question || seen.has(row.questionId) || !Number.isInteger(row.sentenceIndex)
        || row.sentenceIndex !== question.answerSentenceIndex || !nonempty(row.quote)
        || !version.sentences.find((sentence) => sentence.index === row.sentenceIndex)?.text.includes(row.quote)) {
        issue("question-evidence", "Question evidence must quote its referenced served answer sentence");
      }
      if (row) seen.add(row.questionId);
    }
    if (value.questions.some((question) => !seen.has(question.id))) issue("question-evidence", "Every question needs served-text evidence");
  }
  return { valid: issues.length === 0, issues, semanticReviewRequired: true };
}

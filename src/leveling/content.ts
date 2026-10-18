import { tokenize } from "../mocks/fixtures.ts";
import type { Chapter, ChapterVersion, Level, ReinforcedWord } from "../types";

export interface ChapterVersionMetadata {
  id: string;
  readerId: string | null;
  level: Level;
  baselineVersionId: string | null;
  generatedAt: string;
}

export interface ChapterDraft {
  level: Level;
  levelScore: number;
  sentences: { text: string; originalSentenceIndex: number }[];
  reinforcedWords: ReinforcedWord[];
}

/** Use these same source rows in the generation prompt and original-sentence mappings. */
export function splitOriginalSentences(text: string): string[] {
  const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
  // Blank lines end paragraphs even without punctuation; single line breaks are physical wrapping.
  return text.replace(/\r\n?/g, "\n").split(/\n[\t ]*\n/).flatMap((paragraph) => {
    const sentences: string[] = [];
    let pending = "";
    for (const { segment } of segmenter.segment(paragraph.replace(/\s+/g, " ").trim())) {
      pending += segment;
      // shortcut: English titles/initials in Gatsby; revisit for other languages or ambiguous abbreviations.
      if (/(?:\b(?:Mr|Mrs|Ms|Dr|Prof|St)|\b[A-Z])\.\s*$/u.test(pending)) continue;
      if (pending.trim()) sentences.push(pending.trim());
      pending = "";
    }
    if (pending.trim()) sentences.push(pending.trim());
    return sentences;
  });
}

/** Assembly never marks a version ready; content, Check, and fidelity checks must run first. */
export function buildChapterVersion(
  chapter: Chapter,
  draft: unknown,
  metadata: ChapterVersionMetadata,
): ChapterVersion {
  const original = splitOriginalSentences(chapter.originalText);
  if (!original.length) throw new Error("Chapter original text is empty");
  if (metadata.level === 5) {
    return {
      ...metadata, bookId: chapter.bookId, chapterId: chapter.id, chapterNumber: chapter.number,
      levelScore: 100, status: "generating", text: chapter.originalText,
      sentences: original.map((text, index) => ({ index, text, originalText: text })),
      tokens: tokenize(original), reinforcedWords: [],
    };
  }
  if (typeof draft !== "object" || draft === null) throw new Error("Chapter draft must be an object");
  const candidate = draft as Record<string, unknown>;
  if (candidate.level !== metadata.level) throw new Error("Chapter draft does not match the requested Level");
  if (typeof candidate.levelScore !== "number" || !Number.isFinite(candidate.levelScore)
    || candidate.levelScore < 0 || candidate.levelScore > 100) throw new Error("Invalid Level Score");
  if (!Array.isArray(candidate.sentences) || !candidate.sentences.length) throw new Error("Chapter sentences are required");
  let previousOriginalIndex = -1;
  const sentences = candidate.sentences.map((row: unknown, index) => {
    if (typeof row !== "object" || row === null) throw new Error("Invalid Chapter sentence");
    const value = row as Record<string, unknown>;
    if (typeof value.text !== "string" || !value.text.trim()) throw new Error("Empty Chapter sentence");
    if (!Number.isInteger(value.originalSentenceIndex) || typeof value.originalSentenceIndex !== "number"
      || !original[value.originalSentenceIndex]) throw new Error("Invalid original sentence reference");
    if (value.originalSentenceIndex < previousOriginalIndex || value.originalSentenceIndex > previousOriginalIndex + 1) {
      throw new Error("Sentence mappings must cover the original Chapter in order");
    }
    previousOriginalIndex = value.originalSentenceIndex;
    return { index, text: value.text.trim(), originalText: original[value.originalSentenceIndex] };
  });
  if (previousOriginalIndex !== original.length - 1) throw new Error("Sentence mappings must cover the full original Chapter");
  if (!Array.isArray(candidate.reinforcedWords)) throw new Error("Reinforced Words must be an array");
  const reinforcedWords = candidate.reinforcedWords.map((row: unknown): ReinforcedWord => {
    if (typeof row !== "object" || row === null) throw new Error("Invalid Reinforced Word");
    const value = row as Record<string, unknown>;
    if (typeof value.word !== "string" || !value.word.trim()
      || (value.reinforcement !== "plain" && value.reinforcement !== "context-clue" && value.reinforcement !== "inline-definition")
      || typeof value.sentenceIndex !== "number" || !Number.isInteger(value.sentenceIndex)
      || !sentences[value.sentenceIndex]) throw new Error("Invalid Reinforced Word");
    return { word: value.word, reinforcement: value.reinforcement, sentenceIndex: value.sentenceIndex };
  });
  return {
    ...metadata, bookId: chapter.bookId, chapterId: chapter.id, chapterNumber: chapter.number,
    levelScore: candidate.levelScore, status: "generating", text: sentences.map((row) => row.text).join(" "),
    sentences, tokens: tokenize(sentences.map((row) => row.text)), reinforcedWords,
  };
}

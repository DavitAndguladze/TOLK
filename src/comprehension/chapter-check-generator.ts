import type { Chapter, ChapterCheck, ChapterVersion, ComplexWord, Sentence } from "../types";

/** The seam Role 4 implements. Role 3's real Chapter generator calls this instead of writing its own questions. */
export type ChapterCheckGenerator = (chapter: Chapter, version: ChapterVersion) => Promise<ChapterCheck>;

const FILLER_CHOICES = ["to decide something quickly", "to speak very loudly"];

const ORDINALS = ["first", "second", "third"];

/** Picks the served sentence whose text shares the most words with `needle`; falls back to the first sentence. */
function bestMatchingSentence(sentences: Sentence[], needle: string): number {
  const words = needle.toLowerCase().match(/[a-z']+/g) ?? [];
  let best = { index: sentences[0]?.index ?? 0, score: -1 };
  for (const sentence of sentences) {
    const haystack = sentence.text.toLowerCase(); // the served text only: the answer must be readable here (comms 0016)
    const score = words.filter((w) => haystack.includes(w)).length;
    if (score > best.score) best = { index: sentence.index, score };
  }
  return best.index;
}

/** Dedupes (two Complex Words could share a meaning) and rotates by a word-derived offset, not
 *  Math.random(), so the correct meaning isn't always the first choice but tests stay reproducible. */
function complexWordChoices(target: ComplexWord, all: ComplexWord[]): string[] {
  const distractors = all.filter((w) => w.word !== target.word).map((w) => w.meaning);
  const choices = [...new Set([target.meaning, ...distractors, ...FILLER_CHOICES])].slice(0, 3);
  const offset = target.word.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % choices.length;
  return [...choices.slice(offset), ...choices.slice(0, offset)];
}

/**
 * Complex Words are Chapter-level (the author's original vocabulary) and may not appear in a
 * simplified Chapter Version's text - that's the point of simplifying. A word the Reader never
 * saw can't be answered from the text (comms 0016), so only words in this Version are asked
 * about, and a Version with none gets no Complex Word question.
 */
function wordsInVersion(words: ComplexWord[], version: ChapterVersion): ComplexWord[] {
  const present = new Set(version.tokens.map((t) => t.normalized));
  return words.filter((w) => present.has(w.word.toLowerCase()));
}

/**
 * Deterministic stand-in for the AI gateway's "generate Chapter Check" call: 2-3 Key Point
 * questions, 1-2 Complex Word questions. Real OCI Generative AI swaps in later behind this
 * same signature - keep the shape (not the prose) the thing tests depend on.
 */
export const generateChapterCheck: ChapterCheckGenerator = async (chapter, version) => {
  // Caps at the ticket's 2-3 / 1-2 ranges. A Chapter with fewer Key Points/Complex Words than
  // that (none exist yet - ingestion always provides 3-5 per the spec) degrades to fewer
  // questions rather than throwing; revisit if #04's real ingestion ever produces a sparse Chapter.
  const keyPointCount = Math.min(3, Math.max(2, chapter.keyPoints.length));
  const complexWordCount = Math.min(2, Math.max(1, chapter.complexWords.length));

  const keyPointQuestions = chapter.keyPoints.slice(0, keyPointCount).map((kp, i) => ({
    id: `${version.id}-kp-${i}`,
    kind: "key-point" as const,
    // Asks by position, not by quoting the Key Point - quoting it answers the question in the asking.
    prompt: `What's the ${ORDINALS[i] ?? `${i + 1}th`} important thing that happens in this chapter?`,
    keyPointId: kp.id,
    answerSentenceIndex: bestMatchingSentence(version.sentences, kp.text),
  }));

  const complexWordQuestions = wordsInVersion(chapter.complexWords, version)
    .slice(0, complexWordCount)
    .map((cw, i) => ({
      id: `${version.id}-cw-${i}`,
      kind: "complex-word" as const,
      prompt: `What does '${cw.word}' mean in this chapter?`,
      word: cw.word,
      choices: complexWordChoices(cw, chapter.complexWords),
      answerSentenceIndex: bestMatchingSentence(version.sentences, cw.word),
    }));

  return {
    id: `check-${version.id}`,
    chapterVersionId: version.id,
    questions: [...keyPointQuestions, ...complexWordQuestions],
  };
};
